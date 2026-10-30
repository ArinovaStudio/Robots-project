"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  Bell,
  Megaphone,
  ShieldCheck,
  AlertCircle,
  Search,
  Trash2,
  ExternalLink,
  Send,
  CheckCircle2,
  X,
  Clock,
  Loader2,
  RefreshCw,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { fetcher } from "@/lib/fetcher";

interface AdminNotificationItem {
  id: string;
  rawId: string;
  category: "VERIFICATION" | "REPORT" | "BROADCAST";
  type: string;
  title: string;
  message: string;
  status: string;
  timestamp: string;
  user: {
    name: string;
    email: string;
    role?: string;
  };
  link: string;
  actionLabel?: string;
}

interface AdminNotificationsData {
  pendingVerifications: number;
  pendingReports: number;
  totalVerifications: number;
  totalReports: number;
  totalBroadcasts: number;
  totalNotifications: number;
  notifications: AdminNotificationItem[];
}

export default function AdminNotificationsPage() {
  const [activeTab, setActiveTab] = useState<"ALL" | "VERIFICATION" | "REPORT" | "BROADCAST">("ALL");
  const [search, setSearch] = useState("");
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastTarget, setBroadcastTarget] = useState<"ALL" | "FOUNDER" | "INVESTOR">("ALL");
  const [broadcastLink, setBroadcastLink] = useState("");
  const [broadcasting, setBroadcasting] = useState(false);
  const [dismissingId, setDismissingId] = useState<string | null>(null);

  const query = `/api/admin/notifications?category=${activeTab}&search=${encodeURIComponent(search)}`;
  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; data: AdminNotificationsData }>(
    query,
    fetcher
  );

  const responseData = data?.data;
  const notifications = responseData?.notifications || [];

  const handleBroadcastSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      toast.error("Please enter both title and message.");
      return;
    }

    setBroadcasting(true);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: broadcastTitle.trim(),
          message: broadcastMessage.trim(),
          targetRole: broadcastTarget,
          link: broadcastLink.trim() || undefined,
        }),
      });

      const resJson = await res.json();
      if (resJson.success) {
        toast.success(resJson.message || "Broadcast notification sent successfully!");
        setBroadcastTitle("");
        setBroadcastMessage("");
        setBroadcastLink("");
        setShowBroadcastModal(false);
        mutate();
      } else {
        toast.error(resJson.message || "Failed to send broadcast");
      }
    } catch {
      toast.error("Failed to send broadcast announcement");
    } finally {
      setBroadcasting(false);
    }
  };

  const handleDismiss = async (notification: AdminNotificationItem) => {
    setDismissingId(notification.id);
    try {
      const res = await fetch(`/api/admin/notifications?id=${notification.id}`, {
        method: "DELETE",
      });
      const resJson = await res.json();
      if (resJson.success) {
        toast.success(resJson.message || "Notification dismissed");
        mutate();
      } else {
        toast.error(resJson.message || "Failed to dismiss notification");
      }
    } catch {
      toast.error("Failed to dismiss notification");
    } finally {
      setDismissingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-white p-6 shadow-xs border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 mb-2">
            <Bell size={13} />
            <span>Admin Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#050a30]">
            Notifications & System Alerts
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor real-time verification requests, content moderation reports, and broadcast announcements to users.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => mutate()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition shadow-xs"
            title="Refresh notifications"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={() => setShowBroadcastModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
          >
            <Megaphone size={14} />
            Send Broadcast
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Notifications</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <Bell size={16} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-gray-900">
            {responseData ? responseData.totalNotifications : "—"}
          </p>
          <span className="text-[11px] text-gray-400">Active alerts & broadcasts</span>
        </div>

        <Link
          href="/admin/verifications"
          className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs hover:border-blue-200 hover:shadow-sm transition block group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Pending Verifications</span>
            <div className="rounded-lg bg-purple-50 p-2 text-purple-600 group-hover:scale-105 transition">
              <ShieldCheck size={16} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-purple-700">
            {responseData ? responseData.pendingVerifications : "—"}
          </p>
          <span className="text-[11px] text-purple-600 font-semibold group-hover:underline">
            Review requests →
          </span>
        </Link>

        <Link
          href="/admin/reports"
          className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs hover:border-amber-200 hover:shadow-sm transition block group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Pending Reports</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600 group-hover:scale-105 transition">
              <AlertCircle size={16} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-amber-600">
            {responseData ? responseData.pendingReports : "—"}
          </p>
          <span className="text-[11px] text-amber-600 font-semibold group-hover:underline">
            Moderate posts →
          </span>
        </Link>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">System Broadcasts</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <Megaphone size={16} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-emerald-600">
            {responseData ? responseData.totalBroadcasts : "—"}
          </p>
          <span className="text-[11px] text-gray-400">Platform announcements</span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="rounded-2xl bg-white p-4 shadow-xs border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
              activeTab === "ALL"
                ? "bg-[#1E3A5F] text-white shadow-xs"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All Alerts
          </button>
          <button
            onClick={() => setActiveTab("VERIFICATION")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
              activeTab === "VERIFICATION"
                ? "bg-purple-700 text-white shadow-xs"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Verifications {responseData && responseData.pendingVerifications > 0 ? `(${responseData.pendingVerifications})` : ""}
          </button>
          <button
            onClick={() => setActiveTab("REPORT")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
              activeTab === "REPORT"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Post Reports {responseData && responseData.pendingReports > 0 ? `(${responseData.pendingReports})` : ""}
          </button>
          <button
            onClick={() => setActiveTab("BROADCAST")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
              activeTab === "BROADCAST"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Broadcasts
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notifications..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-9 pr-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center text-gray-400">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
            <p className="mt-3 text-sm font-semibold text-gray-600">Loading notifications...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-600">
            <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
            <p className="mt-2 text-sm font-bold">Failed to load admin notifications.</p>
            <button
              onClick={() => mutate()}
              className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center text-gray-400">
            <Bell className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-3 text-base font-bold text-gray-700">No notifications found</h3>
            <p className="mt-1 text-xs text-gray-400 max-w-sm mx-auto">
              There are currently no active alerts or notifications matching the selected filter criteria.
            </p>
          </div>
        ) : (
          notifications.map((item) => {
            const isVerification = item.category === "VERIFICATION";
            const isReport = item.category === "REPORT";
            const isBroadcast = item.category === "BROADCAST";

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs hover:shadow-sm transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`rounded-2xl p-3 shrink-0 ${
                      isVerification
                        ? "bg-purple-100 text-purple-700"
                        : isReport
                        ? "bg-amber-100 text-amber-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {isVerification ? (
                      <ShieldCheck size={20} />
                    ) : isReport ? (
                      <AlertCircle size={20} />
                    ) : (
                      <Megaphone size={20} />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-gray-900">{item.title}</span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          item.status === "PENDING"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : item.status === "APPROVED" || item.status === "DELIVERED"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-gray-100 text-gray-700 border border-gray-200"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-gray-600 leading-relaxed break-words">
                      {item.message}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-gray-400">
                      <span className="inline-flex items-center gap-1">
                        <Clock size={11} />
                        {new Date(item.timestamp).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {item.user.name && (
                        <span>User: <strong className="text-gray-600 font-semibold">{item.user.name}</strong></span>
                      )}
                      {item.user.email && (
                        <span className="text-gray-400">({item.user.email})</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 md:self-center self-end pt-2 md:pt-0">
                  {item.link && (
                    <Link
                      href={item.link}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition shadow-2xs"
                    >
                      <span>{item.actionLabel || "View"}</span>
                      <ExternalLink size={12} />
                    </Link>
                  )}

                  <button
                    onClick={() => handleDismiss(item)}
                    disabled={dismissingId === item.id}
                    className="rounded-xl border border-gray-200 p-2 text-gray-400 hover:bg-gray-50 hover:text-red-600 transition disabled:opacity-50"
                    title="Dismiss alert"
                  >
                    {dismissingId === item.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Broadcast Announcement Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl bg-blue-100 p-2 text-blue-600">
                  <Megaphone size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Broadcast Announcement</h3>
                  <p className="text-xs text-gray-500">Send a system alert to platform members</p>
                </div>
              </div>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleBroadcastSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Announcement Title *
                </label>
                <input
                  type="text"
                  required
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="e.g. Platform Maintenance / Investment Window Open"
                  className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Message Content *
                </label>
                <textarea
                  required
                  rows={4}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Enter the full announcement text that users will receive in their notification feed..."
                  className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Target Audience
                  </label>
                  <select
                    value={broadcastTarget}
                    onChange={(e) =>
                      setBroadcastTarget(e.target.value as "ALL" | "FOUNDER" | "INVESTOR")
                    }
                    className="w-full px-3 py-2 text-xs font-semibold border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">All Platform Users</option>
                    <option value="FOUNDER">Founders Only</option>
                    <option value="INVESTOR">Investors Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Optional Action Link
                  </label>
                  <input
                    type="text"
                    value={broadcastLink}
                    onChange={(e) => setBroadcastLink(e.target.value)}
                    placeholder="e.g. /explore or /investors/portal"
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={broadcasting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 transition shadow-xs disabled:opacity-50"
                >
                  {broadcasting ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Send size={13} />
                  )}
                  Send Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
