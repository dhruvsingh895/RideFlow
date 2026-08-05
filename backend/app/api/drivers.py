from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_roles
from app.db.redis import redis_client
from app.db.session import get_db
from app.models import Driver, Ride, User
from app.schemas.driver import DriverOnlineRequest, LocationUpdate
from app.websocket.manager import manager

from app.api.rides import ride_to_out

router = APIRouter(prefix="/driver", tags=["driver"])


async def get_driver(user: User = Depends(require_roles("driver"))) -> Driver:
    if user.driver is None:
        raise HTTPException(status_code=403, detail="Driver profile missing")
    return user.driver


@router.post("/online")
async def go_online(
    body: DriverOnlineRequest,
    driver: Driver = Depends(get_driver),
    db: AsyncSession = Depends(get_db),
):
    if body.lat is not None and body.lng is not None:
        driver.current_lat, driver.current_lng = body.lat, body.lng
    driver.is_online = True
    await db.commit()
    await redis_client.sadd("driver:online", str(driver.id))
    if driver.current_lat is not None and driver.current_lng is not None:
        await redis_client.set(
            f"driver:loc:{driver.id}",
            f"{driver.current_lat},{driver.current_lng}",
        )
    return {"status": "online", "lat": driver.current_lat, "lng": driver.current_lng}


@router.post("/offline")
async def go_offline(
    driver: Driver = Depends(get_driver),
    db: AsyncSession = Depends(get_db),
):
    driver.is_online = False
    await db.commit()
    await redis_client.srem("driver:online", str(driver.id))
    return {"status": "offline"}


@router.post("/location")
async def update_location(
    body: LocationUpdate,
    driver: Driver = Depends(get_driver),
    db: AsyncSession = Depends(get_db),
):
    driver.current_lat, driver.current_lng = body.lat, body.lng
    await db.commit()
    await redis_client.set(f"driver:loc:{driver.id}", f"{body.lat},{body.lng}")

    active = await db.scalar(
        select(Ride).where(
            Ride.driver_id == driver.id,
            Ride.status.in_(["accepted", "started"]),
        )
    )
    if active is not None:
        await manager.send(
            active.passenger_id,
            "driver_location",
            {"ride_id": active.id, "lat": body.lat, "lng": body.lng},
        )
    return {"status": "updated"}


@router.get("/rides")
async def driver_rides(
    driver: Driver = Depends(get_driver),
    db: AsyncSession = Depends(get_db),
):
    rides = (
        await db.scalars(
            select(Ride)
            .where(Ride.driver_id == driver.id)
            .order_by(Ride.created_at.desc())
            .limit(100)
        )
    ).all()

    today_start = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    today_earnings = sum(
        r.fare
        for r in rides
        if r.status == "completed" and r.completed_at and r.completed_at >= today_start
    )
    active = next(
        (r for r in rides if r.status in ("requested", "accepted", "started")), None
    )

    return {
        "rides": [ride_to_out(r) for r in rides],
        "total_earnings": driver.total_earnings,
        "today_earnings": round(today_earnings, 2),
        "rides_completed": driver.rides_completed,
        "is_online": driver.is_online,
        "active_ride": ride_to_out(active) if active else None,
    }
