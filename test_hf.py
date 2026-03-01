import os
import httpx
import asyncio
from dotenv import load_dotenv

load_dotenv()

async def test():
    token = os.getenv("HUGGINGFACE_TOKEN")
    url = "https://api-inference.huggingface.co/models/openai/whisper-large-v3"
    
    # Download a sample ogg file to memory
    print("Downloading sample ogg...")
    async with httpx.AsyncClient() as client:
        res = await client.get("https://file-examples.com/wp-content/storage/2017/11/file_example_OOG_1MG.ogg")
        audio = res.content
        
    print(f"Token length: {len(token) if token else 0}")
    print(f"Audio size: {len(audio)}")
    
    async with httpx.AsyncClient(timeout=30) as client:
        res = await client.post(
            url,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/octet-stream", # Let's test octet-stream like Madinati
            },
            content=audio,
        )
        print(f"Status: {res.status_code}")
        print(f"Response: {res.text}")

asyncio.run(test())
