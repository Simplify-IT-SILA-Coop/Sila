import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from database import engine, Base
from webhooks.whatsapp import router as whatsapp_router

load_dotenv()

app = FastAPI(title="Sila Delivery Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    # Environment Check
    print("\n=== ENVIRONMENT CHECK ===")
    vars_to_check = [
        "PORT", "WHATSAPP_TOKEN", "WHATSAPP_PHONE_ID", 
        "WHATSAPP_VERIFY_TOKEN", "WHATSAPP_APP_SECRET", 
        "OPENROUTER_API_KEY", "DATABASE_URL"
    ]
    for v in vars_to_check:
        val = os.getenv(v)
        print(f"{v}: {'✓ SET' if val else '✗ MISSING'}")
    print("=========================\n")

    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables created.")

@app.get("/health")
async def health():
    return {"status": "ok", "service": "python-backend"}

app.include_router(whatsapp_router)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 3002))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
