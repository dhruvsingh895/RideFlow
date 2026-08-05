from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_roles
from app.db.redis import redis_client
from app.db.session import get_db
from app.models import Driver, Ride, User
from app.schemas.ride import BookRideRequest, RideActionRequest, RideOut
from app.services.matching import (
    compute_fare,
    find_nearest_driver,
    notify_driver,
)
from app.websocket.manager import manager

router = APIRouter(tags=["rides"])


async def get_driver_profile(db: AsyncSession, user: User) -> Driver:
    if user.driver is None:
        raise HTTPException(status_code=403, detail="Driver profile missing")
    return user.driver


async def load_ride(db: AsyncSession, ride_id: int) -> Ride:
    ride = await db.get(Ride, ride_id)
    if ride is None:
        raise HTTPException(status_code=404, detail="Ride not found")
    return ride


def ride_to_out(ride: Ride) -> RideOut:
    driver = ride.driver
    brief = None
    if driver is not None:
        brief = {
            "id": driver.id,
            "name": driver.user.name,
            "vehicle_name": driver.vehicle_name,
            "vehicle_number": driver.vehicle_number,
            "rating": driver.rating,
            "lat": driver.current_lat,
            "lng": driver.current_lng,
        }
    return RideOut(
        id=ride.id,
        passenger_id=ride.passenger_id,
        driver_id=ride.driver_id,
        pickup=ride.pickup,
        destination=ride.destination,
        pickup_lat=ride.pickup_lat,
        pickup_lng=ride.pickup_lng,
        dest_lat=ride.dest_lat,
        dest_lng=ride.dest_lng,
        status=ride.status,
        fare=ride.fare,
        payment_method=ride.payment_method,
        created_at=ride.created_at,
        started_at=ride.started_at,
        completed_at=ride.completed_at,
        driver=brief,
        passenger_name=ride.passenger.name if ride.passenger else None,
    )


async def _assign_next_driver(db: AsyncSession, ride: Ride, declined: set[int]) -> bool:
    """Assign and notify the next nearest driver. Returns True if a driver was notified."""
    driver = await find_nearest_driver(db, ride, declined)
    if driver is None:
        ride.driver_id = None
        ride.status = "cancelled"
        await db.commit()
        return False
    ride.driver_id = driver.id
    await db.commit()
    delivered = await notify_driver(db, driver, ride)
    if not delivered:
        declined.add(driver.id)
        return await _assign_next_driver(db, ride, declined)
    return True


@router.post("/ride/book", response_model=RideOut)
async def book_ride(
    req: BookRideRequest,
    passenger: User = Depends(require_roles("passenger")),
    db: AsyncSession = Depends(get_db),
):
    fare = compute_fare(req.pickup_lat, req.pickup_lng, req.dest_lat, req.dest_lng)
    ride = Ride(
        passenger_id=passenger.id,
        pickup=req.pickup,
        destination=req.destination,
        pickup_lat=req.pickup_lat,
        pickup_lng=req.pickup_lng,
        dest_lat=req.dest_lat,
        dest_lng=req.dest_lng,
        status="requested",
        fare=fare,
        payment_method=req.payment_method,
    )
    db.add(ride)
    await db.commit()
    await db.refresh(ride)

    await _assign_next_driver(db, ride, set())
    await db.refresh(ride)
    return ride_to_out(ride)


@router.post("/ride/cancel", response_model=RideOut)
async def cancel_ride(
    req: RideActionRequest,
    passenger: User = Depends(require_roles("passenger")),
    db: AsyncSession = Depends(get_db),
):
    ride = await load_ride(db, req.ride_id)
    if ride.passenger_id != passenger.id:
        raise HTTPException(status_code=403, detail="Not your ride")
    if ride.status not in ("requested", "accepted"):
        raise HTTPException(status_code=400, detail="Ride cannot be cancelled now")

    driver_id = ride.driver_id
    ride.status = "cancelled"
    await db.commit()
    await db.refresh(ride)

    if driver_id is not None:
        driver = await db.get(Driver, driver_id)
        if driver is not None:
            await manager.send(
                driver.user_id,
                "ride_cancelled",
                {"ride_id": ride.id},
            )
    return ride_to_out(ride)


@router.get("/ride/history", response_model=list[RideOut])
async def ride_history(
    passenger: User = Depends(require_roles("passenger")),
    db: AsyncSession = Depends(get_db),
):
    rides = (
        await db.scalars(
            select(Ride)
            .where(Ride.passenger_id == passenger.id)
            .order_by(Ride.created_at.desc())
            .limit(50)
        )
    ).all()
    return [ride_to_out(r) for r in rides]


@router.get("/rides/active", response_model=RideOut | None)
async def active_ride(
    passenger: User = Depends(require_roles("passenger")),
    db: AsyncSession = Depends(get_db),
):
    ride = await db.scalar(
        select(Ride)
        .where(
            Ride.passenger_id == passenger.id,
            Ride.status.in_(["requested", "accepted", "started"]),
        )
        .order_by(Ride.created_at.desc())
        .limit(1)
    )
    return ride_to_out(ride) if ride else None


@router.get("/rides/{ride_id}", response_model=RideOut)
async def ride_detail(
    ride_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ride = await load_ride(db, ride_id)
    if user.role == "passenger" and ride.passenger_id != user.id:
        raise HTTPException(status_code=403, detail="Not your ride")
    if user.role == "driver":
        driver = await get_driver_profile(db, user)
        if ride.driver_id != driver.id:
            raise HTTPException(status_code=403, detail="Not your ride")
    return ride_to_out(ride)


@router.post("/rides/{ride_id}/accept", response_model=RideOut)
async def accept_ride(
    ride_id: int,
    user: User = Depends(require_roles("driver")),
    db: AsyncSession = Depends(get_db),
):
    driver = await get_driver_profile(db, user)
    ride = await load_ride(db, ride_id)
    if ride.driver_id != driver.id:
        raise HTTPException(status_code=403, detail="Not your ride")
    if ride.status != "requested":
        raise HTTPException(status_code=400, detail="Ride is no longer available")

    ride.status = "accepted"
    await db.commit()
    await db.refresh(ride)

    await manager.send(
        ride.passenger_id,
        "ride_accepted",
        {
            "ride_id": ride.id,
            "driver": {
                "name": driver.user.name,
                "vehicle_name": driver.vehicle_name,
                "vehicle_number": driver.vehicle_number,
                "rating": driver.rating,
                "lat": driver.current_lat,
                "lng": driver.current_lng,
            },
        },
    )
    return ride_to_out(ride)


@router.post("/rides/{ride_id}/reject", response_model=RideOut)
async def reject_ride(
    ride_id: int,
    user: User = Depends(require_roles("driver")),
    db: AsyncSession = Depends(get_db),
):
    driver = await get_driver_profile(db, user)
    ride = await load_ride(db, ride_id)
    if ride.driver_id != driver.id:
        raise HTTPException(status_code=403, detail="Not your ride")
    if ride.status != "requested":
        raise HTTPException(status_code=400, detail="Ride is no longer available")

    declined = await redis_client.smembers(f"ride:declined:{ride.id}")
    declined.add(str(driver.id))
    await redis_client.sadd(f"ride:declined:{ride.id}", *declined)

    ride.driver_id = None
    await db.commit()
    await db.refresh(ride)

    notified = await _assign_next_driver(db, ride, {int(d) for d in declined})
    await db.refresh(ride)
    if not notified:
        await manager.send(
            ride.passenger_id,
            "ride_cancelled",
            {"ride_id": ride.id, "reason": "No drivers available"},
        )
    return ride_to_out(ride)


@router.post("/rides/{ride_id}/start", response_model=RideOut)
async def start_ride(
    ride_id: int,
    user: User = Depends(require_roles("driver")),
    db: AsyncSession = Depends(get_db),
):
    driver = await get_driver_profile(db, user)
    ride = await load_ride(db, ride_id)
    if ride.driver_id != driver.id:
        raise HTTPException(status_code=403, detail="Not your ride")
    if ride.status != "accepted":
        raise HTTPException(status_code=400, detail="Ride is not accepted yet")

    ride.status = "started"
    ride.started_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(ride)

    await manager.send(ride.passenger_id, "ride_started", {"ride_id": ride.id})
    return ride_to_out(ride)


@router.post("/rides/{ride_id}/complete", response_model=RideOut)
async def complete_ride(
    ride_id: int,
    user: User = Depends(require_roles("driver")),
    db: AsyncSession = Depends(get_db),
):
    driver = await get_driver_profile(db, user)
    ride = await load_ride(db, ride_id)
    if ride.driver_id != driver.id:
        raise HTTPException(status_code=403, detail="Not your ride")
    if ride.status != "started":
        raise HTTPException(status_code=400, detail="Ride is not in progress")

    ride.status = "completed"
    ride.completed_at = datetime.now(timezone.utc)
    driver.total_earnings += ride.fare
    driver.rides_completed += 1
    await db.commit()
    await db.refresh(ride)

    await manager.send(
        ride.passenger_id,
        "ride_completed",
        {"ride_id": ride.id, "fare": ride.fare},
    )
    return ride_to_out(ride)
