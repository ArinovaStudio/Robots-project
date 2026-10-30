"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, TrendingUp, ArrowRight, Building2, CheckCircle2, ChevronRight, Send, MapPin, MessageSquare, Clock, X, Loader2, Landmark } from "lucide-react";
import VerificationBadge from "@/components/ui/VerificationBadge";
import ConnectModal from "@/components/modals/connect-modal";
import { toast } from "sonner";
import ReadMoreText from "@/components/ui/read-more-text";

interface Performer {
  id: string;
  userId: string;
  companyName: string;
  logoUrl: string | null;
  type: string;
  location: string | null;
  description: string;
  matchPercentage: number;
  badges: string[];
  stats: {
    followers: number;
    connections: number;
    recentViews: number;
  };
  connectionStatus: string | null;
  connectionId?: string | null;
}

export default function InvestorDashboardWidget({ user }: { user: any }) {
  const [performers, setPerformers] = useState<Performer[]>([]);
  const [preferences, setPreferences] = useState<{ sectors: string[]; stages: string[]; investmentRange: string } | null>(null);
  const [stats, setStats] = useState<{ connectedCompanies: number; investedIn: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectTarget, setConnectTarget] = useState<{ id: string; name: string } | null>(null);
  const [cancellingUserId, setCancellingUserId] = useState<string | null>(null);
  const [confirmCancelTarget, setConfirmCancelTarget] = useState<{
    userId: string;
    connectionId?: string | null;
    name: string;
  } | null>(null);

  const handleCancelConnection = async (targetUserId: string, connectionId?: string | null) => {
    setCancellingUserId(targetUserId);
    try {
      const res = await fetch("/api/network/connect/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, connectionId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Connection request cancelled");
        setPerformers((prev) =>
          prev.map((c) =>
            c.userId === targetUserId ? { ...c, connectionStatus: null, connectionId: null } : c
          )
        );
      } else {
        toast.error(data.message || "Failed to cancel request");
      }
    } catch {
      toast.error("Failed to cancel request");
    } finally {
      setCancellingUserId(null);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [perfRes, profileRes] = await Promise.all([
          fetch("/api/investor/preference-matches"),
          fetch(`/api/profile/${user.id}`)
        ]);

        const perfJson = await perfRes.json();
        const profileJson = await profileRes.json();

        if (perfJson.success) {
          setPerformers(perfJson.data.slice(0, 3));
          setPreferences(perfJson.preferences);
        }
        if (profileJson.success && profileJson.data?.stats) {
          setStats({
            connectedCompanies: profileJson.data.stats.connectedCompanies || 0,
            investedIn: profileJson.data.stats.investedIn || 0
          });
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) fetchData();
  }, [user?.id]);

  return (
    <div className="space-y-4">
      {/* Top Banner: Deal Flow & Dynamic Counts */}
      <div className="relative overflow-hidden rounded-2xl bg-[#1E3A5F] p-5 text-white border border-[#1E3A5F]">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-bold text-white border border-white/20">
                Investor Dashboard
              </span>
              {preferences?.sectors?.length ? (
                <span className="text-xs text-slate-300">
                  Focus: <strong className="text-white">{preferences.sectors.slice(0, 2).join(", ")}</strong>
                </span>
              ) : null}
            </div>
            <h2 className="mt-1 text-xl font-extrabold text-white">
              Welcome, {user?.name || "Investor"}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5 max-w-lg">
              Explore vetted ideas, products, and pitches in your portal. Connect with top-performing companies.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="rounded-xl bg-white/10 px-3.5 py-2 text-center border border-white/10">
              <span className="block text-base font-extrabold text-white">{stats?.connectedCompanies ?? 0}</span>
              <span className="text-[10px] text-blue-200 font-semibold block">connected companies</span>
            </div>
            <div className="rounded-xl bg-white/10 px-3.5 py-2 text-center border border-white/10">
              <span className="block text-base font-extrabold text-white">{stats?.investedIn ?? 0}</span>
              <span className="text-[10px] text-blue-200 font-semibold block">invested in</span>
            </div>
            <Link
              href="/investors/portal"
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-500 transition"
            >
              <Sparkles size={14} /> View Pitches
            </Link>
          </div>
        </div>
      </div>

      {/* Companies Doing Good in Your Preferences Widget */}
      {performers.length > 0 && (
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#2563EB]" />
              <h3 className="text-sm font-bold text-[#172033]">
                Companies Doing Good in Your Preferences
              </h3>
            </div>
            <Link
              href="/investors/portal?tab=performers"
              className="text-xs font-semibold text-[#2563EB] hover:underline flex items-center gap-1"
            >
              See all ranked companies <ArrowRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {performers.map((company) => (
              <div
                key={company.id}
                className="flex flex-col justify-between rounded-xl border border-[#E5E7EB] bg-white p-4 hover:border-gray-300 transition duration-150 h-full"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/profile/${company.userId}`} className="flex items-center gap-2.5 min-w-0">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100 border border-[#E5E7EB]">
                        {company.logoUrl ? (
                          <Image src={company.logoUrl} alt={company.companyName} fill className="object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center font-bold text-gray-400 text-sm">
                            {company.companyName.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-[#172033] truncate hover:text-[#2563EB] hover:underline">
                          {company.companyName}
                        </h4>
                        <p className="text-[11px] text-[#64748B] truncate">{company.type}</p>
                      </div>
                    </Link>

                    <span className="rounded-md bg-[#EFF6FF] px-2 py-0.5 text-[10px] font-bold text-[#2563EB] border border-blue-200 shrink-0">
                      {company.matchPercentage}%
                    </span>
                  </div>

                  <ReadMoreText
                    text={company.description}
                    charLimit={90}
                    title={company.companyName}
                    subtitle={`${company.type} · ${company.location || "Global"}`}
                    className="mt-2 text-[11px] text-[#64748B] leading-relaxed"
                  />
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#E5E7EB] flex items-center justify-between">
                  <span className="text-[10px] text-[#2563EB] font-semibold">
                    +{company.stats.recentViews} views this wk
                  </span>
                  {company.connectionStatus === "ACCEPTED" ? (
                    <Link
                      href={`/messages/${company.userId}`}
                      className="inline-flex items-center gap-1 rounded-md bg-[#2563EB] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-blue-700 transition"
                    >
                      <MessageSquare size={11} /> Message
                    </Link>
                  ) : company.connectionStatus === "PENDING" ? (
                    <button
                      onClick={() =>
                        setConfirmCancelTarget({
                          userId: company.userId,
                          connectionId: company.connectionId,
                          name: company.companyName,
                        })
                      }
                      disabled={cancellingUserId === company.userId}
                      className="inline-flex items-center gap-1 rounded-md bg-[#EFF6FF] px-2.5 py-1 text-[11px] font-bold text-[#2563EB] border border-blue-200 hover:bg-blue-100 transition disabled:opacity-50 cursor-pointer"
                      title="Connection request is pending. Click to cancel request."
                    >
                      {cancellingUserId === company.userId ? (
                        <Loader2 size={11} className="animate-spin" />
                      ) : (
                        <Clock size={11} />
                      )}
                      Pending
                    </button>
                  ) : (
                    <button
                      onClick={() => setConnectTarget({ id: company.userId, name: company.companyName })}
                      className="rounded-lg bg-[#2563EB] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-blue-700 transition"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Action button below Top Performers on main explore */}
          <div className="mt-4 pt-3.5 border-t border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <span className="text-xs text-[#64748B] font-medium">
              Want to see and manage your submitted pitches and investment offers?
            </span>
            <Link
              href="/investors/my-pitches"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white border border-[#E5E7EB] px-3.5 py-1.5 text-xs font-bold text-[#2563EB] hover:bg-gray-50 transition shrink-0"
            >
              <Landmark size={13} />
              My Pitches
            </Link>
          </div>
        </div>
      )}

      {/* Cancel Connection Request Confirmation Modal */}
      {confirmCancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-amber-100 p-2.5 text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Cancel Request?</h3>
                <p className="text-xs text-gray-500">Connection is currently pending</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Do you want to cancel your connection request to <strong className="text-gray-900">{confirmCancelTarget.name}</strong>?
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmCancelTarget(null)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Keep Pending
              </button>
              <button
                type="button"
                disabled={cancellingUserId === confirmCancelTarget.userId}
                onClick={async () => {
                  const target = confirmCancelTarget;
                  setConfirmCancelTarget(null);
                  await handleCancelConnection(target.userId, target.connectionId);
                }}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition disabled:opacity-50"
              >
                Yes, Cancel Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connect Modal */}
      {connectTarget && (
        <ConnectModal
          receiverId={connectTarget.id}
          companyName={connectTarget.name}
          onClose={() => setConnectTarget(null)}
          onSuccess={(msg) => {
            toast.success(msg);
            setConnectTarget(null);
          }}
        />
      )}
    </div>
  );
}
