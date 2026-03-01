from fastapi import APIRouter, Request, Query, HTTPException, BackgroundTasks
from fastapi.responses import PlainTextResponse
from sqlalchemy import select
import os
import hmac
import hashlib
import json
from database import async_session
from models import User, Package, Booking, AuditLog
from services.ai_service import parse_user_message, generate_response
from services.pricing_service import calculate_price
from services.whatsapp_service import (
    send_whatsapp_message,
    download_media,
    upload_media,
    send_whatsapp_audio,
)
from services.voice_service import transcribe_audio, text_to_speech
from services.notification_service import notification_service

router = APIRouter()

PROCESSED_MESSAGES = set()
MAX_PROCESSED_MESSAGES = 1000

STATES = {
    'START': 'START',
    'AWAITING_NAME': 'AWAITING_NAME',
    'AWAITING_CITY_FROM': 'AWAITING_CITY_FROM',
    'AWAITING_CITY_TO': 'AWAITING_CITY_TO',
    'AWAITING_PICKUP_ADDRESS': 'AWAITING_PICKUP_ADDRESS',
    'AWAITING_DELIVERY_ADDRESS': 'AWAITING_DELIVERY_ADDRESS',
    'AWAITING_DESCRIPTION': 'AWAITING_DESCRIPTION',
    'AWAITING_DEADLINE': 'AWAITING_DEADLINE',
    'AWAITING_BOOKING_OPTION': 'AWAITING_BOOKING_OPTION',
}


async def send_reply(from_phone: str, text: str, reply_as_audio: bool = False):
    """Send reply as audio ONLY (if voice was used), or text ONLY."""
    if reply_as_audio:
        try:
            import re
            clean_text = re.sub(r'[^\w\s\u0600-\u06FF.,!?؟]', '', text).strip()
            audio_path = await text_to_speech(clean_text, lang="ar")
            if audio_path:
                media_id = await upload_media(audio_path)
                await send_whatsapp_audio(from_phone, media_id)
                os.unlink(audio_path)
                return
        except Exception as e:
            pass

    await send_whatsapp_message(from_phone, text)


async def get_user_status_text(user_id: str, db) -> str:
    """Helper to fetch and format active package statuses."""
    stmt = select(Package).where(Package.userId == user_id).order_by(Package.createdAt.desc())
    result = await db.execute(stmt)
    packages = result.scalars().all()
    
    if not packages:
        return "لم نجد أي طلبات مسجلة باسمك حالياً. 📦"
    
    text = "إليك حالة طلباتك الحالية: 🚚\n"
    for p in packages[:3]:
        status_map = {
            'PENDING': 'في انتظار التأكيد ⏳',
            'WAITING_FOR_GROUP': 'في المجموعة، ننتظر المجموعة 📦',
            'PICKED_UP': 'تم الاستلام بواسطة الشاحنة 🚚',
            'EN_ROUTE': 'في طريقه للتوصيل 📍',
            'DELIVERED': 'تم التوصيل بنجاح ✅',
        }
        status_txt = status_map.get(p.status, p.status)
        text += f"\n- طلب #{p.id}: من {p.cityFrom} لـ {p.cityTo} ({status_txt})"
    
    return text

async def handle_message(from_phone: str, body_text: str, reply_as_audio: bool = False):
    """Refactored: Intent-driven state machine."""
    try:
        await send_whatsapp_message(from_phone, "⏳ جاري المعالجة...")
    except: pass

    async with async_session() as db:
        try:
            stmt = select(User).where(User.phone == from_phone)
            result = await db.execute(stmt)
            user = result.scalars().first()
            if not user:
                user = User(id=from_phone, phone=from_phone, conversationState=STATES['START'])
                db.add(user)
                log = AuditLog(action="New user registered", actorId=from_phone)
                db.add(log)
                await db.commit()
                await db.refresh(user)

            parsed = await parse_user_message(body_text)
            intent = parsed.intent
            context = f"Intent: {intent}, State: {user.conversationState}"
            state = user.conversationState

            if state == STATES['START'] and intent == 'general_greeting':
                reply_text = await generate_response(body_text, context, "Introduce yourself and ask for full name.")
                user.conversationState = STATES['AWAITING_NAME']

            elif state == STATES['START'] and intent == 'delivery_request':
                reply_text = await generate_response(body_text, context, "Ask for full name first.")
                user.conversationState = STATES['AWAITING_NAME']

            elif state == STATES['AWAITING_NAME']:
                user.fullName = parsed.normalized_text or body_text
                user.conversationState = STATES['AWAITING_CITY_FROM']
                reply_text = await generate_response(body_text, context, "Ask for pickup city.")

            elif state == STATES['AWAITING_CITY_FROM']:
                user.cityFrom = parsed.city_from or body_text
                user.conversationState = STATES['AWAITING_CITY_TO']
                reply_text = await generate_response(body_text, context, "Ask for delivery city.")

            elif state == STATES['AWAITING_CITY_TO']:
                user.cityTo = parsed.city_to or body_text
                user.conversationState = STATES['AWAITING_PICKUP_ADDRESS']
                reply_text = await generate_response(body_text, context, "Ask for pickup address.")

            elif state == STATES['AWAITING_PICKUP_ADDRESS']:
                user.pickupAddress = parsed.pickup_address or body_text
                user.conversationState = STATES['AWAITING_DELIVERY_ADDRESS']
                reply_text = await generate_response(body_text, context, "Ask for delivery address.")

            elif state == STATES['AWAITING_DELIVERY_ADDRESS']:
                user.deliveryAddress = parsed.delivery_address or body_text
                user.conversationState = STATES['AWAITING_DESCRIPTION']
                reply_text = await generate_response(body_text, context, "Ask for parcel weight and if it is fragile.")

            elif state == STATES['AWAITING_DESCRIPTION']:
                weight = parsed.weight_kg or 2.0
                fragile = bool(parsed.fragile)
                
                user.cityFrom = user.cityFrom or ''
                user.cityTo = user.cityTo or ''
                user.pickupAddress = user.pickupAddress or ''
                user.deliveryAddress = user.deliveryAddress or ''
                
                user.conversationState = STATES['AWAITING_DEADLINE']
                reply_text = await generate_response(body_text, context, "Ask for delivery deadline (when do you need it delivered?).")

            elif state == STATES['AWAITING_DEADLINE']:
                deadline_text = parsed.deadline or body_text
                
                solo_price = calculate_price({'cityFrom': user.cityFrom or '', 'cityTo': user.cityTo or '', 'weightKg': 2.0, 'fragile': False, 'type': 'SOLO'})
                group_price = calculate_price({'cityFrom': user.cityFrom or '', 'cityTo': user.cityTo or '', 'weightKg': 2.0, 'fragile': False, 'type': 'GROUP'})
                
                new_pkg = Package(
                    userId=user.id, weightKg=2.0, fragile=False,
                    cityFrom=user.cityFrom or '', cityTo=user.cityTo or '',
                    pickupAddress=user.pickupAddress or '', deliveryAddress=user.deliveryAddress or '',
                    status='PENDING'
                )
                db.add(new_pkg)
                await db.flush()
                
                price_context = f"SOLO: {solo_price} MAD, GROUP: {group_price} MAD. Deadline: {deadline_text}"
                reply_text = await generate_response(body_text, price_context, "Show prices and ask to choose 1 (Solo) or 2 (Group).")
                user.conversationState = STATES['AWAITING_BOOKING_OPTION']

            elif state == STATES['AWAITING_BOOKING_OPTION']:
                choice = 'SOLO' if ('1' in body_text or 'solo' in body_text.lower() or intent == 'solo_confirmation') else 'GROUP'
                stmt = select(Package).where(Package.userId == user.id).order_by(Package.createdAt.desc())
                res = await db.execute(stmt)
                last_pkg = res.scalars().first()
                
                if last_pkg:
                    cost = calculate_price({'cityFrom': last_pkg.cityFrom, 'cityTo': last_pkg.cityTo, 'weightKg': last_pkg.weightKg, 'fragile': last_pkg.fragile, 'type': choice})
                    booking = Booking(packageId=last_pkg.id, type=choice, estimatedCost=cost, status='CONFIRMED')
                    db.add(booking)
                    if choice == 'GROUP': 
                        last_pkg.status = 'WAITING_FOR_GROUP'
                    else: 
                        last_pkg.status = 'PENDING'
                        await notification_service.notify_drivers_solo_dispatch(
                            last_pkg.id, 
                            {'route': f"{last_pkg.cityFrom} → {last_pkg.cityTo}"}
                        )
                    
                    log = AuditLog(action=f"Confirmed {choice} booking", actorId=user.id)
                    db.add(log)
                
                reply_text = await generate_response(body_text, f"Choice: {choice}", "Confirm booking and say goodbye.")
                user.conversationState = STATES['START']

            else:
                reply_text = await generate_response(body_text, context, "Introduce yourself and offer help.")
                user.conversationState = STATES['START']

            await db.commit()
            
            await send_reply(from_phone, reply_text, reply_as_audio)
            
        except Exception as e:
            await db.rollback()
            error_text = "عذراً، يوجد مشكلة تقنية. يرجى إعادة إرسال الرسالة. 🛠️"
            await send_reply(from_phone, error_text, reply_as_audio)


async def handle_audio_message(from_phone: str, audio_id: str):
    """Handle incoming voice message: transcribe → process → reply with audio."""
    try:
        await send_whatsapp_message(from_phone, "🎤 جاري الاستماع للرسالة الصوتية...")

        audio_bytes = await download_media(audio_id)

        transcribed_text = await transcribe_audio(audio_bytes)

        if not transcribed_text.strip():
            await send_whatsapp_message(from_phone, "⚠️ لم نتمكن من فهم الرسالة الصوتية. يرجى المحاولة مرة أخرى أو كتابة الرسالة. 📝")
            return

        await handle_message(from_phone, transcribed_text, reply_as_audio=True)

    except Exception as e:
        await send_whatsapp_message(from_phone, "⚠️ مشكلة في معالجة الرسالة الصوتية. يرجى المحاولة مرة أخرى أو كتابة الرسالة. 📝")


@router.post("/webhook")
async def webhook_post(request: Request, background_tasks: BackgroundTasks):
    raw_body = await request.body()

    signature = request.headers.get("x-hub-signature-256")
    app_secret = os.getenv("WHATSAPP_APP_SECRET")
    if app_secret and signature:
        try:
            sha_name, sig_hash = signature.split("=", 1)
            if sha_name == "sha256":
                expected = hmac.new(app_secret.encode(), raw_body, hashlib.sha256).hexdigest()
                if not hmac.compare_digest(sig_hash, expected):
                    pass
        except Exception as e:
            pass

    try:
        body = json.loads(raw_body)
    except Exception:
        return {"error": "Invalid JSON"}

    if body.get("object") == "whatsapp_business_account" and "entry" in body:
        for entry in body["entry"]:
            for change in entry.get("changes", []):
                messages = change.get("value", {}).get("messages", [])
                for message in messages:
                    msg_id = message.get("id", "")
                    from_phone = message.get("from")
                    msg_type = message.get("type", "text")
                    
                    if not msg_id or not from_phone:
                        continue

                    if msg_id in PROCESSED_MESSAGES:
                        continue
                    
                    PROCESSED_MESSAGES.add(msg_id)
                    if len(PROCESSED_MESSAGES) > MAX_PROCESSED_MESSAGES:
                        PROCESSED_MESSAGES.clear()

                    if msg_type == "audio" and message.get("audio", {}).get("id"):
                        audio_id = message["audio"]["id"]
                        background_tasks.add_task(handle_audio_message, from_phone, audio_id)

                    elif msg_type == "text":
                        text_body = message.get("text", {}).get("body")
                        if text_body:
                            background_tasks.add_task(handle_message, from_phone, text_body)

    return "EVENT_RECEIVED"


@router.get("/webhook")
async def webhook_get(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
):
    verify_token = os.getenv("WHATSAPP_VERIFY_TOKEN")
    if hub_mode == "subscribe" and hub_verify_token == verify_token:
        return PlainTextResponse(content=hub_challenge)
    raise HTTPException(status_code=403, detail="Forbidden")
