from fastapi import WebSocket


class ConnectionManager:
    """Keeps one live WebSocket per user_id and pushes JSON events to it."""

    def __init__(self) -> None:
        self._connections: dict[int, WebSocket] = {}

    async def connect(self, user_id: int, ws: WebSocket) -> None:
        await ws.accept()
        old = self._connections.get(user_id)
        if old is not None:
            try:
                await old.close()
            except Exception:
                pass
        self._connections[user_id] = ws

    def disconnect(self, user_id: int) -> None:
        self._connections.pop(user_id, None)

    async def send(self, user_id: int, event: str, data: dict) -> bool:
        """Send a JSON message. Returns True if delivered to a live connection."""
        ws = self._connections.get(user_id)
        if ws is None:
            return False
        try:
            await ws.send_json({"event": event, "data": data})
            return True
        except Exception:
            self.disconnect(user_id)
            return False

    async def broadcast(self, event: str, data: dict) -> None:
        for ws in list(self._connections.values()):
            try:
                await ws.send_json({"event": event, "data": data})
            except Exception:
                pass


manager = ConnectionManager()
