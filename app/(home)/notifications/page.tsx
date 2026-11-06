"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Bell, MessageSquare, UserPlus, CheckCircle, Heart, FileText, AtSign, Users, Landmark,
} from "lucide-react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { mutate as globalMutate } from "swr";

type Actor = { id: string; name: string; image: string | null } | null;
type Category = "INVESTORS" | "MY_POSTS" | "MENTIONS" | null;
type Notif = {
  id: string;
  type: string;
  content: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
  actor?: Actor;
  category?: Category;
};

type TabId = "all" | "investors" | "posts" | "mentions";

const TABS: { id: TabId; label: string; category: Category | "ALL"; empty: string }[] = [
  { id: "all", label: "All", category: "ALL", empty: "You're all caught up! No notifications yet." },
  { id: "investors", label: "Investors", category: "INVESTORS", empty: "No investor notifications yet." },
  { id: "posts", label: "My posts", category: "MY_POSTS", empty: "No reactions or comments on your posts yet." },
  { id: "mentions", label: "Mentions", category: "MENTIONS", empty: "Nobody has mentioned you yet." },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const knownIds = useRef<Set<string>>(new Set());

  // Opening the tab resets the navbar badge. It does NOT mark anything as read:
  // a card stays highlighted until the user opens / interacts with it.
  const markSeen = useCallback(async () => {
    try {
      await fetch("/api/notifications/seen", { method: "POST" });
      await globalMutate("/api/user/counts");
    } catch (error) {
      console.error("Failed to reset notification badge", error);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      const json = await res.json();
      if (!json.success) return;

      const data: Notif[] = json.data;
      const hasNew = data.some((n) => !knownIds.current.has(n.id));
      data.forEach((n) => knownIds.current.add(n.id));
      setNotifications(data);

      // Anything that arrives while the tab is open shouldn't bump the badge either
      if (hasNew) void markSeen();
    } finally {
      setLoading(false);
    }
  }, [markSeen]);

  useEffect(() => {
    void fetchNotifications();
    const interval = setInterval(() => void fetchNotifications(), 10000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    void fetch(`/api/notifications?id=${id}`, { method: "PATCH", keepalive: true });
  };

  const getIcon = (n: Notif) => {
    switch (n.type) {
      case "NEW_MESSAGE": return <MessageSquare className="w-3 h-3 text-blue-500" />;
      case "CONNECTION_REQUEST": return <UserPlus className="w-3 h-3 text-indigo-500" />;
      case "CONNECTION_ACCEPTED": return <CheckCircle className="w-3 h-3 text-green-500" />;
      case "POST_LIKE": return <Heart className="w-3 h-3 text-red-500" />;
      case "NEW_COMMENT": return <FileText className="w-3 h-3 text-amber-500" />;
      case "MENTION": return <AtSign className="w-3 h-3 text-purple-500" />;
      case "NETWORK_ACTIVITY": return <Users className="w-3 h-3 text-teal-500" />;
      case "INVESTOR_OFFER": return <Landmark className="w-3 h-3 text-emerald-600" />;
      default:
        return n.category === "INVESTORS"
          ? <Landmark className="w-3 h-3 text-emerald-600" />
          : <Bell className="w-3 h-3 text-gray-500" />;
    }
  };

  const tab = TABS.find((t) => t.id === activeTab)!;
  const visible = notifications.filter((n) => tab.category === "ALL" || n.category === tab.category);
  const unreadIn = (t: (typeof TABS)[number]) =>
    notifications.filter((n) => !n.isRead && (t.category === "ALL" || n.category === t.category)).length;

  return (
    <section className="mx-auto max-w-4xl space-y-4 pb-20">
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-gray-200 bg-white p-1.5 shadow-sm">
        {TABS.map((t) => {
          const unread = unreadIn(t);
          const active = t.id === activeTab;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              aria-pressed={active}
              className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-semibold transition ${
                active ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {t.label}
              {unread > 0 && (
                <span
                  className={`min-w-[18px] rounded-full px-1.5 text-[11px] font-bold leading-[18px] ${
                    active ? "bg-white text-blue-600" : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </button>
          );
        })}
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
        ) : visible.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Bell className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p>{tab.empty}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {visible.map((notif) => {
              const unread = !notif.isRead;
              return (
                <Link
                  href={notif.link || "#"}
                  key={notif.id}
                  onClick={() => unread && markRead(notif.id)}
                  className={`flex gap-4 p-5 items-start transition border-l-4 ${
                    unread
                      ? "bg-blue-50 hover:bg-blue-100/70 border-blue-600"
                      : "hover:bg-gray-50 border-transparent"
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                      {notif.actor?.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={notif.actor.image} alt={notif.actor.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-gray-500">
                          {notif.actor?.name?.charAt(0).toUpperCase() || "?"}
                        </span>
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-white border border-gray-100 shadow-sm">
                      {getIcon(notif)}
                    </div>
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className={`text-sm ${unread ? "font-semibold text-gray-900" : "text-gray-600"}`}>
                      {notif.content}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {unread && <div className="w-2 h-2 rounded-full bg-blue-600 mt-2" />}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}