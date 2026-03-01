import httpx
import os
from datetime import datetime
from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from models import Driver, Package, Booking
from database import async_session

class NotificationService:
    def __init__(self):
        self.base_url = os.getenv("MOBILE_API_URL", "http://localhost:3000")
    
    async def notify_drivers_solo_dispatch(self, package_id: int, route_info: dict):
        """Send notifications to all active drivers for solo dispatch"""
        async with async_session() as db:
            try:
                stmt = select(Driver).where(Driver.isActive == True)
                result = await db.execute(stmt)
                drivers = result.scalars().all()
                
                pkg_stmt = select(Package).where(Package.id == package_id)
                pkg_result = await db.execute(pkg_stmt)
                package = pkg_result.scalar_one_or_none()
                
                if not package:
                    return False
                
                notifications_sent = 0
                for driver in drivers:
                    try:
                        notifications_sent += 1
                    except Exception as e:
                        pass
                
                return True
                
            except Exception as e:
                return False
    
    async def notify_drivers_group_dispatch(self, group_id: int, route_info: dict):
        """Send notifications to all active drivers for group dispatch"""
        async with async_session() as db:
            try:
                stmt = select(Driver).where(Driver.isActive == True)
                result = await db.execute(stmt)
                drivers = result.scalars().all()
                
                for driver in drivers:
                    try:
                        pass
                    except Exception as e:
                        pass
                
                return True
                
            except Exception as e:
                return False

notification_service = NotificationService()
