from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.config import settings


class BookRideRequest(BaseModel):
    pickup: str = "Pickup"
    destination: str = "Destination"
    pickup_lat: float
    pickup_lng: float
    dest_lat: float
    dest_lng: float
    payment_method: Literal["cash", "wallet", "upi"] = "cash"

    @field_validator("pickup_lat", "pickup_lng", "dest_lat", "dest_lng")
    @classmethod
    def check_bounds(cls, v: float) -> float:
        if not (0 <= v <= settings.grid_size):
            raise ValueError(f"Coordinates must be between 0 and {settings.grid_size}")
        return v


class RideActionRequest(BaseModel):
    ride_id: int


class DriverBrief(BaseModel):
    id: int
    name: str
    vehicle_name: str
    vehicle_number: str
    rating: float
    lat: float | None = None
    lng: float | None = None


class RideOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    passenger_id: int
    driver_id: int | None = None
    pickup: str
    destination: str
    pickup_lat: float
    pickup_lng: float
    dest_lat: float
    dest_lng: float
    status: str
    fare: float
    payment_method: str
    created_at: datetime
    started_at: datetime | None = None
    completed_at: datetime | None = None
    driver: DriverBrief | None = None
    passenger_name: str | None = None
