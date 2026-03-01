import os
import httpx
from dotenv import load_dotenv

load_dotenv()

WHATSAPP_API = "https://graph.facebook.com/v21.0"


def _get_credentials():
    token = os.getenv("WHATSAPP_TOKEN")
    phone_id = os.getenv("WHATSAPP_PHONE_ID")
    return token, phone_id


def _clean_phone(to: str) -> str:
    return "".join(filter(str.isdigit, to))[-15:]


async def send_whatsapp_message(to: str, text: str):
    """Send a text message via WhatsApp Cloud API."""
    token, phone_id = _get_credentials()
    if not token or not phone_id:
        print(f"[WhatsApp] ❌ Credentials missing. Token: {bool(token)}, PhoneID: {phone_id}")
        return

    clean_to = _clean_phone(to)
    url = f"{WHATSAPP_API}/{phone_id}/messages"
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": clean_to,
        "type": "text",
        "text": {"body": text[:4096], "preview_url": False},
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            res = await client.post(
                url,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            if res.status_code != 200:
                print(f"[WhatsApp] ❌ Text send failed ({res.status_code}): {res.text}")
            else:
                print(f"[WhatsApp] ✅ Text sent to {clean_to}")
        except Exception as e:
            print(f"[WhatsApp] ❌ Network error: {e}")


async def download_media(media_id: str) -> bytes:
    """Download media (voice message) from Meta Cloud API."""
    token, _ = _get_credentials()
    if not token:
        raise Exception("WHATSAPP_TOKEN missing")

    # Do NOT use follow_redirects=True, because if Meta redirects to a CDN, 
    # sending the Authorization header will cause a 400 error.
    async with httpx.AsyncClient(timeout=60.0) as client:
        # Step 1: Get the media URL
        print(f"[WhatsApp] 📥 Getting media URL for ID: {media_id}")
        res = await client.get(
            f"{WHATSAPP_API}/{media_id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        if res.status_code != 200:
            raise Exception(f"Get media URL failed ({res.status_code}): {res.text}")

        data = res.json()
        media_url = data.get("url")
        mime_type = data.get("mime_type", "audio/ogg")
        if not media_url:
            raise Exception(f"No URL in media response: {data}")

        print(f"[WhatsApp] 📥 Downloading media ({mime_type}) from {media_url[:80]}...")

        # Step 2: Download the actual file
        res2 = await client.get(
            media_url,
            headers={"Authorization": f"Bearer {token}"},
        )
        if res2.status_code != 200:
            raise Exception(f"Media download failed ({res2.status_code}): {res2.text[:200]}")

        audio_bytes = res2.content
        print(f"[WhatsApp] ✅ Downloaded {len(audio_bytes)} bytes of audio")
        return audio_bytes


async def upload_media(file_path: str) -> str:
    """Upload audio file to Meta Cloud API. Returns the media_id."""
    token, phone_id = _get_credentials()
    if not token or not phone_id:
        raise Exception("Credentials missing")

    url = f"{WHATSAPP_API}/{phone_id}/media"

    async with httpx.AsyncClient(timeout=30.0) as client:
        with open(file_path, "rb") as f:
            res = await client.post(
                url,
                headers={"Authorization": f"Bearer {token}"},
                data={"messaging_product": "whatsapp", "type": "audio/mpeg"},
                files={"file": ("audio.mp3", f, "audio/mpeg")},
            )

        if res.status_code != 200:
            raise Exception(f"Media upload failed ({res.status_code}): {res.text}")

        media_id = res.json().get("id")
        print(f"[WhatsApp] ✅ Uploaded audio, media_id: {media_id}")
        return media_id


async def send_whatsapp_audio(to: str, media_id: str):
    """Send an audio message via WhatsApp Cloud API."""
    token, phone_id = _get_credentials()
    if not token or not phone_id:
        print(f"[WhatsApp] ❌ Credentials missing")
        return

    clean_to = _clean_phone(to)
    url = f"{WHATSAPP_API}/{phone_id}/messages"
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": clean_to,
        "type": "audio",
        "audio": {"id": media_id},
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            res = await client.post(
                url,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            if res.status_code != 200:
                print(f"[WhatsApp] ❌ Audio send failed ({res.status_code}): {res.text}")
            else:
                print(f"[WhatsApp] ✅ Audio sent to {clean_to}")
        except Exception as e:
            print(f"[WhatsApp] ❌ Audio send error: {e}")
