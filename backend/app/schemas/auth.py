from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class SignupRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    phone: str = Field(min_length=7, max_length=20)
    role: Literal["passenger", "driver"] = "passenger"
    vehicle_name: str | None = None
    vehicle_number: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str
    access_token: str = ""


class DriverOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    vehicle_name: str
    vehicle_number: str
    rating: float
    is_online: bool
    current_lat: float | None = None
    current_lng: float | None = None
    total_earnings: float = 0.0
    rides_completed: int = 0


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    phone: str
    role: str
    created_at: datetime
    driver: DriverOut | None = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut
