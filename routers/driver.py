from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import Driver
from pydantic import BaseModel
import uuid

router = APIRouter(prefix="/api/drivers", tags=["drivers"])

class DriverCreate(BaseModel):
    phone: str
    fullName: str
    vehicleInfo: str | None = None

class DriverLogin(BaseModel):
    phone: str

@router.post("")
async def create_driver(data: DriverCreate, db: AsyncSession = Depends(get_db)):
    # Check if driver already exists
    stmt = select(Driver).where(Driver.phone == data.phone)
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Driver with this phone number already exists")

    new_driver = Driver(
        id=str(uuid.uuid4()),
        phone=data.phone,
        fullName=data.fullName,
        vehicleInfo=data.vehicleInfo
    )
    db.add(new_driver)
    await db.commit()
    await db.refresh(new_driver)
    return new_driver

@router.post("/login")
async def driver_login(data: DriverLogin, db: AsyncSession = Depends(get_db)):
    stmt = select(Driver).where(Driver.phone == data.phone)
    result = await db.execute(stmt)
    driver = result.scalar_one_or_none()

    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found. Please contact admin.")

    if not driver.isActive:
        raise HTTPException(status_code=403, detail="Driver account is inactive.")

    return {
        "id": driver.id,
        "phone": driver.phone,
        "fullName": driver.fullName,
        "vehicleInfo": driver.vehicleInfo
    }
