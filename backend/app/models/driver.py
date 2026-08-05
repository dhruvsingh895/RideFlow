from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Driver(Base):
    __tablename__ = "drivers"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    vehicle_name: Mapped[str] = mapped_column(String(100))
    vehicle_number: Mapped[str] = mapped_column(String(20))
    rating: Mapped[float] = mapped_column(Float, default=5.0)
    is_online: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    current_lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    current_lng: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_earnings: Mapped[float] = mapped_column(Float, default=0.0)
    rides_completed: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    user: Mapped[User] = relationship(back_populates="driver", lazy="selectin")
    rides: Mapped[list["Ride"]] = relationship(back_populates="driver")
