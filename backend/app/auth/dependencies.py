from fastapi import Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.redis import redis_client
from app.db.session import get_db
from app.models import User
from app.utils.security import decode_token


async def get_current_user(
    request: Request, db: AsyncSession = Depends(get_db)
) -> User:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(auth.removeprefix("Bearer ").strip(), "access")
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    jti = payload.get("jti")
    if jti and await redis_client.get(f"bl:access:{jti}"):
        raise HTTPException(status_code=401, detail="Token has been revoked")
    user = await db.get(User, int(payload["sub"]))
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def require_roles(*roles: str):
    async def checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user

    return checker
