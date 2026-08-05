from datetime import datetime, timezone

from sqlalchemy import select

from app.db.session import SessionLocal
from app.models import Driver, Ride, User
from app.utils.security import hash_password

DEMO_PASSWORD = "demo1234"


async def seed_demo_data() -> None:
    async with SessionLocal() as db:
        existing = await db.scalar(select(User.id).limit(1))
        if existing:
            return

        admin = User(
            name="Admin",
            email="admin@rideflow.com",
            password_hash=hash_password(DEMO_PASSWORD),
            phone="9999999990",
            role="admin",
        )
        passenger = User(
            name="Meera",
            email="passenger@rideflow.com",
            password_hash=hash_password(DEMO_PASSWORD),
            phone="8888888881",
            role="passenger",
        )
        driver1_user = User(
            name="Rahul",
            email="driver@rideflow.com",
            password_hash=hash_password(DEMO_PASSWORD),
            phone="7777777772",
            role="driver",
        )
        driver2_user = User(
            name="Sneha",
            email="sneha@rideflow.com",
            password_hash=hash_password(DEMO_PASSWORD),
            phone="6666666663",
            role="driver",
        )
        driver3_user = User(
            name="Arjun",
            email="arjun@rideflow.com",
            password_hash=hash_password(DEMO_PASSWORD),
            phone="5555555554",
            role="driver",
        )

        driver1 = Driver(
            user=driver1_user,
            vehicle_name="Honda City",
            vehicle_number="DL01AB1234",
            current_lat=3.0,
            current_lng=3.0,
        )
        driver2 = Driver(
            user=driver2_user,
            vehicle_name="Maruti Swift",
            vehicle_number="MH12CD5678",
            current_lat=8.0,
            current_lng=8.0,
        )
        driver3 = Driver(
            user=driver3_user,
            vehicle_name="Hyundai i20",
            vehicle_number="KA01EF9012",
            current_lat=14.0,
            current_lng=5.0,
        )

        now = datetime.now(timezone.utc)

        def make_ride(
            pk: tuple[float, float],
            dk: tuple[float, float],
            status: str,
            fare: float,
            payment: str,
            r_driver: Driver | None = None,
        ) -> Ride:
            return Ride(
                passenger=passenger,
                driver=r_driver,
                pickup=f"Point {pk}",
                destination=f"Point {dk}",
                pickup_lat=pk[0],
                pickup_lng=pk[1],
                dest_lat=dk[0],
                dest_lng=dk[1],
                status=status,
                fare=fare,
                payment_method=payment,
                completed_at=now if status == "completed" else None,
            )

        ride1 = make_ride((2, 3), (8, 12), "completed", 18.20, "upi", driver1)
        ride2 = make_ride((5, 5), (1, 1), "completed", 9.80, "cash", driver1)
        ride3 = make_ride((10, 10), (4, 2), "completed", 12.40, "wallet", driver2)
        ride4 = make_ride((12, 3), (15, 15), "cancelled", 0.0, "cash")

        db.add_all([admin, passenger, driver1_user, driver2_user, driver3_user])
        db.add_all([ride1, ride2, ride3, ride4])
        await db.flush()

        driver1.total_earnings = ride1.fare + ride2.fare
        driver1.rides_completed = 2
        driver2.total_earnings = ride3.fare
        driver2.rides_completed = 1

        await db.commit()
