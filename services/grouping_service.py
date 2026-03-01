from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from models import Package, GroupBatch, AuditLog
from services.pricing_service import generate_route_slug

async def assign_package_to_group(db: AsyncSession, package_id: int, city_from: str, city_to: str):
    slug = generate_route_slug(city_from, city_to)
    
    # Find forming group
    stmt = select(GroupBatch).where(GroupBatch.routeSlug == slug, GroupBatch.status == 'FORMING')
    result = await db.execute(stmt)
    group = result.scalars().first()
    
    if not group:
        group = GroupBatch(routeSlug=slug, status='FORMING', discountPercent=20.0)
        db.add(group)
        await db.flush()
        
        log = AuditLog(action='GROUP_CREATED', actorId='SYSTEM', details={'groupId': group.id, 'routeSlug': slug})
        db.add(log)
        
    # Update package
    await db.execute(
        update(Package)
        .where(Package.id == package_id)
        .values(groupId=group.id, status='WAITING_FOR_GROUP')
    )
    
    log = AuditLog(action='PACKAGE_ASSIGNED_TO_GROUP', actorId='SYSTEM', details={'groupId': group.id, 'packageId': package_id})
    db.add(log)
    await db.commit()
    return group

async def confirm_group_batch(db: AsyncSession, group_id: int, actor_id: str = 'SYSTEM'):
    # This would involve deeper logic to update all packages and bookings
    # For now, simplistic port:
    stmt = select(GroupBatch).where(GroupBatch.id == group_id)
    result = await db.execute(stmt)
    group = result.scalars().first()
    
    if group:
        group.status = 'CONFIRMED'
        group.approvedById = actor_id
        await db.commit()
    return group
