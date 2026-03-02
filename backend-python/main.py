import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from database import engine, Base
from webhooks.whatsapp import router as whatsapp_router
from routers.driver import router as driver_router
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends
from database import get_db
from models import User, Package, Booking, GroupBatch, AuditLog
from contextlib import asynccontextmanager

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("\n=== ENVIRONMENT CHECK ===")
    vars_to_check = [
        "PORT", "WHATSAPP_TOKEN", "WHATSAPP_PHONE_ID", 
        "WHATSAPP_VERIFY_TOKEN", "WHATSAPP_APP_SECRET", 
        "OPENROUTER_API_KEY", "DATABASE_URL"
    ]
    for v in vars_to_check:
        val = os.getenv(v)
        status = "OK" if val else "MISSING"
        print(f"{v}: {status}")
    print("=========================\n")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables created.")
    
    yield

app = FastAPI(title="Sila Delivery Backend", lifespan=lifespan)

@app.get("/api/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    print("[Stats] Called")
    try:
        rev_res = await db.execute(select(func.sum(Booking.estimatedCost)))
        revenue = rev_res.scalar() or 0

        groups_res = await db.execute(select(func.count(GroupBatch.id)).where(GroupBatch.status.in_(['FORMING', 'EN_ROUTE'])))
        active_groups = groups_res.scalar() or 0

        pkg_res = await db.execute(select(func.count(Package.id)).where(Package.status.in_(['PENDING', 'WAITING_FOR_GROUP'])))
        pendingCount = pkg_res.scalar() or 0

        users_res = await db.execute(select(func.count(User.id)))
        total_u = users_res.scalar() or 1
        ver_res = await db.execute(select(func.count(User.id)).where(User.govIdHash != None))
        ver_u = ver_res.scalar() or 0

        volume = []
        for m in range(1, 13):
            m_s = f"{m:02d}"
            v_res = await db.execute(select(func.count(Package.id)).where(func.strftime('%m', Package.createdAt) == m_s))
            volume.append(v_res.scalar() or 0)
        
        max_v = max(volume) if volume and max(volume) > 0 else 1
        trends = [int((v / max_v) * 100) for v in volume]

        return {
            "revenue": int(revenue),
            "activeGroups": active_groups,
            "pendingPackages": pendingCount,
            "kycVerifiedPercent": (ver_u / total_u) * 100,
            "volumeTrends": trends,
            "rawVolume": volume
        }
    except Exception as e:
        print(f"Stats error: {e}")
        return {"error": str(e)}

@app.get("/api/audit_logs")
async def get_audit_logs(db: AsyncSession = Depends(get_db)):
    try:
        stmt = select(AuditLog, User.fullName).join(User, AuditLog.actorId == User.id, isouter=True).order_by(AuditLog.createdAt.desc()).limit(10)
        res = await db.execute(stmt)
        logs = []
        for log, name in res.all():
            logs.append({
                "id": log.id,
                "action": log.action,
                "timestamp": log.createdAt.isoformat(),
                "performedBy": name or log.actorId
            })
        return logs
    except Exception as e:
        print(f"Logs error: {e}")
        return []

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "python-backend"}


app.include_router(whatsapp_router)
app.include_router(driver_router)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 3003))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
