from fastapi import APIRouter, Request, Query, HTTPException, BackgroundTasks
from sqlalchemy import select
import os
import hmac
import hashlib
import json
from database import async_session
from models import User, Package, Booking
from services.ai_service import parse_user_message, generate_response
from services.pricing_service import calculate_price
from services.whatsapp_service import (
    send_whatsapp_message,
    download_media,
    upload_media,
    send_whatsapp_audio,
)
from services.voice_service import transcribe_audio, text_to_speech

router = APIRouter()

STATES = {
    'START': 'START',
    'AWAITING_NAME': 'AWAITING_NAME',
    'AWAITING_CITY_FROM': 'AWAITING_CITY_FROM',
    'AWAITING_CITY_TO': 'AWAITING_CITY_TO',
    'AWAITING_PICKUP_ADDRESS': 'AWAITING_PICKUP_ADDRESS',
    'AWAITING_DELIVERY_ADDRESS': 'AWAITING_DELIVERY_ADDRESS',
    'AWAITING_DESCRIPTION': 'AWAITING_DESCRIPTION',
    'AWAITING_BOOKING_OPTION': 'AWAITING_BOOKING_OPTION',
}


async def send_reply(from_phone: str, text: str, reply_as_audio: bool = False):
    """Send reply as text + audio (if voice was used) or just text."""
    # Always send text first
    await send_whatsapp_message(from_phone, text)

    if reply_as_audio:
        try:
            audio_path = await text_to_speech(text, lang="ar")
            if audio_path:
                media_id = await upload_media(audio_path)
                await send_whatsapp_audio(from_phone, media_id)
                # Clean up temp file
                os.unlink(audio_path)
                print(f"[Bot] 🔊 Audio reply sent to {from_phone}")
        except Exception as e:
            print(f"[Bot] ⚠️ Audio reply failed (text was still sent): {e}")


async def handle_message(from_phone: str, body_text: str, reply_as_audio: bool = False):
    """Background task: creates its own DB session."""
    try:
        # Send immediate "typing / processing" indicator
        await send_whatsapp_message(from_phone, "⏳ جاري التفكير...")
    except Exception as e:
        print(f"[Bot] Could not send typing indicator: {e}")

    async with async_session() as db:
        try:
            print(f"[Bot] Processing message from {from_phone}: '{body_text}' (audio={reply_as_audio})")

            # 1. Get or Create User
            stmt = select(User).where(User.phone == from_phone)
            result = await db.execute(stmt)
            user = result.scalars().first()

            if not user:
                print(f"[Bot] Creating new user for phone: {from_phone}")
                user = User(id=from_phone, phone=from_phone, conversationState=STATES['START'])
                db.add(user)
                await db.commit()
                await db.refresh(user)

            print(f"[Bot] User state: {user.conversationState}")

            reply_text = ""
            context = f"User: {user.fullName or 'Unknown'}. State: {user.conversationState}. Cities: {user.cityFrom or '?'} to {user.cityTo or '?'}."
            state = user.conversationState

            if state == STATES['START']:
                reply_text = await generate_response(body_text, context, "Introduce Sila delivery and ask for their full name to begin registration.")
                user.conversationState = STATES['AWAITING_NAME']

            elif state == STATES['AWAITING_NAME']:
                user.fullName = body_text
                user.conversationState = STATES['AWAITING_CITY_FROM']
                reply_text = await generate_response(body_text, context, "Greet them by name and ask which city they want to send from.")

            elif state == STATES['AWAITING_CITY_FROM']:
                user.cityFrom = body_text
                user.conversationState = STATES['AWAITING_CITY_TO']
                reply_text = await generate_response(body_text, context, "Acknowledge and ask for the destination city.")

            elif state == STATES['AWAITING_CITY_TO']:
                user.cityTo = body_text
                user.conversationState = STATES['AWAITING_PICKUP_ADDRESS']
                reply_text = await generate_response(body_text, context, "Ask for the specific pickup address.")

            elif state == STATES['AWAITING_PICKUP_ADDRESS']:
                user.pickupAddress = body_text
                user.conversationState = STATES['AWAITING_DELIVERY_ADDRESS']
                reply_text = await generate_response(body_text, context, "Ask for the specific delivery address.")

            elif state == STATES['AWAITING_DELIVERY_ADDRESS']:
                user.deliveryAddress = body_text
                user.conversationState = STATES['AWAITING_DESCRIPTION']
                reply_text = await generate_response(body_text, context, "Ask for a description of the package (weight, contents, fragility).")

            elif state == STATES['AWAITING_DESCRIPTION']:
                parsed = await parse_user_message(body_text)
                weight = parsed.weight_kg or 2.0
                fragile = bool(parsed.fragile)

                solo_price = calculate_price({'cityFrom': user.cityFrom or '', 'cityTo': user.cityTo or '', 'weightKg': weight, 'fragile': fragile, 'type': 'SOLO'})
                group_price = calculate_price({'cityFrom': user.cityFrom or '', 'cityTo': user.cityTo or '', 'weightKg': weight, 'fragile': fragile, 'type': 'GROUP'})

                new_pkg = Package(
                    userId=user.id, weightKg=weight, fragile=fragile,
                    cityFrom=user.cityFrom or '', cityTo=user.cityTo or '',
                    pickupAddress=user.pickupAddress or '', deliveryAddress=user.deliveryAddress or '',
                    status='PENDING'
                )
                db.add(new_pkg)
                await db.flush()

                options_context = f"Solo: {solo_price} MAD (Fast), Group: {group_price} MAD (Economy)."
                reply_text = await generate_response(body_text, options_context, "Present these two pricing options clearly and ask the user to choose 1 or 2.")
                user.conversationState = STATES['AWAITING_BOOKING_OPTION']

            elif state == STATES['AWAITING_BOOKING_OPTION']:
                choice = 'SOLO' if ('1' in body_text or 'solo' in body_text.lower()) else 'GROUP'
                stmt = select(Package).where(Package.userId == user.id).order_by(Package.createdAt.desc())
                result = await db.execute(stmt)
                last_pkg = result.scalars().first()

                if last_pkg:
                    final_price = calculate_price({'cityFrom': last_pkg.cityFrom, 'cityTo': last_pkg.cityTo, 'weightKg': last_pkg.weightKg, 'fragile': last_pkg.fragile, 'type': choice})
                    booking = Booking(packageId=last_pkg.id, type=choice, estimatedCost=final_price, status='CONFIRMED')
                    db.add(booking)
                    if choice == 'GROUP':
                        last_pkg.status = 'WAITING_FOR_GROUP'

                reply_text = await generate_response(body_text, f"Confirmed {choice}.", "Thank the user and say we will contact them soon.")
                user.conversationState = STATES['START']

            else:
                reply_text = await generate_response(body_text, context, "State unknown. Ask how you can help.")
                user.conversationState = STATES['START']

            await db.commit()
            print(f"[Bot] Sending reply to {from_phone}: '{reply_text[:60]}...'")
            await send_reply(from_phone, reply_text, reply_as_audio=reply_as_audio)

        except Exception as e:
            print(f"[Bot] ❌ Error processing message: {e}")
            import traceback
            traceback.print_exc()


async def handle_audio_message(from_phone: str, audio_id: str):
    """Handle incoming voice message: transcribe → process → reply with audio."""
    try:
        print(f"[Bot] 🎤 Received voice message from {from_phone}, media_id: {audio_id}")

        # Send typing indicator
        await send_whatsapp_message(from_phone, "🎤 جاري الاستماع للرسالة الصوتية...")

        # Download the audio
        audio_bytes = await download_media(audio_id)

        # Transcribe
        transcribed_text = await transcribe_audio(audio_bytes)

        if not transcribed_text.strip():
            await send_whatsapp_message(from_phone, "⚠️ ما قدرتش نفهم الرسالة الصوتية. عاود حاول ولا كتب لينا. 📝")
            return

        print(f"[Bot] 🎤→📝 Transcribed: '{transcribed_text}'")

        # Process as normal text message, but reply with audio too
        await handle_message(from_phone, transcribed_text, reply_as_audio=True)

    except Exception as e:
        print(f"[Bot] ❌ Voice processing error: {e}")
        import traceback
        traceback.print_exc()
        await send_whatsapp_message(from_phone, "⚠️ مشكل فالرسالة الصوتية. عاود حاول ولا كتب لينا. 📝")


@router.post("/webhook")
async def webhook_post(request: Request, background_tasks: BackgroundTasks):
    print("[Webhook] ===== POST /webhook received =====")
    raw_body = await request.body()

    # Signature verification
    signature = request.headers.get("x-hub-signature-256")
    app_secret = os.getenv("WHATSAPP_APP_SECRET")
    if app_secret and signature:
        try:
            sha_name, sig_hash = signature.split("=", 1)
            if sha_name == "sha256":
                expected = hmac.new(app_secret.encode(), raw_body, hashlib.sha256).hexdigest()
                if not hmac.compare_digest(sig_hash, expected):
                    print("[Webhook] ⚠️ Signature mismatch (allowing for debug)")
        except Exception as e:
            print(f"[Webhook] Signature check error: {e}")

    try:
        body = json.loads(raw_body)
    except Exception:
        return {"error": "Invalid JSON"}

    print(f"[Webhook] object={body.get('object')}, entries={len(body.get('entry', []))}")

    if body.get("object") == "whatsapp_business_account" and "entry" in body:
        for entry in body["entry"]:
            for change in entry.get("changes", []):
                messages = change.get("value", {}).get("messages", [])
                for message in messages:
                    from_phone = message.get("from")
                    msg_type = message.get("type", "text")

                    print(f"[Webhook] 📨 Message type='{msg_type}' from={from_phone}")
                    print(f"[Webhook] 📨 Full message: {json.dumps(message, ensure_ascii=False)[:500]}")

                    if msg_type == "audio" and message.get("audio", {}).get("id"):
                        audio_id = message["audio"]["id"]
                        print(f"[Webhook] 🎤 Voice message from {from_phone}, audio_id: {audio_id}")
                        background_tasks.add_task(handle_audio_message, from_phone, audio_id)

                    elif msg_type == "text":
                        text_body = message.get("text", {}).get("body")
                        if from_phone and text_body:
                            print(f"[Webhook] 💬 Text from {from_phone}: '{text_body}'")
                            background_tasks.add_task(handle_message, from_phone, text_body)

                    else:
                        print(f"[Webhook] ⚠️ Unhandled message type: {msg_type}")

    return "EVENT_RECEIVED"


@router.get("/webhook")
async def webhook_get(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
):
    print(f"[Webhook] GET verification: mode={hub_mode}")
    verify_token = os.getenv("WHATSAPP_VERIFY_TOKEN")
    if hub_mode == "subscribe" and hub_verify_token == verify_token:
        print("[Webhook] ✅ Verification successful!")
        return int(hub_challenge) if hub_challenge else 0
    print("[Webhook] ❌ Verification failed")
    raise HTTPException(status_code=403, detail="Forbidden")
