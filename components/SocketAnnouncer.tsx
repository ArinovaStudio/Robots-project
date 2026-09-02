"use client";

import { useEffect } from "react";
import io from "socket.io-client";
import { toast } from "sonner";

export const globalSocket = io();

export default function SocketAnnouncer({ userId }: { userId?: string }) {
  useEffect(() => {
    if (userId) {
      globalSocket.connect();
      globalSocket.emit("user_connected", userId);
    }

    const handleNewNotification = (notification: any) => {
      toast(notification.content, {
        description: "Click to view",
        action: {
          label: "View",
          onClick: () => {
            if (notification.link) {
              window.location.href = notification.link;
            }
          }
        }
      });
    };

    globalSocket.on("new_notification", handleNewNotification);

    return () => {
      globalSocket.off("new_notification", handleNewNotification);
      globalSocket.disconnect();
    };
  }, [userId]);

  return null;
}