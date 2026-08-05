import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

import { getAccessToken } from "../api/client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext<WebSocket | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    if (!user) return;

    let socket: WebSocket | null = null;
    let retries = 0;
    let closed = false;

    const connect = () => {
      const proto = window.location.protocol === "https:" ? "wss" : "ws";
      socket = new WebSocket(
        `${proto}://${window.location.host}/ws?token=${getAccessToken()}`
      );
      socket.onopen = () => {
        retries = 0;
        setWs(socket);
      };
      socket.onclose = () => {
        setWs(null);
        if (!closed && retries < 10) {
          retries += 1;
          setTimeout(connect, Math.min(1000 * retries, 10000));
        }
      };
      socket.onerror = () => socket?.close();
    };

    connect();
    return () => {
      closed = true;
      socket?.close();
      setWs(null);
    };
  }, [user]);

  return <SocketContext.Provider value={ws}>{children}</SocketContext.Provider>;
}

export function useSocket(): WebSocket | null {
  return useContext(SocketContext);
}

export function useSocketEvent(event: string, handler: (data: any) => void) {
  const ws = useSocket();
  useEffect(() => {
    if (!ws) return;
    const onMessage = (e: MessageEvent) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.event === event) handler(msg.data);
      } catch {
        // ignore malformed frames
      }
    };
    ws.addEventListener("message", onMessage);
    return () => ws.removeEventListener("message", onMessage);
  }, [ws, event, handler]);
}
