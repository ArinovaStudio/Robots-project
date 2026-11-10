"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { globalSocket } from "@/components/SocketAnnouncer";
import { mutate } from "swr";

function formatMessageTime(dateInput?: string | Date | null) {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  const isThisYear = date.getFullYear() === now.getFullYear();
  if (isThisYear) {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
}

export default function ContactListSidebar() {
  const pathname = usePathname();
  
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); 
      setContacts([]); 
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Real-time unread count and lastMessage updates via socket
  useEffect(() => {
    const handleReceiveDm = (newMsg: any) => {
      setContacts((prev) => {
        const updated = prev.map((c) => {
          if (c.userId === newMsg.senderId || c.userId === newMsg.receiverId) {
            const isCurrentChat = pathname.includes(c.userId);
            const isFromContact = c.userId === newMsg.senderId;
            const prefix = isFromContact
              ? (c.name ? c.name.split(" ")[0] : "Contact")
              : "You";
            const messageBody =
              newMsg.content ||
              (newMsg.mediaType === "VIDEO"
                ? "Video"
                : newMsg.mediaType === "PDF"
                ? "Document"
                : "Photo");
            return {
              ...c,
              unreadCount: isFromContact && !isCurrentChat ? (c.unreadCount || 0) + 1 : c.unreadCount,
              lastMessage: `${prefix}: ${messageBody}`,
              lastMessageAt: newMsg.createdAt || new Date().toISOString(),
            };
          }
          return c;
        });

        // Float most recently updated conversation to top
        return [...updated].sort((a, b) => {
          const timeA = new Date(a.lastMessageAt || a.connectedAt || 0).getTime();
          const timeB = new Date(b.lastMessageAt || b.connectedAt || 0).getTime();
          return timeB - timeA;
        });
      });
      mutate("/api/user/counts");
    };

    globalSocket.on("receive_dm", handleReceiveDm);
    return () => {
      globalSocket.off("receive_dm", handleReceiveDm);
    };
  }, [pathname]);

  // Real-time online status tracking
  useEffect(() => {
    if (contacts.length === 0) return;
    const userIds = contacts.map((c) => c.userId);
    globalSocket.emit("check_multiple_users_status", userIds);

    const handleMultipleStatus = (statuses: Record<string, boolean>) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        Object.entries(statuses).forEach(([id, isOnline]) => {
          if (isOnline) next.add(id);
          else next.delete(id);
        });
        return next;
      });
    };

    const handleSingleStatus = (data: { userId: string; isOnline: boolean }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        if (data.isOnline) next.add(data.userId);
        else next.delete(data.userId);
        return next;
      });
    };

    globalSocket.on("multiple_users_status_result", handleMultipleStatus);
    globalSocket.on("user_status_change", handleSingleStatus);

    return () => {
      globalSocket.off("multiple_users_status_result", handleMultipleStatus);
      globalSocket.off("user_status_change", handleSingleStatus);
    };
  }, [contacts]);

  // Clear unread count when user views this chat
  useEffect(() => {
    setContacts((prev) =>
      prev.map((c) => {
        if (pathname.includes(c.userId) && (c.unreadCount || 0) > 0) {
          return { ...c, unreadCount: 0 };
        }
        return c;
      })
    );
  }, [pathname]);

  const fetchContacts = useCallback(async () => {
    if (loading || (!hasMore && page !== 1)) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/network/connect/connections?page=${page}&limit=15&search=${encodeURIComponent(debouncedSearch)}`);
      const json = await res.json();
      
      if (json.success) {
        const sortContacts = (list: any[]) => {
          return [...list].sort((a, b) => {
            const timeA = new Date(a.lastMessageAt || a.connectedAt || 0).getTime();
            const timeB = new Date(b.lastMessageAt || b.connectedAt || 0).getTime();
            return timeB - timeA;
          });
        };

        if (page === 1) {
          setContacts(sortContacts(json.data));
        } else {
          setContacts((prev) => sortContacts([...prev, ...json.data]));
        }
        setHasMore(page < json.pagination.totalPages);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50 && hasMore && !loading) {
      setPage((prev) => prev + 1);
    }
  };

  return (
    <div className="flex flex-col h-full p-4 gap-4 bg-transparent">
      
      <div className="p-4 bg-white border border-slate-100 rounded-3xl shadow-sm shrink-0">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Messages</h2>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search connections..." 
            className="w-full bg-slate-100 border-none rounded-xl pl-9 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-600/20 outline-none transition"
          />
        </div>
      </div>

      <div 
        className="flex-1 overflow-y-auto p-2 bg-white border border-slate-100 rounded-3xl shadow-sm"
        onScroll={handleScroll}
      >
        {contacts.map((contact) => {
          const isActive = pathname.includes(contact.userId);
          const hasUnread = (contact.unreadCount || 0) > 0;
          const isOnline = onlineUserIds.has(contact.userId);
          const formattedTime = formatMessageTime(contact.lastMessageAt);
          
          return (
            <Link 
              href={`/messages/${contact.userId}`} 
              key={contact.connectionId}
              className={`flex items-start gap-3 p-3 rounded-2xl transition cursor-pointer mb-1.5 ${
                isActive ? "bg-blue-600 text-white shadow-md" : "hover:bg-slate-100 text-slate-700"
              }`}
            >
              {/* Avatar with online status */}
              <div className="relative shrink-0 mt-0.5">
                <div className="size-11 rounded-full bg-white border border-slate-200 overflow-hidden relative flex items-center justify-center font-bold text-sm text-slate-400">
                  {contact.image ? (
                    <Image src={contact.image} alt={contact.name || "User"} fill className="object-cover" />
                  ) : (
                    contact.name?.charAt(0) || "?"
                  )}
                </div>
                {isOnline && (
                  <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-600/20" />
                )}
              </div>
              
              {/* Info */}
              <div className="overflow-hidden flex-1 min-w-0">
                {/* Top line: Name and Timestamp */}
                <div className="flex items-center justify-between gap-2">
                  <h3 className={`font-semibold text-sm truncate ${isActive ? "text-white" : "text-slate-900"}`}>
                    {contact.name || "Unknown User"}
                  </h3>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {formattedTime && (
                      <span className={`text-[11px] font-normal whitespace-nowrap ${isActive ? "text-blue-100" : "text-slate-400"}`}>
                        {formattedTime}
                      </span>
                    )}
                    {hasUnread && (
                      <span
                        className={`inline-flex items-center justify-center px-1.5 py-0.5 text-[11px] font-bold rounded-full shrink-0 min-w-[20px] shadow-2xs ${
                          isActive
                            ? "bg-white text-blue-600"
                            : "bg-blue-600 text-white"
                        }`}
                      >
                        {contact.unreadCount}
                      </span>
                    )}
                  </div>
                </div>

                {/* Downside of the name: Last Chat preview (uses ... if too long) */}
                <p 
                  className={`text-xs line-clamp-2 leading-relaxed mt-0.5 break-words ${
                    isActive 
                      ? "text-blue-100" 
                      : hasUnread 
                        ? "text-slate-800 font-medium" 
                        : "text-slate-500"
                  }`}
                  title={contact.lastMessage || ""}
                >
                  {contact.lastMessage || contact.company?.type || "Connection"}
                </p>
              </div>
            </Link>
          )
        })}

        {loading && (
          <div className="space-y-1 px-1 mt-1">
            <SkeletonTheme baseColor="#f1f5f9" highlightColor="#ffffff">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
                  <Skeleton circle width={40} height={40} />
                  <div className="flex-1">
                    <Skeleton width="70%" height={16} />
                    <Skeleton width="40%" height={12} className="mt-1" />
                  </div>
                </div>
              ))}
            </SkeletonTheme>
          </div>
        )}
        
        {!loading && contacts.length === 0 && (
          <div className="text-center p-6 text-sm text-slate-400 mt-4">
            {search ? "No matches found." : "No connections yet."}
          </div>
        )}
      </div>
    </div>
  );
}