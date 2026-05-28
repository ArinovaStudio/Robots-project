"use client";

import { useEffect } from "react";
import io from "socket.io-client";

export const globalSocket = io();

export default function SocketAnnouncer({ userId }: { userId?: string }) {
  useEffect(() => {
    if (userId) {
      globalSocket.connect();
      globalSocket.emit("user_connected", userId);
    }

    return () => {
      globalSocket.disconnect();
    };
  }, [userId]);

  return null;
}