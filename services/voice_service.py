import os
import httpx
import tempfile
import asyncio
import edge_tts
from dotenv import load_dotenv

load_dotenv()

HF_WHISPER_MODEL = "anaszil/whisper-large-v3-turbo-darija"


async def transcribe_audio(audio_bytes: bytes) -> str:
    """
    Optimized Transcription:
    1. Try Groq (blazing fast, no cold starts, 1-2s response).
    2. Fallback to Hugging Face (slower, but good backup).
    """
    
    # 1. Try Groq first if key exists
    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key and groq_key != "your_groq_api_key_here":
        text = await _transcribe_groq(audio_bytes, groq_key)
        if text:
            return text
        print("[Voice] ⚠️ Groq failed, falling back to Hugging Face...")

    # 2. Fallback to Hugging Face
    hf_token = os.getenv("HUGGINGFACE_TOKEN")
    if hf_token and hf_token != "your_huggingface_token_here":
        return await _transcribe_hf(audio_bytes, hf_token)

    print("[Voice] ❌ No valid AI tokens (GROQ or HF) for transcription.")
    return ""


async def _transcribe_groq(audio_bytes: bytes, api_key: str) -> str:
    """Use Groq's high-speed Whisper model."""
    try:
        print(f"[Voice] ⚡ Transcribing via Groq API...")
        # Groq requires a file-like upload, so we use a tempfile
        tmp = tempfile.NamedTemporaryFile(suffix=".ogg", delete=False)
        tmp.write(audio_bytes)
        tmp.close()

        async with httpx.AsyncClient(timeout=15.0) as client:
            with open(tmp.name, "rb") as f:
                res = await client.post(
                    "https://api.groq.com/openai/v1/audio/transcriptions",
                    headers={"Authorization": f"Bearer {api_key}"},
                    data={"model": "whisper-large-v3-turbo", "language": "ar"},  # Hint it's Arabic/Darija
                    files={"file": ("audio.ogg", f, "audio/ogg")},
                )
            
        os.unlink(tmp.name)

        if res.status_code == 200:
            text = res.json().get("text", "").strip()
            print(f"[Voice] ✅ Groq Transcribed: '{text}'")
            return text
        else:
            print(f"[Voice] ❌ Groq API error ({res.status_code}): {res.text[:200]}")
            return ""

    except Exception as e:
        print(f"[Voice] ❌ Groq error: {e}")
        return ""


async def _transcribe_hf(audio_bytes: bytes, token: str) -> str:
    """Use Hugging Face Inference API."""
    url = f"https://api-inference.huggingface.co/models/{HF_WHISPER_MODEL}"
    async with httpx.AsyncClient(timeout=60.0) as client:
        for attempt in range(2):  # Only 2 attempts to save time
            try:
                print(f"[Voice] 🐢 Transcribing via Hugging Face (attempt {attempt + 1}/2)...")
                res = await client.post(
                    url,
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Content-Type": "application/octet-stream",
                    },
                    content=audio_bytes,
                )

                if res.status_code == 503:
                    wait_time = res.json().get("estimated_time", 10)
                    print(f"[Voice] ⏳ HF model loading... waiting {wait_time:.0f}s")
                    await asyncio.sleep(min(wait_time, 15))
                    continue

                if res.status_code != 200:
                    print(f"[Voice] ❌ HF API error ({res.status_code}): {res.text[:200]}")
                    return ""

                # Try parsing response
                try:
                    data = res.json()
                except Exception:
                    return ""

                if isinstance(data, dict):
                    text = data.get("text", "").strip()
                elif isinstance(data, list) and len(data) > 0:
                    text = data[0].get("text", "").strip()
                else:
                    text = ""

                print(f"[Voice] ✅ HF Transcribed: '{text}'")
                return text

            except Exception as e:
                print(f"[Voice] ❌ HF error: {e}")
                return ""
    return ""


# Arabic TTS voices
ARABIC_VOICE = "ar-MA-MounaNeural"
FRENCH_VOICE = "fr-MA-JamalNeural"


async def text_to_speech(text: str, lang: str = "ar") -> str | None:
    """Generate speech audio from text using edge-tts (100% free)."""
    voice = ARABIC_VOICE if lang == "ar" else FRENCH_VOICE
    try:
        tmp = tempfile.NamedTemporaryFile(suffix=".mp3", delete=False)
        tmp_path = tmp.name
        tmp.close()

        print(f"[Voice] 🔊 Generating TTS ({voice}): '{text[:60]}...'")
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(tmp_path)

        file_size = os.path.getsize(tmp_path)
        if file_size < 100:
            print(f"[Voice] ❌ TTS output too small ({file_size} bytes)")
            os.unlink(tmp_path)
            return None

        print(f"[Voice] ✅ TTS generated: {tmp_path} ({file_size} bytes)")
        return tmp_path

    except Exception as e:
        print(f"[Voice] ❌ TTS error: {e}")
        return None
