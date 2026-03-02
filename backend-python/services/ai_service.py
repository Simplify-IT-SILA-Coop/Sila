import os
import json
import httpx
import asyncio
from pydantic import BaseModel
from typing import Optional, List, Literal
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
HUGGINGFACE_TOKEN = os.getenv("HUGGINGFACE_TOKEN")
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
    deadline: Optional[str] = None
    intent: Literal['delivery_request', 'status_inquiry', 'general_greeting', 'solo_confirmation', 'group_confirmation', 'price_inquiry', 'cancel_order', 'unknown'] = 'unknown'

OR_AI_MODELS = [
    "google/gemma-3-27b-it:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "mistralai/mistral-small-3.1-24b-instruct:free",
    "openrouter/auto", 
]

HF_LLM_MODELS = [
    "MBZUAI-Paris/Atlas-Chat-9B",
    "Qwen/Qwen2.5-72B-Instruct",
]

async def call_ai(messages: List[dict], response_format: Optional[str] = None) -> Optional[str]:
    """Multi-Provider Dispatcher: Groq (Fast) -> Hugging Face (Deep) -> OpenRouter (Fallback)."""
    if not messages: return None

    vocab_injection = (
        "\n\nVOCABULARY DICTIONARY (DARIJA/ARABIZI):\n"
        "- 'coli'/'colis' = Package/Parcel (NOT a building column)\n"
        "- 'nsift' = I want to send / to ship\n"
        "- 'Casa' = Casablanca, 'Tangier' = Tangier\n"
        "- 'ch7al' = How much / What is\n"
        "- 'taman' = Price/Cost/Fee\n"
        "- 'mn' = From, 'l' = To"
    )
    
    current_messages = [m.copy() for m in messages]
    if current_messages and current_messages[0]["role"] == "system":
        current_messages[0]["content"] += vocab_injection

    async with httpx.AsyncClient(timeout=30.0) as client:
        if GROQ_API_KEY:
            for model in ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"]:
                try:
                    print(f"[AI-Groq] Trying {model}...")
                    res = await client.post(
                        "https://api.groq.com/openai/v1/chat/completions",
                        headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
                        json={
                            "model": model,
                            "messages": current_messages,
                            "temperature": 0.5,
                            "max_tokens": 400
                        }
                    )
                    if res.status_code == 200:
                        content = res.json().get("choices", [{}])[0].get("message", {}).get("content", "")
                        if content:
                            print(f"[AI-Groq] ✅ Success with {model}")
                            return content.strip()
                except Exception as e:
                    print(f"[AI-Groq] ❌ Error: {e}")

        if HUGGINGFACE_TOKEN:
            hf_prompt = ""
            for m in current_messages:
                role = "Assistant" if m["role"] == "assistant" else "User" if m["role"] == "user" else "System"
                hf_prompt += f"<|im_start|>{role}\n{m['content']}<|im_end|>\n"
            hf_prompt += "<|im_start|>Assistant\n"

            for model in HF_LLM_MODELS:
                try:
                    print(f"[AI-HF] Trying specialized model: {model}...")
                    res = await client.post(
                        f"https://api-inference.huggingface.co/models/{model}",
                        headers={"Authorization": f"Bearer {HUGGINGFACE_TOKEN}"},
                        json={"inputs": hf_prompt, "parameters": {"max_new_tokens": 300, "temperature": 0.5}}
                    )
                    if res.status_code == 200:
                        data = res.json()
                        content = data[0].get("generated_text", "") if isinstance(data, list) else data.get("generated_text", "")
                        if content:
                            content = content.split("<|im_end|>")[0].strip()
                            print(f"[AI-HF] ✅ Success with {model}")
                            return content
                except Exception as e:
                    print(f"[AI-HF] ❌ Error: {e}")

        if OPENROUTER_API_KEY:
            for model in OR_AI_MODELS:
                try:
                    print(f"[AI-OR] Trying {model}...")
                    res = await client.post(
                        "https://openrouter.ai/api/v1/chat/completions",
                        headers={"Authorization": f"Bearer {OPENROUTER_API_KEY}"},
                        json={"model": model, "messages": current_messages, "temperature": 0.5}
                    )
                    if res.status_code == 200:
                        content = res.json().get("choices", [{}])[0].get("message", {}).get("content", "")
                        if content:
                            print(f"[AI-OR] ✅ Success with {model}")
                            return content.strip()
                except Exception as e:
                    print(f"[AI-OR] ❌ Error: {e}")

    return None

async def call_openrouter(messages: List[dict], response_format: Optional[str] = None) -> Optional[str]:
    return await call_ai(messages, response_format)

async def parse_user_message(user_text: str) -> ParsedDelivery:
    system_prompt = """You are a JSON extraction bot. Extract delivery details and respond ONLY with valid JSON.

Format:
{
  "language_detected": "darija|arabic|arabizi|french|english|unknown",
  "normalized_text": "text in Fusha Arabic",
  "weight_kg": number or null,
  "fragile": true/false or null,
  "city_from": "city name" or null,
  "city_to": "city name" or null,
  "pickup_address": "address" or null,
  "delivery_address": "address" or null,
  "preferred_date": "date" or null,
  "deadline": "deadline description" or null,
  "intent": "delivery_request|status_inquiry|general_greeting|solo_confirmation|group_confirmation|price_inquiry|cancel_order|unknown"
}

Intents:
- 'Bghit nsift coli/hamla' → delivery_request
- 'Fin wsla amana/coli?' → status_inquiry
- 'Ch7al taman?' → price_inquiry
- '7bess/Sfgh' → cancel_order
- Greetings → general_greeting
- 'Ah/Khyar' after prices → solo_confirmation or group_confirmation

CRITICAL: Respond ONLY with JSON, no markdown, no explanations."""
    
    try:
        content = await call_ai([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_text}
        ], response_format="json_object")

        if content:
            content = content.strip()
            if content.startswith('```json'):
                content = content[7:]
            if content.startswith('```'):
                content = content[3:]
            if content.endswith('```'):
                content = content[:-3]
            content = content.strip()
            
            try:
                return ParsedDelivery.model_validate_json(content)
            except Exception as json_error:
                return ParsedDelivery(
                    language_detected='arabic',
                    normalized_text=user_text,
                    intent='unknown'
                )
                
    except Exception as e:
        return ParsedDelivery(
            language_detected='arabic',
            normalized_text=user_text,
            intent='unknown'
        )

async def generate_response(user_text: str, context: str, system_action: str, language: str = "arabic") -> str:
    system_prompt = f"""You are 'Sila Delivery Bot', a helpful and professional delivery assistant .
You understand Arabic dialects but respond ONLY in Modern Standard Arabic (Fusha).
Tone: Professional, helpful, clear. Use emojis.
Rules:
1. Reply ONLY in Modern Standard Arabic (Fusha) using Arabic script.
2. If the user mentions a city, acknowledge it warmly (e.g. 'أهلاً بكم في تلك المدينة!').
3. Keep the reply short (1-3 sentences max). Use professional emojis .
4. Context: {context}
5. Next Action: {system_action}
6. If the user is asking for status, explain exactly where their parcel is.
CRITICAL: 'طرد' means package/parcel. 'سعر' = Price. 'شكراً' = Thank you."""

    try:
        content = await call_ai([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_text}
        ])
        if content:
            return content
    except Exception as e:
        print(f"[AI] Response error: {e}")

    fallback_responses = {
        "Introduce": "مرحباً بك في خدمة سيلا للتوصيل! 📦 ما هو اسمك الكامل؟",
        "name": "أهلاً بك! من أي مدينة ترغب في إرسال الطرد؟ 🏙️",
        "city": "ممتاز! إلى أي مدينة تريد توصيل الطرد؟ 📍",
        "pickup": "ما هو عنوان الاستلام بالضبط؟ 🏠",
        "delivery": "وما هو عنوان التوصيل؟ 📬",
        "description": "يرجى وصف الطرد: ما هو الوزن وهل هو هش؟ 📦",
        "options": "يرجى الاختيار: 1️⃣ فردي (سريع) أم 2️⃣ جماعي (اقتصادي)",
        "thank": "شكراً لك! 🙏 سنتواصل معك قريباً إن شاء الله ✅",
    }

    for key, response in fallback_responses.items():
        if key.lower() in system_action.lower():
            return response

    return "مرحباً! كيف يمكنني مساعدتك اليوم؟ 📦"
