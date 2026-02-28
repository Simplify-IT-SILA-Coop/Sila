import os
import httpx
from dotenv import load_dotenv

load_dotenv()

WHATSAPP_API = "https://graph.facebook.com/v21.0"

async def send_whatsapp_message(to: str, text: str):
    token = os.getenv("WHATSAPP_TOKEN")
    phone_id = os.getenv("WHATSAPP_PHONE_ID")

    if not token or not phone_id:
        print(f"[WhatsApp] ❌ Credentials missing. Token: {bool(token)}, PhoneID: {phone_id}")
        return

    # Sanitize phone number (strip non-digits, take last 15)
    clean_to = "".join(filter(str.isdigit, to))[-15:]
    
    url = f"{WHATSAPP_API}/{phone_id}/messages"
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": clean_to,
        "type": "text",
        "text": {"body": text[:4096], "preview_url": False},
    }

    print(f"[WhatsApp] Sending to {to} via {url}")

    async with httpx.AsyncClient() as client:
        try:
            res = await client.post(
                url,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                json=payload
            )
            
            response_text = res.text
            if res.status_code != 200:
                print(f"[WhatsApp] ❌ Send failed ({res.status_code}): {response_text}")
            else:
                print(f"[WhatsApp] ✅ Sent successfully: {response_text}")
        except Exception as e:
            print(f"[WhatsApp] ❌ Network error: {e}")
