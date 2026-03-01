import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

from services.voice_service import transcribe_audio

async def main():
    import httpx
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get("https://file-examples.com/wp-content/storage/2017/11/file_example_OOG_1MG.ogg")
            audio_bytes = res.content
    except Exception as e:
        print(f"Failed to download test audio: {e}")
        return
        
    print(f"Loaded {len(audio_bytes)} bytes of audio.")
    text = await transcribe_audio(audio_bytes)
    print(f"Final transcription: '{text}'")

if __name__ == "__main__":
    asyncio.run(main())
