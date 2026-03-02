import os
import httpx
import tempfile
import asyncio
import edge_tts
from dotenv import load_dotenv

load_dotenv()

HF_WHISPER_MODEL = "openai/whisper-large-v3"


async def transcribe_audio(audio_bytes: bytes) -> str:
    """Transcribe audio to text using Hugging Face Whisper (free tier).
    Supports Darija, Arabic, French, English.
    Exactly mirrors Madinati V0's implementation."""
    token = os.getenv("HUGGINGFACE_TOKEN")
    if not token or token == "your_huggingface_token_here":
        print("[Voice] ❌ HUGGINGFACE_TOKEN not set properly")
        return ""

    url = f"https://api-inference.huggingface.co/models/{HF_WHISPER_MODEL}"

    async with httpx.AsyncClient(timeout=120.0) as client:
        # Retry up to 3 times (model may need to load on HF cold start)
        for attempt in range(3):
            try:
                print(f"[Voice] 🎤 Transcribing {len(audio_bytes)} bytes (attempt {attempt + 1}/3)...")
                res = await client.post(
                    url,
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Content-Type": "application/octet-stream",  # Matches Madinati exactly
                    },
                    content=audio_bytes,
                )

                print(f"[Voice] 📡 Hugging Face Response Status: {res.status_code}")
                print(f"[Voice] 📡 Hugging Face Response Body: {res.text[:300]}")

                if res.status_code == 503:
                    # Model is loading — wait and retry
                    body = res.json()
                    wait_time = body.get("estimated_time", 20)
                    print(f"[Voice] ⏳ Whisper model loading... waiting {wait_time:.0f}s")
                    await asyncio.sleep(min(wait_time, 30))
                    continue

                if res.status_code != 200:
                    print(f"[Voice] ❌ Whisper API error ({res.status_code}): {res.text[:300]}")
                    return ""

                # Parse the response safely
                try:
                    data = res.json()
                except Exception as e:
                    print(f"[Voice] ❌ Failed to parse JSON from HF: {e}")
                    return ""

                # Handle both dict {"text": "..."} and list [{"text": "..."}] formats
                if isinstance(data, dict):
                    text = data.get("text", "").strip()
                elif isinstance(data, list) and len(data) > 0:
                    text = data[0].get("text", "").strip()
                else:
                    text = ""

                print(f"[Voice] ✅ Transcribed: '{text}'")
                return text

            except httpx.TimeoutException:
                print(f"[Voice] ⏰ Whisper timeout (attempt {attempt + 1}/3)")
            except Exception as e:
                print(f"[Voice] ❌ Transcription error: {e}")
                import traceback
                traceback.print_exc()
                return ""

    print("[Voice] ❌ All transcription attempts failed")
    return ""


# Arabic TTS voices
ARABIC_VOICE = "ar-MA-MounaNeural"
FRENCH_VOICE = "fr-MA-JamalNeural"


async def text_to_speech(text: str, lang: str = "ar") -> str | None:
    """Generate speech audio from text using edge-tts (100% free).
    Returns path to temporary .mp3 file, or None on failure."""

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
        import traceback
        traceback.print_exc()
        return None
