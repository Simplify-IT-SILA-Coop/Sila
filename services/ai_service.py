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
    intent: Literal['delivery_request', 'status_inquiry', 'general_greeting', 'solo_confirmation', 'group_confirmation', 'unknown'] = 'unknown'

# Reliable free models on OpenRouter (Active as of March 2025)
OR_AI_MODELS = [
    "google/gemma-3-27b-it:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "mistralai/mistral-small-3.1-24b-instruct:free",
    "openrouter/auto", 
]

# Specialized Darija/Arabic models on Hugging Face
HF_LLM_MODELS = [
    "MBZUAI-Paris/Atlas-Chat-9B", # Specialized for Moroccan Darija
    "Qwen/Qwen2.5-72B-Instruct",  # Best for general Arabic logic
]

async def call_ai(messages: List[dict], response_format: Optional[str] = None) -> Optional[str]:
    """Multi-Provider Dispatcher: Groq (Fast) -> Hugging Face (Deep) -> OpenRouter (Fallback)."""
    if not messages: return None

    # Fixes 'coli' vs 'column' hallucination
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
        # 🟢 1. Try GROQ (Primary - Fastest & Reliable)
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

        # 🟡 2. Try Hugging Face (Secondary - Specialized Darija)
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

        # 🟠 3. Try OpenRouter (Final Fallback - Multiple Free Models)
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
    system_prompt = """You are a Moroccan Delivery Data Extractor. 
The user speaks Moroccan Darija (using Arabic script or Arabizi like 'bghit', 'wa7ed'), French, or Arabic.
Extract the delivery details into JSON.
JSON Keys: language_detected, normalized_text (Fusha Arabic), weight_kg, fragile (bool), city_from, city_to, pickup_address, delivery_address, preferred_date, intent.
Values should be null if not found.
Intent can be: delivery_request, status_inquiry, general_greeting, unknown.
CRITICAL: 'coli' means 'package/parcel', NOT 'column'."""
    
    try:
        content = await call_ai([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_text}
        ], response_format="json_object")

        if content:
            return ParsedDelivery.model_validate_json(content)
    except Exception as e:
        print(f"[AI] Parse error: {e}")

    return ParsedDelivery(normalized_text=user_text)

async def generate_response(user_text: str, context: str, system_action: str, language: str = "darija") -> str:
    system_prompt = f"""You are 'Antigravity Delivery Bot', a helpful and professional Moroccan delivery assistant 📦🇲🇦.
You understand Moroccan Darija perfectly (including Arabizi/numbers like 'wa7ed', 'khmsa').
Tone: Friendly, efficient, Moroccan-centric. Use emojis.
Rules:
1. Reply ONLY in {language} (Moroccan Darija).
2. If the user mentions a city, acknowledge it.
3. Keep the reply short (1-3 sentences max).
4. Context of the current order: {context}
5. Your next task: {system_action}
CRITICAL: 'coli' means 'package/parcel', NOT 'column'."""

    try:
        content = await call_ai([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_text}
        ])
        if content:
            return content
    except Exception as e:
        print(f"[AI] Response error: {e}")

    # Instant hardcoded fallback if ALL AI models fail
    fallback_responses = {
        "Introduce": "مرحبا بيك فـ Antigravity Delivery! 📦🇲🇦 شنو سميتك الكاملة؟",
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
