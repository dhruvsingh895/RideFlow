from pydantic import BaseModel, Field


class DriverOnlineRequest(BaseModel):
    lat: float | None = None
    lng: float | None = None


class LocationUpdate(BaseModel):
    lat: float = Field(ge=0, le=1000)
    lng: float = Field(ge=0, le=1000)
