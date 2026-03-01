import asyncio
from services.whatsapp_service import download_media
from services.voice_service import transcribe_audio

async def main():
    try:
        print("1. Testing Audio Download via Meta API...")
        # A valid audio ID the user sent earlier
        audio_id = "1635588373722258" 
        try:
            audio_bytes = await download_media(audio_id)
            print(f"✅ Successfully downloaded {len(audio_bytes)} bytes")
        except Exception as e:
            print(f"❌ Download failed: {e}")
            return
            
        print("\n2. Testing Transcription...")
        text = await transcribe_audio(audio_bytes)
        print(f"✅ Final Transcription: '{text}'")

    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
