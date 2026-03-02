import os
import json
import httpx
from pydantic import BaseModel
from typing import Optional, List, Literal
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

class ParsedDelivery(BaseModel):
    language_detected: Literal['darija', 'arabic', 'arabizi', 'french', 'english', 'unknown'] = 'unknown'
    normalized_text: str = ''
    weight_kg: Optional[float] = None
    fragile: Optional[bool] = None
    city_from: Optional[str] = None
    city_to: Optional[str] = None
    pickup_address: Optional[str] = None
    delivery_address: Optional[str] = None
    preferred_date: Optional[str] = None
    intent: Literal['delivery_request', 'status_inquiry', 'general_greeting', 'solo_confirmation', 'group_confirmation', 'unknown'] = 'unknown'

# Fastest free models first – these respond in < 3 seconds
FAST_FREE_MODELS = [
    'google/gemma-2-9b-it:free',
    'meta-llama/llama-3.1-8b-instruct:free',
    'mistralai/mistral-7b-instruct:free',
]

async def call_openrouter(messages: List[dict], response_format: Optional[dict] = None) -> Optional[str]:
    if not OPENROUTER_API_KEY:
        raise Exception("OPENROUTER_API_KEY missing")

    async with httpx.AsyncClient(timeout=15.0) as client:
        for model in FAST_FREE_MODELS:
            try:
                print(f"[AI] Trying model: {model}")
                payload = {
                    "model": model,
                    "messages": messages,
                    "temperature": 0.3,
                    "max_tokens": 200,
                }
                if response_format:
                    payload["response_format"] = response_format

                res = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json=payload,
                )

                if res.status_code == 200:
                    data = res.json()
                    content = data.get("choices", [{}])[0].get("message", {}).get("content")
                    if content:
                        print(f"[AI] ✅ Got response from {model} ({len(content)} chars)")
                        return content

                print(f"[AI] ⚠️ Model {model} returned {res.status_code}")
            except httpx.TimeoutException:
                print(f"[AI] ⏰ Model {model} timed out")
            except Exception as e:
                print(f"[AI] ❌ Model {model} error: {e}")

    return None

async def parse_user_message(user_text: str) -> ParsedDelivery:
    system_prompt = """Extract delivery info as JSON: {"language_detected":"darija","normalized_text":"...","weight_kg":null,"fragile":null,"city_from":null,"city_to":null,"pickup_address":null,"delivery_address":null,"preferred_date":null,"intent":"unknown"}"""
    try:
        content = await call_openrouter([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_text}
        ], response_format={"type": "json_object"})

        if content:
            return ParsedDelivery.model_validate_json(content)
    except Exception as e:
        print(f"[AI] Parse error: {e}")

    return ParsedDelivery(normalized_text=user_text)

async def generate_response(user_text: str, context: str, system_action: str, language: str = "darija") -> str:
    system_prompt = f"""You are a Moroccan Delivery Assistant. Be friendly, use emojis 🇲🇦. Reply in {language}.
Context: {context}
Action: {system_action}
Keep it SHORT (2-3 sentences max)."""

    try:
        content = await call_openrouter([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_text}
        ])
        if content:
            return content
    except Exception as e:
        print(f"[AI] Response error: {e}")

    # Instant hardcoded fallback if ALL AI models fail
    fallback_responses = {
        "Introduce": "مرحبا بيك فـ Sila Delivery! 📦🇲🇦 شنو سميتك الكاملة؟",
        "name": "أهلا! من أنهي مدينة بغيتي تسيفط؟ 🏙️",
        "city": "وكيلي! لأنهي مدينة بغيتي توصل الطرد؟ 📍",
        "pickup": "فين بالضبط نجيو نديو الطرد؟ عطينا العنوان 🏠",
        "delivery": "وفين نوصلوه؟ عطينا عنوان التوصيل 📬",
        "description": "وصف لينا الطرد: شحال فالوزن؟ واش فراجيل؟ 📦",
        "options": "اختار: 1️⃣ سولو (سريع) ولا 2️⃣ غروب (اقتصادي)",
        "thank": "شكرا ليك! 🙏 غادي نتواصلو معاك قريبا إن شاء الله ✅",
    }

    for key, response in fallback_responses.items():
        if key.lower() in system_action.lower():
            return response

    return "مرحبا! كيفاش نقدر نعاونك اليوم؟ 📦🇲🇦"
