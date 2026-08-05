from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.api import admin, auth, drivers, rides
from app.db.redis import redis_client
from app.db.session import Base, SessionLocal, engine
from app.models import Driver, Ride, User  # noqa: F401  (register models)
from app.utils.security import decode_token
from app.utils.seed import seed_demo_data
from app.websocket.manager import manager


@asynccontextmanager
async def lifespan(_: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await seed_demo_data()
    yield
    await engine.dispose()
    await redis_client.aclose()


app = FastAPI(title="RideFlow API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(drivers.router, prefix="/api")
app.include_router(rides.router, prefix="/api")
app.include_router(admin.router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    token = ws.query_params.get("token", "")
    payload = decode_token(token, "access")
    if not payload:
        await ws.close(code=4401)
        return

    async with SessionLocal() as db:
        user = await db.get(User, int(payload["sub"]))
        if user is None or user.role == "admin":
            await ws.close(code=4401)
            return

        await manager.connect(user.id, ws)
        try:
            while True:
                await ws.receive_text()
        except WebSocketDisconnect:
            manager.disconnect(user.id)
        except Exception:
            manager.disconnect(user.id)
