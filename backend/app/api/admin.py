from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_roles
from app.db.session import get_db
from app.models import Driver, Ride, User
from app.schemas.admin import AdminDriverOut, AdminRideOut, AdminStats, AdminUserOut

router = APIRouter(prefix="/admin", tags=["admin"])

admin_only = require_roles("admin")


@router.get("/stats", response_model=AdminStats)
async def stats(
    _: User = Depends(admin_only),
    db: AsyncSession = Depends(get_db),
):
    users_total = await db.scalar(select(func.count()).select_from(User))
    passengers_total = await db.scalar(
        select(func.count()).select_from(User).where(User.role == "passenger")
    )
    drivers_total = await db.scalar(
        select(func.count()).select_from(User).where(User.role == "driver")
    )
    drivers_online = await db.scalar(
        select(func.count()).select_from(Driver).where(Driver.is_online.is_(True))
    )
    rides_total = await db.scalar(select(func.count()).select_from(Ride))
    rides_completed = await db.scalar(
        select(func.count()).select_from(Ride).where(Ride.status == "completed")
    )
    rides_cancelled = await db.scalar(
        select(func.count()).select_from(Ride).where(Ride.status == "cancelled")
    )
    rides_active = await db.scalar(
        select(func.count())
        .select_from(Ride)
        .where(Ride.status.in_(["requested", "accepted", "started"]))
    )
    revenue = await db.scalar(
        select(func.coalesce(func.sum(Ride.fare), 0.0)).where(
            Ride.status == "completed"
        )
    )

    return AdminStats(
        users_total=users_total or 0,
        passengers_total=passengers_total or 0,
        drivers_total=drivers_total or 0,
        drivers_online=drivers_online or 0,
        rides_total=rides_total or 0,
        rides_completed=rides_completed or 0,
        rides_cancelled=rides_cancelled or 0,
        rides_active=rides_active or 0,
        revenue=round(float(revenue or 0.0), 2),
    )


@router.get("/users", response_model=list[AdminUserOut])
async def users(
    _: User = Depends(admin_only),
    db: AsyncSession = Depends(get_db),
):
    rows = (
        await db.scalars(
            select(User).order_by(User.created_at.desc()).limit(200)
        )
    ).all()
    return [
        AdminUserOut(
            id=u.id,
            name=u.name,
            email=u.email,
            phone=u.phone,
            role=u.role,
            created_at=u.created_at,
        )
        for u in rows
    ]


@router.get("/drivers", response_model=list[AdminDriverOut])
async def drivers(
    _: User = Depends(admin_only),
    db: AsyncSession = Depends(get_db),
):
    rows = (
        await db.scalars(
            select(Driver).order_by(Driver.created_at.desc()).limit(200)
        )
    ).all()
    return [
        AdminDriverOut(
            id=d.id,
            name=d.user.name,
            email=d.user.email,
            vehicle_name=d.vehicle_name,
            vehicle_number=d.vehicle_number,
            rating=d.rating,
            is_online=d.is_online,
            total_earnings=d.total_earnings,
            rides_completed=d.rides_completed,
        )
        for d in rows
    ]


@router.get("/rides", response_model=list[AdminRideOut])
async def rides(
    _: User = Depends(admin_only),
    db: AsyncSession = Depends(get_db),
):
    rows = (
        await db.scalars(
            select(Ride).order_by(Ride.created_at.desc()).limit(100)
        )
    ).all()
    return [
        AdminRideOut(
            id=r.id,
            passenger_name=r.passenger.name if r.passenger else "",
            driver_name=r.driver.user.name if r.driver else None,
            pickup=r.pickup,
            destination=r.destination,
            status=r.status,
            fare=r.fare,
            payment_method=r.payment_method,
            created_at=r.created_at,
            completed_at=r.completed_at,
        )
        for r in rows
    ]
