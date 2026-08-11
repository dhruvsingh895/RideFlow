# RideFlow — Local Ride Hailing Platform

An Uber-style ride-hailing app that runs **entirely on your local machine with Docker**.
React + TypeScript frontend, FastAPI backend, PostgreSQL for persistence, Redis for live
driver locations, ride matching and token blacklisting — all wired together with
WebSockets for real-time tracking.

```
React Frontend
        │
        │ REST + WebSocket
        ▼
FastAPI Backend
        │
 ┌──────┴────────┐
 │               │
PostgreSQL     Redis
```

## Quick start

```bash
docker compose up --build
```

| Service  | URL                        |
| -------- | -------------------------- |
| Frontend | http://localhost:3001      |
| Backend  | http://localhost:8001/docs |
| Postgres | localhost:5434             |
| Redis    | localhost:6379             |

Tables are created and demo data is seeded automatically on first boot.

## Live deployment (Render)

| Service  | URL                                   |
| -------- | ------------------------------------- |
| Frontend | https://frontend-goq1.onrender.com    |
| Backend  | https://backend-6g50.onrender.com     |

Infrastructure (frontend, backend, PostgreSQL, Redis) is defined in `render.yaml` and
synced from the `main` branch. The frontend's nginx proxies `/api` and `/ws` to the
backend's public URL (free-plan services can't resolve Render's internal hostnames).

### Demo accounts (password for all: `demo1234`)

| Role      | Email                     |
| --------- | ------------------------- |
| Passenger | passenger@rideflow.com  |
| Driver    | driver@rideflow.com     |
| Driver 2  | sneha@rideflow.com      |
| Driver 3  | arjun@rideflow.com      |
| Admin     | admin@rideflow.com      |

## Try the full ride flow

1. Open **two browser windows**: log in as the passenger in one and the driver in the other.
2. In the driver window, click **Go online** (optionally enable "Broadcast every 2 seconds").
3. In the passenger window, pick pickup/destination coordinates and hit **Book Ride**.
4. The driver gets a live **ride request** — Accept (or Reject, which routes the ride to the next nearest driver).
5. The passenger sees the driver appear on the live map. The blue marker moves every 2 s.
6. Driver: **Start ride** → **Complete ride**; earnings and the admin dashboard update instantly.

## Tech stack

- **Frontend**: React, TypeScript, TailwindCSS, Axios, React Router, React Query
- **Backend**: FastAPI, SQLAlchemy 2 (async), PostgreSQL, Redis, JWT, WebSockets
- **DevOps**: Docker, Docker Compose

> Note: the frontend uses the native browser `WebSocket` API (not `socket.io-client`) so it
> plugs directly into FastAPI's native WebSocket endpoint (`/ws`). This keeps the stack
> dependency-light and avoids a broken third-party bridge.

## Architecture

### Data model (`backend/app/models/`)

- **users** — id, name, email, password_hash, phone, role (`passenger` / `driver` / `admin`)
- **drivers** — id, user_id, vehicle_name, vehicle_number, rating, is_online, current_lat/lng, total_earnings, rides_completed
- **rides** — id, passenger_id, driver_id, pickup/destination (+ coordinates), status, fare, payment_method, timestamps

### Authentication

- `POST /api/auth/signup` — register (drivers must include vehicle details)
- `POST /api/auth/login` — returns access + refresh JWT pair
- `POST /api/auth/refresh` — rotate the pair
- `POST /api/auth/logout` — blacklists both tokens in Redis
- `GET /api/auth/profile` — current user

JWT `jti`s are blacklisted in Redis (`bl:access:<jti>`, `bl:refresh:<jti>`) so logged-out
tokens die immediately.

### Driver matching

```
Passenger books ride
        │
        ▼
Ride Service (creates ride, computes fare)
        │
        ▼
Redis  —  online driver set + per-driver locations
        │
        ▼
Nearest driver by Euclidean distance
        │
        ▼
WebSocket ride_request → driver Accept/Reject
```

- Drivers go online/offline via `POST /api/driver/online` / `/offline` (mirrored to Redis sets).
- On **Reject**, the ride is re-matched to the next nearest driver; declined drivers are
  tracked in `ride:declined:<ride_id>`.
- If no online driver is available, the ride is cancelled with "No drivers available".
- Coordinates are sample `(x, y)` points in a `0–20` grid. Fare is mocked:
  `2 + distance × 1.5`.

### WebSocket events (`/ws?token=<access_token>`)

| Event            | Sent to     | Payload                                   |
| ---------------- | ----------- | ----------------------------------------- |
| `ride_request`   | driver      | ride details + passenger info             |
| `ride_accepted`  | passenger   | driver profile + location                 |
| `ride_started`   | passenger   | ride_id                                   |
| `ride_completed` | passenger   | ride_id, fare                             |
| `ride_cancelled` | both sides  | ride_id, reason                           |
| `driver_location`| passenger   | ride_id, lat, lng (every 2 s while broadcasting) |

### API overview

| Method | Endpoint                        | Role      | Description               |
| ------ | ------------------------------- | --------- | ------------------------- |
| POST   | `/api/ride/book`                | passenger | Book a ride (auto-match)  |
| POST   | `/api/ride/cancel`              | passenger | Cancel a requested/accepted ride |
| GET    | `/api/ride/history`             | passenger | Ride history              |
| GET    | `/api/rides/active`             | passenger | Current active ride       |
| GET    | `/api/rides/{id}`               | both      | Ride detail               |
| POST   | `/api/rides/{id}/accept`        | driver    | Accept ride request       |
| POST   | `/api/rides/{id}/reject`        | driver    | Reject (re-match to next) |
| POST   | `/api/rides/{id}/start`         | driver    | Start trip                |
| POST   | `/api/rides/{id}/complete`      | driver    | Complete trip             |
| POST   | `/api/driver/online`            | driver    | Go online                 |
| POST   | `/api/driver/offline`           | driver    | Go offline                |
| POST   | `/api/driver/location`          | driver    | Update live location      |
| GET    | `/api/driver/rides`             | driver    | Rides + earnings          |
| GET    | `/api/admin/stats`              | admin     | Platform stats + revenue  |
| GET    | `/api/admin/users`              | admin     | All users                 |
| GET    | `/api/admin/drivers`            | admin     | All drivers               |
| GET    | `/api/admin/rides`              | admin     | All rides                 |

## Redis keys

| Key                        | Purpose                             |
| -------------------------- | ----------------------------------- |
| `driver:online`            | set of online driver ids            |
| `driver:loc:<id>`          | `lat,lng` of a driver               |
| `ride:declined:<id>`       | drivers who declined a ride         |
| `bl:access:<jti>`          | blacklisted access tokens           |
| `bl:refresh:<jti>`         | blacklisted refresh tokens          |

## Payments (mock)

No payment gateway. The passenger picks **Cash / Wallet / UPI** at booking; the fare is
simulated and "charged" on completion (drivers' earnings and admin revenue update).

## Project structure

```
RideFlow/
├── backend/
│   ├── app/
│   │   ├── api/          # auth, drivers, rides, admin routers
│   │   ├── auth/         # JWT dependencies & role guards
│   │   ├── db/           # async engine, session, redis client
│   │   ├── models/       # User, Driver, Ride
│   │   ├── schemas/      # pydantic request/response models
│   │   ├── services/     # driver matching + fare calculation
│   │   ├── websocket/    # connection manager
│   │   ├── utils/        # security (bcrypt/JWT), seed data
│   │   ├── main.py
│   │   └── config.py
│   ├── alembic/          # migration scaffolding (create_all used on boot)
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── api/          # axios clients + interceptors (auto refresh)
│   │   ├── components/   # Navbar, RideMap (SVG), badges, modal…
│   │   ├── context/      # Auth + WebSocket providers
│   │   ├── pages/        # Landing, Login, Signup, Passenger/Driver/Admin dashboards, Tracking, History
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── Dockerfile        # node build → nginx (proxies /api and /ws)
│   └── nginx.conf
├── postgres/             # pgdata volume (created at runtime)
├── redis/                # in-memory store
├── docker-compose.yml
└── README.md
```

## Local development (without Docker)

Backend:

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload          # needs Postgres + Redis (see backend/.env)
```

Frontend:

```bash
cd frontend
npm install
npm run dev                            # proxies /api and /ws to localhost:8000
```

## Alembic

The app creates tables automatically on startup (`Base.metadata.create_all`), so no
migration step is needed. Alembic is configured and ready for when you want versioned
migrations:

```bash
cd backend
alembic revision --autogenerate -m "description"
alembic upgrade head
```

## Troubleshooting

- **Port already in use** — Postgres is mapped to host port `5434` to avoid clashes; edit
  `docker-compose.yml` if you need others.
- **Frontend can't reach the backend** — both communicate over the internal Docker
  network via nginx; no URL configuration needed.
- **Stuck at "Searching for driver"** — make sure a driver window is **Online** (and has
  a location set) before the passenger books.
- **Reset everything** — `docker compose down -v` wipes Postgres + Redis data.
