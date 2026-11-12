"use client";

import { useEffect, useState, useMemo } from "react";
import { X, Search, Link2, Check, Send, Loader2, User } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

interface ConnectionItem {
  id: string;
  userId: string;
  name: string;
  image: string | null;
  accountType?: string;
  company?: {
    companyName?: string;
    type?: string;
    description?: string;
    logoUrl?: string;
  } | null;
  investor?: {
    firmName?: string;
    investorType?: string;
  } | null;
}

interface ShareModalProps {
  /** Share a post (default) ... */
  postId?: string;
  authorName?: string;
  /** ...or share a member's profile instead */
  profileUserId?: string;
  profileName?: string;
  onClose: () => void;
}

export default function ShareModal({ postId, authorName, profileUserId, profileName, onClose }: ShareModalProps) {
  const isProfileShare = Boolean(profileUserId);
  const [connections, setConnections] = useState<ConnectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const postLink =
    typeof window !== "undefined"
      ? `${window.location.origin}${isProfileShare ? `/profile/${profileUserId}` : `/post/${postId}`}`
      : "";

  // Fetch accepted connections
  useEffect(() => {
    let isMounted = true;
    const fetchConnections = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/network/connect/connections?limit=50");
        const json = await res.json();
        if (isMounted && json.success && Array.isArray(json.data)) {
          setConnections(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch connections for sharing:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchConnections();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter connections by search query
  const filteredConnections = useMemo(() => {
    if (!searchQuery.trim()) return connections;
    const q = searchQuery.toLowerCase().trim();
    return connections.filter((conn) => {
      const name = conn.name?.toLowerCase() || "";
      const companyName = conn.company?.companyName?.toLowerCase() || "";
      const companyType = conn.company?.type?.toLowerCase() || "";
      const firmName = conn.investor?.firmName?.toLowerCase() || "";
      const investorType = conn.investor?.investorType?.toLowerCase() || "";
      return (
        name.includes(q) ||
        companyName.includes(q) ||
        companyType.includes(q) ||
        firmName.includes(q) ||
        investorType.includes(q)
      );
    });
  }, [connections, searchQuery]);

  // Toggle selection
  const toggleSelect = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  // Copy link handler
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(postLink);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  // Send post to selected connections
  const handleSend = async () => {
    if (selectedUserIds.length === 0) return;
    setSending(true);

    try {
      const endpoint = isProfileShare ? `/api/profile/${profileUserId}/share` : `/api/posts/${postId}/share`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientIds: selectedUserIds,
          message: message.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || `Failed to share ${isProfileShare ? "profile" : "post"}`);
      }

      toast.success(
        `${isProfileShare ? "Profile" : "Post"} sent to ${selectedUserIds.length} connection${
          selectedUserIds.length === 1 ? "" : "s"
        }!`
      );
      onClose();
    } catch (err: any) {
      toast.error(err.message || `Failed to send ${isProfileShare ? "profile" : "post"}. Please try again.`);
    } finally {
      setSending(false);
    }
  };

  // Headline helper
  const getHeadline = (conn: ConnectionItem) => {
    if (conn.investor) {
      return conn.investor.firmName
        ? `${conn.investor.firmName} · ${conn.investor.investorType || "Investor"}`
        : conn.investor.investorType || "Investor";
    }
    if (conn.company) {
      return conn.company.type
        ? `${conn.company.type}${conn.company.companyName ? ` at ${conn.company.companyName}` : ""}`
        : conn.company.companyName || "Business Professional";
    }
    return "Connected Member";
  };

  const modalTitle = isProfileShare
    ? profileName ? `Send ${profileName}'s Profile` : "Send Profile"
    : authorName ? `Send ${authorName}'s Post` : "Send Post";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900 truncate pr-2">{modalTitle}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition shrink-0"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Input */}
        <div className="px-5 pt-3 pb-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-100/90 rounded-xl border border-transparent focus-within:border-blue-400 focus-within:bg-white transition">
            <Search size={16} className="text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Connections List */}
        <div className="flex-1 overflow-y-auto px-3 py-1 divide-y divide-gray-50 min-h-[220px] max-h-[360px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-14 space-y-2 text-gray-400">
              <Loader2 size={24} className="animate-spin text-blue-600" />
              <p className="text-xs">Loading connections...</p>
            </div>
          ) : filteredConnections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center px-4">
              <p className="text-sm font-semibold text-gray-700">
                {searchQuery ? "No connections match your search" : "No connections found"}
              </p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs">
                {searchQuery
                  ? "Try searching with a different name or company."
                  : "Connect with people across the network to share posts directly in messages."}
              </p>
            </div>
          ) : (
            filteredConnections.map((conn) => {
              const isSelected = selectedUserIds.includes(conn.userId);
              const avatarUrl = conn.image || conn.company?.logoUrl;
              const initials = (conn.name || "U").charAt(0).toUpperCase();

              return (
                <div
                  key={conn.userId}
                  onClick={() => toggleSelect(conn.userId)}
                  className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition cursor-pointer ${
                    isSelected ? "bg-blue-50/70" : "hover:bg-gray-50"
                  }`}
                >
                  {/* Avatar & User Details */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center">
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt={conn.name || "Connection"}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-sm font-bold text-gray-500">{initials}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-900 truncate leading-snug">
                        {conn.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate leading-snug mt-0.5">
                        {getHeadline(conn)}
                      </p>
                    </div>
                  </div>

                  {/* Checkbox */}
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition shrink-0 ${
                      isSelected
                        ? "bg-[#2563EB] border-[#2563EB] text-white"
                        : "border-gray-300 bg-white hover:border-gray-400"
                    }`}
                  >
                    {isSelected && <Check size={13} strokeWidth={3} />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Optional message input when connections are selected */}
        {selectedUserIds.length > 0 && (
          <div className="px-5 pt-2 pb-1 border-t border-gray-100 bg-gray-50/60">
            <input
              type="text"
              placeholder="Write a message... (optional)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-400 text-gray-900 placeholder:text-gray-400"
            />
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-white">
          {/* Copy link button */}
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:text-blue-800 transition py-1.5 px-2 rounded-lg hover:bg-blue-50"
          >
            {copied ? (
              <>
                <Check size={14} className="text-emerald-600" />
                <span className="text-emerald-600 font-bold">Link copied</span>
              </>
            ) : (
              <>
                <Link2 size={15} />
                <span>{isProfileShare ? "Copy link to profile" : "Copy link to post"}</span>
              </>
            )}
          </button>

          {/* Send Button */}
          {selectedUserIds.length > 0 && (
            <button
              type="button"
              disabled={sending}
              onClick={handleSend}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white transition disabled:opacity-50"
            >
              {sending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send size={13} />
                  <span>Send {selectedUserIds.length > 1 ? `(${selectedUserIds.length})` : ""}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}