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

@router.get("")
async def list_drivers(db: AsyncSession = Depends(get_db)):
    stmt = select(Driver)
    result = await db.execute(stmt)
    return result.scalars().all()

class DriverUpdate(BaseModel):
    phone: str | None = None
    fullName: str | None = None
    vehicleInfo: str | None = None
    isActive: bool | None = None

@router.patch("/{driver_id}")
async def update_driver(driver_id: str, data: DriverUpdate, db: AsyncSession = Depends(get_db)):
    stmt = select(Driver).where(Driver.id == driver_id)
    result = await db.execute(stmt)
    driver = result.scalar_one_or_none()
    
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
        
    for field, value in data.dict(exclude_unset=True).items():
        setattr(driver, field, value)
        
    await db.commit()
    await db.refresh(driver)
    return driver

@router.delete("/{driver_id}")
async def delete_driver(driver_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Driver).where(Driver.id == driver_id)
    result = await db.execute(stmt)
    driver = result.scalar_one_or_none()
    
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
        
    await db.delete(driver)
    await db.commit()
    return {"status": "success", "message": "Driver deleted"}

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
        "vehicleInfo": driver.vehicleInfo,
        "earnings": driver.earnings,
        "rating": driver.rating,
        "isActive": driver.isActive
    }

@router.get("/{driver_id}/tasks")
async def get_driver_tasks(driver_id: str, db: AsyncSession = Depends(get_db)):
    from models import Package, Booking
    stmt = select(Package).where(
        (Package.status == 'PENDING') | 
        (Package.driverId == driver_id)
    ).order_by(Package.createdAt.desc())
    result = await db.execute(stmt)
    packages = result.scalars().all()
    
    tasks = []
    for pkg in packages:
        booking_stmt = select(Booking).where(Booking.packageId == pkg.id)
        booking_result = await db.execute(booking_stmt)
        booking = booking_result.scalar_one_or_none()
        
        task = {
            "id": pkg.id,
            "cityFrom": pkg.cityFrom,
            "cityTo": pkg.cityTo,
            "pickupAddress": pkg.pickupAddress,
            "deliveryAddress": pkg.deliveryAddress,
            "weightKg": pkg.weightKg,
            "fragile": pkg.fragile,
            "status": pkg.status,
            "createdAt": pkg.createdAt.isoformat(),
            "driverId": pkg.driverId,
            "estimatedCost": booking.estimatedCost if booking else None
        }
        tasks.append(task)
    
    return tasks

@router.post("/{driver_id}/tasks/{package_id}/accept")
async def accept_task(driver_id: str, package_id: int, db: AsyncSession = Depends(get_db)):
    from models import Package, AuditLog
    
    stmt = select(Package).where(Package.id == package_id)
    result = await db.execute(stmt)
    package = result.scalar_one_or_none()
    
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
    
    if package.status != 'PENDING':
        raise HTTPException(status_code=400, detail="Package is not available for assignment")
    
    package.driverId = driver_id
    package.status = 'ASSIGNED'
    
    log = AuditLog(action=f"Driver {driver_id} accepted package {package_id}", actorId=driver_id)
    db.add(log)
    
    await db.commit()
    await db.refresh(package)
    
    return {"status": "success", "message": "Task accepted successfully", "package": package}

@router.post("/{driver_id}/tasks/{package_id}/complete")
async def complete_task(driver_id: str, package_id: int, db: AsyncSession = Depends(get_db)):
    from models import Package, AuditLog
    
    stmt = select(Package).where(Package.id == package_id)
    result = await db.execute(stmt)
    package = result.scalar_one_or_none()
    
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
    
    if package.driverId != driver_id:
        raise HTTPException(status_code=403, detail="Package not assigned to this driver")
    
    if package.status != 'ASSIGNED':
        raise HTTPException(status_code=400, detail="Package cannot be completed in current status")
    
    package.status = 'DELIVERED'
    
    log = AuditLog(action=f"Driver {driver_id} completed package {package_id}", actorId=driver_id)
    db.add(log)
    
    await db.commit()
    await db.refresh(package)
    
    return {"status": "success", "message": "Task completed successfully", "package": package}
