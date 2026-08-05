from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.config import settings
from app.db.redis import redis_client
from app.db.session import get_db
from app.models import Driver, User
from app.schemas.auth import (
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    SignupRequest,
    TokenResponse,
    UserOut,
)
from app.utils.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def user_out(user: User) -> UserOut:
    return UserOut(
        id=user.id,
        name=user.name,
        email=user.email,
        phone=user.phone,
        role=user.role,
        created_at=user.created_at,
        driver=user.driver,
    )


def build_tokens(user: User) -> TokenResponse:
    return TokenResponse(
        access_token=create_access_token(user.id, user.role),
        refresh_token=create_refresh_token(user.id, user.role),
        user=user_out(user),
    )


@router.post("/signup", response_model=TokenResponse)
async def signup(req: SignupRequest, db: AsyncSession = Depends(get_db)):
    email = req.email.lower()
    existing = await db.scalar(select(User).where(User.email == email))
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    if req.role == "driver" and (not req.vehicle_name or not req.vehicle_number):
        raise HTTPException(
            status_code=400, detail="Vehicle name and number are required for drivers"
        )

    user = User(
        name=req.name.strip(),
        email=email,
        password_hash=hash_password(req.password),
        phone=req.phone,
        role=req.role,
    )
    db.add(user)
    await db.flush()
    if req.role == "driver":
        db.add(
            Driver(
                user_id=user.id,
                vehicle_name=req.vehicle_name.strip(),
                vehicle_number=req.vehicle_number.strip().upper(),
            )
        )
    await db.commit()
    await db.refresh(user)
    return build_tokens(user)


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.email == req.email.lower()))
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return build_tokens(user)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(req: RefreshRequest, db: AsyncSession = Depends(get_db)):
    payload = decode_token(req.refresh_token, "refresh")
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    jti = payload.get("jti")
    if jti and await redis_client.get(f"bl:refresh:{jti}"):
        raise HTTPException(status_code=401, detail="Refresh token revoked")
    user = await db.get(User, int(payload["sub"]))
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if jti:
        await redis_client.set(
            f"bl:refresh:{jti}",
            "1",
            ex=settings.refresh_token_expire_days * 24 * 3600,
        )
    return build_tokens(user)


@router.post("/logout")
async def logout(req: LogoutRequest, db: AsyncSession = Depends(get_db)):
    if req.access_token:
        payload = decode_token(req.access_token, "access")
        if payload and payload.get("jti"):
            await redis_client.set(
                f"bl:access:{payload['jti']}",
                "1",
                ex=settings.access_token_expire_minutes * 60,
            )
    payload = decode_token(req.refresh_token, "refresh")
    if payload and payload.get("jti"):
        await redis_client.set(
            f"bl:refresh:{payload['jti']}",
            "1",
            ex=settings.refresh_token_expire_days * 24 * 3600,
        )
    return {"status": "logged_out"}


@router.get("/profile", response_model=UserOut)
async def profile(user: User = Depends(get_current_user)):
    return user_out(user)
