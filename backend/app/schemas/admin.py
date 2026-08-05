from datetime import datetime

from pydantic import BaseModel


class AdminStats(BaseModel):
    users_total: int
    passengers_total: int
    drivers_total: int
    drivers_online: int
    rides_total: int
    rides_completed: int
    rides_cancelled: int
    rides_active: int
    revenue: float


class AdminUserOut(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    role: str
    created_at: datetime


class AdminDriverOut(BaseModel):
    id: int
    name: str
    email: str
    vehicle_name: str
    vehicle_number: str
    rating: float
    is_online: bool
    total_earnings: float
    rides_completed: int


class AdminRideOut(BaseModel):
    id: int
    passenger_name: str
    driver_name: str | None = None
    pickup: str
    destination: str
    status: str
    fare: float
    payment_method: str
    created_at: datetime
    completed_at: datetime | None = None
