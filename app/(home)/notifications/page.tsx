"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Bell, MessageSquare, UserPlus, CheckCircle, Heart, FileText, Check } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const json = await res.json();
      if (json.success) {
        setNotifications(json.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id?: string) => {
    const url = id ? `/api/notifications?id=${id}` : "/api/notifications";
    await fetch(url, { method: "PATCH" });
    setNotifications((prev) => 
      prev.map(n => (id ? (n.id === id ? { ...n, isRead: true } : n) : { ...n, isRead: true }))
    );
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case "NEW_MESSAGE": return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case "CONNECTION_REQUEST": return <UserPlus className="w-5 h-5 text-indigo-500" />;
      case "CONNECTION_ACCEPTED": return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "POST_LIKE": return <Heart className="w-5 h-5 text-red-500" />;
      case "NEW_COMMENT": return <FileText className="w-5 h-5 text-amber-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <section className="mx-auto max-w-4xl space-y-6 pb-20">
      <div className="flex items-center justify-between bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 p-3 rounded-lg">
            <Bell className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
            <p className="text-sm text-gray-500">Stay updated on your network activity</p>
          </div>
        </div>
        <button 
          onClick={() => markAsRead()}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
        >
          <Check className="w-4 h-4" />
          Mark all as read
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4 items-start">
                <Skeleton circle width={40} height={40} />
                <div className="flex-1">
                  <Skeleton width="80%" height={16} />
                  <Skeleton width="20%" height={12} className="mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Bell className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p>You're all caught up! No new notifications.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notif) => (
              <Link 
                href={notif.link || "#"} 
                key={notif.id}
                onClick={() => !notif.isRead && markAsRead(notif.id)}
                className={`flex gap-4 p-5 hover:bg-gray-50 transition items-start ${!notif.isRead ? "bg-blue-50/30" : ""}`}
              >
                <div className={`p-2 rounded-full ${!notif.isRead ? "bg-white shadow-sm border border-gray-100" : "bg-gray-50"}`}>
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 pt-1">
                  <p className={`text-sm ${!notif.isRead ? "font-semibold text-gray-900" : "text-gray-600"}`}>
                    {notif.content}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {!notif.isRead && (
                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
