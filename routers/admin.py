from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from database import get_db
from models import User, Package, Booking, GroupBatch, AuditLog
from typing import List

router = APIRouter(tags=["admin"])

@router.get("/api/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    revenue_stmt = select(func.sum(Booking.estimatedCost))
    revenue_res = await db.execute(revenue_stmt)
    revenue = revenue_res.scalar() or 0

    groups_stmt = select(func.count(GroupBatch.id)).where(GroupBatch.status.in_(['FORMING', 'EN_ROUTE']))
    groups_res = await db.execute(groups_stmt)
    active_groups = groups_res.scalar() or 0

    pkg_stmt = select(func.count(Package.id)).where(Package.status.in_(['PENDING', 'WAITING_FOR_GROUP']))
    pkg_res = await db.execute(pkg_stmt)
    pending_packages = pkg_res.scalar() or 0

    total_users_stmt = select(func.count(User.id))
    total_users_res = await db.execute(total_users_stmt)
    total_users = total_users_res.scalar() or 1
    verified_users_stmt = select(func.count(User.id)).where(User.govIdHash != None)
    verified_users_res = await db.execute(verified_users_stmt)
    verified_users = verified_users_res.scalar() or 0
    kyc_percent = (verified_users / total_users) * 100

    volume_data = []
    for month in range(1, 13):
        month_str = f"{month:02d}"
        vol_stmt = select(func.count(Package.id)).where(
            func.strftime('%m', Package.createdAt) == month_str
        )
        vol_res = await db.execute(vol_stmt)
        count = vol_res.scalar() or 0
        volume_data.append(count)

    max_vol = max(volume_data) if volume_data and max(volume_data) > 0 else 1
    normalized_volume = [int((v / max_vol) * 100) for v in volume_data]

    return {
        "revenue": int(revenue),
        "activeGroups": active_groups,
        "pendingPackages": pending_packages,
        "kycVerifiedPercent": kyc_percent,
        "volumeTrends": normalized_volume,
        "rawVolume": volume_data
    }

@router.get("/api/audit_logs")
async def get_audit_logs(db: AsyncSession = Depends(get_db)):
    try:
        stmt = select(AuditLog, User.fullName).join(User, AuditLog.actorId == User.id, isouter=True).order_by(AuditLog.createdAt.desc()).limit(10)
        result = await db.execute(stmt)
        
        logs = []
        for log, full_name in result.all():
            logs.append({
                "id": log.id,
                "action": log.action,
                "timestamp": log.createdAt.isoformat(),
                "performedBy": full_name or log.actorId
            })
        return logs
    except Exception as e:
        print(f"Audit log error: {e}")
        return []
