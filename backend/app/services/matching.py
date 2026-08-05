import math

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.redis import redis_client
from app.models import Driver, Ride, User
from app.websocket.manager import manager


def euclidean(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    return math.hypot(lat1 - lat2, lng1 - lng2)


def compute_fare(
    pickup_lat: float, pickup_lng: float, dest_lat: float, dest_lng: float
) -> float:
    distance = euclidean(pickup_lat, pickup_lng, dest_lat, dest_lng)
    return round(2.0 + distance * 1.5, 2)


async def get_driver_location(driver_id: int) -> tuple[float, float] | None:
    loc = await redis_client.get(f"driver:loc:{driver_id}")
    if loc:
        lat, lng = loc.split(",")
        return float(lat), float(lng)
    return None


async def find_nearest_driver(
    db: AsyncSession, ride: Ride, exclude: set[int]
) -> Driver | None:
    """Pick the online driver closest (Euclidean) to the ride pickup."""
    online = await redis_client.smembers("driver:online")
    best: Driver | None = None
    best_dist = float("inf")

    for raw_id in online:
        driver_id = int(raw_id)
        if driver_id in exclude:
            continue
        driver = await db.get(Driver, driver_id)
        if driver is None:
            continue
        loc = await get_driver_location(driver_id)
        if loc is None:
            if driver.current_lat is None or driver.current_lng is None:
                continue
            lat, lng = driver.current_lat, driver.current_lng
        else:
            lat, lng = loc
        distance = euclidean(ride.pickup_lat, ride.pickup_lng, lat, lng)
        if distance < best_dist:
            best_dist = distance
            best = driver

    return best


async def notify_driver(db: AsyncSession, driver: Driver, ride: Ride) -> bool:
    """Send ride_request to the driver's live WebSocket. Returns delivery status."""
    passenger: User = await db.get(User, ride.passenger_id)
    payload = {
        "ride_id": ride.id,
        "pickup": ride.pickup,
        "destination": ride.destination,
        "pickup_lat": ride.pickup_lat,
        "pickup_lng": ride.pickup_lng,
        "dest_lat": ride.dest_lat,
        "dest_lng": ride.dest_lng,
        "fare": ride.fare,
        "payment_method": ride.payment_method,
        "passenger": {
            "name": passenger.name if passenger else "",
            "phone": passenger.phone if passenger else "",
        },
        "created_at": ride.created_at.isoformat() if ride.created_at else None,
    }
    return await manager.send(driver.user_id, "ride_request", payload)
