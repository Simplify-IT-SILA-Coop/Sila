from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, Integer, Boolean, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    phone: Mapped[str] = mapped_column(String, unique=True, index=True)
    fullName: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    govIdHash: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    conversationState: Mapped[str] = mapped_column(String, default="START")
    cityFrom: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    cityTo: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    pickupAddress: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    deliveryAddress: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    createdAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updatedAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    packages: Mapped[List["Package"]] = relationship(back_populates="user")
    logs: Mapped[List["AuditLog"]] = relationship(back_populates="actor")

class Driver(Base):
    __tablename__ = "drivers"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    phone: Mapped[str] = mapped_column(String, unique=True, index=True)
    fullName: Mapped[str] = mapped_column(String)
    vehicleInfo: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    isActive: Mapped[bool] = mapped_column(Boolean, default=True)
    earnings: Mapped[float] = mapped_column(Float, default=0.0)
    rating: Mapped[float] = mapped_column(Float, default=5.0)
    createdAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    packages: Mapped[List["Package"]] = relationship(back_populates="driver")

class Package(Base):
    __tablename__ = "packages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    userId: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    driverId: Mapped[Optional[str]] = mapped_column(String, ForeignKey("drivers.id"), nullable=True)
    groupId: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("group_batches.id"), nullable=True)
    weightKg: Mapped[float] = mapped_column(Float, default=2.0)
    fragile: Mapped[bool] = mapped_column(Boolean, default=False)
    cityFrom: Mapped[str] = mapped_column(String)
    cityTo: Mapped[str] = mapped_column(String)
    pickupAddress: Mapped[str] = mapped_column(String)
    deliveryAddress: Mapped[str] = mapped_column(String)
    status: Mapped[str] = mapped_column(String, default="PENDING")
    createdAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="packages")
    driver: Mapped[Optional["Driver"]] = relationship(back_populates="packages")
    group: Mapped[Optional["GroupBatch"]] = relationship(back_populates="packages")
    booking: Mapped[Optional["Booking"]] = relationship(back_populates="package")

class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    packageId: Mapped[int] = mapped_column(Integer, ForeignKey("packages.id"), unique=True)
    type: Mapped[str] = mapped_column(String)
    estimatedCost: Mapped[float] = mapped_column(Float)
    finalCost: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    deadline: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    status: Mapped[str] = mapped_column(String, default="PENDING")
    createdAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    package: Mapped["Package"] = relationship(back_populates="booking")

class GroupBatch(Base):
    __tablename__ = "group_batches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    routeSlug: Mapped[str] = mapped_column(String)
    status: Mapped[str] = mapped_column(String, default="FORMING")
    discountPercent: Mapped[float] = mapped_column(Float, default=20.0)
    deadline: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    approvedById: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    createdAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    packages: Mapped[List["Package"]] = relationship(back_populates="group")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    action: Mapped[str] = mapped_column(String)
    actorId: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    details: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    createdAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    actor: Mapped["User"] = relationship(back_populates="logs")
