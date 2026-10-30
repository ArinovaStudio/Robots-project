
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin, Link as LinkIcon, Users, Building2, UserPlus,
  CheckCircle, Clock, Navigation, Loader2, UserMinus, Layers, Bookmark, ShieldCheck, Settings, Landmark,
  MessageSquare, X
} from "lucide-react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { toast } from "sonner";
import ConnectModal from "../modals/connect-modal";
import EditProfileModal from "../modals/edit-profile-modal";
import RecordInvestmentModal from "../modals/record-investment-modal";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Pencil, PlusCircle, Briefcase } from "lucide-react";
import FeedCard from "@/components/home/feed-card";
import { useUserStore } from "@/store/AuthStore";
import VerificationBadge from "@/components/ui/VerificationBadge";

interface ProfileViewProps {
  userId: string;
}

export default function ProfileView({ userId }: ProfileViewProps) {
  const { user } = useUserStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRecordInvestmentModal, setShowRecordInvestmentModal] = useState(false);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);

  const [isFollowing, setIsFollowing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);

  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isConnectLoading, setIsConnectLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [res, postsRes] = await Promise.all([
          fetch(`/api/profile/${userId}`),
          fetch(`/api/user/feed/explore?page=1&limit=2&userId=${userId}`)
        ]);
        
        const json = await res.json();
        const postsJson = await postsRes.json();
        
        if (json.success) {
          setProfile(json.data);
          setIsFollowing(json.data.viewerState.isFollowing);
          setConnectionStatus(json.data.viewerState.connectionStatus);
        }
        
        if (postsJson.success) {
          setRecentPosts(postsJson.data);
        }
      } catch (error) {
        console.error("Failed to load profile", error);
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchProfile();
  }, [userId]);

  const toggleFollow = async () => {
    setIsFollowLoading(true);
    try {
      const res = await fetch("/api/network/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId })
      });
      const data = await res.json();

      if (data.success) {
        setIsFollowing(data.isFollowing);
        toast.success(data.message);
        setProfile((prev: any) => ({
          ...prev,
          stats: {
            ...prev.stats,
            followers: data.isFollowing ? prev.stats.followers + 1 : prev.stats.followers - 1
          }
        }));
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to update follow status.");
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    setIsConnectLoading(true);
    try {
      const res = await fetch("/api/network/connect/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId }),
      });
      const data = await res.json();
      if (data.success) {
        setConnectionStatus(null);
        toast.success(data.message || "Connection request cancelled");
      } else {
        toast.error(data.message || "Failed to cancel request");
      }
    } catch {
      toast.error("Failed to cancel request");
    } finally {
      setIsConnectLoading(false);
    }
  };

  const toggleConnect = async () => {
    if (connectionStatus === "ACCEPTED") {
      setIsConnectLoading(true);
      try {
        const res = await fetch("/api/network/connect/remove", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetUserId: userId })
        });
        const data = await res.json();
        if (data.success) {
          setConnectionStatus(null);
          toast.success("Connection removed.");
          setProfile((prev: any) => ({
            ...prev,
            stats: { ...prev.stats, connections: Math.max(0, prev.stats.connections - 1) }
          }));
        } else {
          toast.error(data.message);
        }
      } catch {
        toast.error("Failed to update connection status.");
      } finally {
        setIsConnectLoading(false);
      }
    }
    else if (connectionStatus === "PENDING") {
      await handleCancelRequest();
    }
    else if (!connectionStatus) {
      setShowConnectModal(true);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <SkeletonTheme baseColor="#f1f5f9" highlightColor="#ffffff">
          <Skeleton height={200} borderRadius={8} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-4">
              <Skeleton height={180} borderRadius={8} />
              <Skeleton height={140} borderRadius={8} />
            </div>
            <div className="space-y-4">
              <Skeleton height={300} borderRadius={8} />
            </div>
          </div>
        </SkeletonTheme>
      </div>
    );
  }

  if (!profile || (!profile.company && !profile.investor)) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center p-8 bg-white rounded-[32px] shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Profile Not Found</h2>
          <p className="text-slate-500 mt-2">This user hasn&apos;t completed their profile yet.</p>
        </div>
      </div>
    );
  }

  if (profile.investor && !profile.company) {
    const { investor, stats, viewerState } = profile;
    const displayName = profile.name || "Investor";
    const initial = displayName.charAt(0).toUpperCase();

    return (
      <div className="mx-auto max-w-5xl space-y-4 pb-20">
        <ScrollReveal direction="down">
          <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="h-32 bg-[#1E3A5F] sm:h-48" />
            <div className="relative flex flex-col items-center gap-4 p-6 pt-0 sm:flex-row sm:items-start sm:gap-6 sm:p-8 sm:pt-0">
              <div className="-mt-12 flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-blue-50 text-4xl font-bold text-blue-700 shadow-sm sm:-mt-16 sm:h-32 sm:w-32">
                {profile.image ? (
                  <img src={profile.image} alt={displayName} className="h-full w-full object-cover" />
                ) : initial}
              </div>
              <div className="mt-2 w-full flex-1 text-center sm:mt-4 sm:text-left">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{displayName}</h1>
                    <p className="mt-1 text-sm font-medium text-gray-500">
                      {investor.firmName ? `${investor.investorType} · ${investor.firmName}` : investor.investorType}
                    </p>
                    {investor.location && (
                      <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-gray-500 sm:justify-start">
                        <MapPin size={15} /> {investor.location}
                      </p>
                    )}
                  </div>
                  {viewerState.isOwnProfile ? (
                    <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                      <Link href="/profile/followers" className="rounded-md bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200">
                        <Users size={16} className="mr-2 inline" /> Manage Network
                      </Link>
                      <Link href="/profile/connections" className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                        <Layers size={16} className="mr-2 inline" /> Connections
                      </Link>
                      <Link href="/settings" className="rounded-md bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200">
                        <Settings size={16} className="mr-2 inline" /> Settings
                      </Link>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3 sm:justify-start flex-wrap">
                      <button
                        onClick={toggleFollow}
                        disabled={isFollowLoading}
                        className={`flex min-w-[120px] items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition ${isFollowing ? "bg-gray-100 text-gray-700 hover:bg-gray-200" : "bg-blue-600 text-white hover:bg-blue-700"}`}
                      >
                        {isFollowLoading ? <Loader2 size={16} className="animate-spin" /> : isFollowing ? <CheckCircle size={16} /> : <UserPlus size={16} />}
                        {isFollowing ? "Following" : "Follow"}
                      </button>

                      {connectionStatus === "ACCEPTED" ? (
                        <>
                          <button
                            onClick={toggleConnect}
                            disabled={isConnectLoading}
                            className="group flex min-w-[120px] items-center justify-center gap-2 rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 shadow-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition"
                          >
                            {isConnectLoading ? <Loader2 size={16} className="animate-spin" /> : (
                              <>
                                <CheckCircle size={16} className="block group-hover:hidden" />
                                <UserMinus size={16} className="hidden group-hover:block" />
                              </>
                            )}
                            <span className="block group-hover:hidden">Connected</span>
                            <span className="hidden group-hover:block">Disconnect</span>
                          </button>
                          <Link
                            href={`/messages/${userId}`}
                            className="flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
                          >
                            <MessageSquare size={16} /> Message
                          </Link>
                        </>
                      ) : connectionStatus === "PENDING" ? (
                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-3.5 py-2 text-sm font-medium text-amber-700">
                            <Clock size={16} /> Pending
                          </span>
                          <button
                            onClick={handleCancelRequest}
                            disabled={isConnectLoading}
                            className="flex items-center justify-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 transition disabled:opacity-50"
                            title="Cancel Request"
                          >
                            {isConnectLoading ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={toggleConnect}
                          disabled={isConnectLoading}
                          className="flex min-w-[130px] items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-60"
                        >
                          {isConnectLoading ? <Loader2 size={16} className="animate-spin" /> : <LinkIcon size={16} />}
                          Connect
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                  <div className="rounded-xl border border-blue-200 bg-blue-50/70 px-3.5 py-2 text-center sm:text-left shadow-xs">
                    <span className="block text-xl font-extrabold text-blue-900">{stats.connectedCompanies ?? 0}</span>
                    <span className="text-[11px] font-bold text-blue-700 tracking-tight">connected companies - {stats.connectedCompanies ?? 0}</span>
                  </div>
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-2 text-center sm:text-left shadow-xs">
                    <span className="block text-xl font-extrabold text-emerald-900">{stats.investedIn ?? 0}</span>
                    <span className="text-[11px] font-bold text-emerald-700 tracking-tight">invested in - {stats.investedIn ?? 0}</span>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-center sm:text-left">
                    <span className="block text-xl font-bold text-gray-900">{stats.followers}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Followers</span>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-center sm:text-left">
                    <span className="block text-xl font-bold text-gray-900">{stats.connections}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Connections</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={0.1}>
          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-gray-900">Investment focus</h2>
              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="font-semibold text-gray-500">Sectors</dt>
                  <dd className="mt-1 flex flex-wrap gap-2">
                    {investor.sectors?.map((sector: string) => <span key={sector} className="rounded-full bg-blue-50 px-3 py-1 text-blue-700 font-medium">{sector}</span>)}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-500">Investment stages</dt>
                  <dd className="mt-1 flex flex-wrap gap-2">
                    {investor.stages?.map((stage: string) => <span key={stage} className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-700 font-medium">{stage}</span>)}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-500">Typical investment range</dt>
                  <dd className="mt-1 text-gray-800 font-semibold">{investor.investmentRange}</dd>
                </div>
              </dl>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-gray-900">About the investor</h2>
              <div className="space-y-3 text-sm text-gray-600">
                {investor.firmName && <p><span className="font-semibold text-gray-800">Firm: </span>{investor.firmName}</p>}
                {investor.location && <p className="flex items-center gap-2"><MapPin size={16} />{investor.location}</p>}
                {investor.website && <a href={investor.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline"><LinkIcon size={16} />Website</a>}
                {investor.linkedInUrl && <a href={investor.linkedInUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline">LinkedIn profile</a>}
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* Portfolio & Invested Companies Section */}
        <ScrollReveal direction="up" delay={0.2}>
          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-gray-900">
                  Portfolio & Companies Invested In
                </h2>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                  invested in - {stats.investedIn ?? 0}
                </span>
              </div>
              {viewerState.isOwnProfile && (
                <button
                  onClick={() => setShowRecordInvestmentModal(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition shadow-xs"
                >
                  <PlusCircle size={15} /> Record Investment
                </button>
              )}
            </div>

            {investor.recordedInvestments?.length > 0 || investor.previousStartups?.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {investor.recordedInvestments?.map((inv: any) => (
                  <div key={inv.id} className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 transition hover:border-gray-200">
                    <div className="flex items-start justify-between">
                      <h4 className="font-bold text-gray-900 text-sm">{inv.companyName}</h4>
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">{inv.stage}</span>
                    </div>
                    {inv.amount && <p className="mt-1 text-xs font-semibold text-gray-700">{inv.amount}</p>}
                    <p className="mt-1 text-[11px] text-gray-400">Invested {inv.year || "Recently"}</p>
                    {inv.notes && <p className="mt-2 text-xs text-gray-500 line-clamp-2">{inv.notes}</p>}
                  </div>
                ))}
                {investor.previousStartups?.map((startup: string, idx: number) => (
                  <div key={idx} className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
                    <h4 className="font-bold text-gray-900 text-sm">{startup}</h4>
                    <span className="mt-1 inline-block rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">Angel / Portfolio</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500">
                <p>No investments recorded in this portfolio yet.</p>
                {viewerState.isOwnProfile && (
                  <button
                    onClick={() => setShowRecordInvestmentModal(true)}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:underline"
                  >
                    <PlusCircle size={14} /> Add your first invested company
                  </button>
                )}
              </div>
            )}
          </section>
        </ScrollReveal>

        {showConnectModal && (
          <ConnectModal
            receiverId={userId}
            companyName={displayName}
            onClose={() => setShowConnectModal(false)}
            onSuccess={(message) => {
              setConnectionStatus("PENDING");
              toast.success(message);
            }}
          />
        )}

        {showRecordInvestmentModal && (
          <RecordInvestmentModal
            onClose={() => setShowRecordInvestmentModal(false)}
            onSuccess={() => {
              // Refresh profile
              const refresh = async () => {
                const res = await fetch(`/api/profile/${userId}`);
                const json = await res.json();
                if (json.success) setProfile(json.data);
              };
              refresh();
            }}
          />
        )}
      </div>
    );
  }

  const { company, stats, viewerState } = profile;
  const initial = company.companyName.charAt(0).toUpperCase();

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-20">

      {/* Header Banner Card */}
      <ScrollReveal direction="down">
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-4">
        {/* Cover Photo */}
        <div className="h-32 sm:h-48 w-full bg-slate-200 relative">
          {company.bannerUrl && (
            <Image src={company.bannerUrl} alt="Banner" fill className="object-cover" />
          )}
        </div>

        <div className="p-6 sm:p-8 pt-0 sm:pt-0 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 relative">
          <div className="-mt-12 sm:-mt-16 h-24 w-24 sm:h-32 sm:w-32 shrink-0 rounded-lg border-4 border-white shadow-sm overflow-hidden bg-gray-100 flex items-center justify-center z-10 relative">
            {company.logoUrl && company.logoUrl !== "null" ? (
              <img 
                src={company.logoUrl} 
                alt="Logo" 
                className="h-full w-full object-cover" 
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = `<span class="text-5xl font-bold text-gray-300">${initial}</span>`;
                }}
              />
            ) : (
              <span className="text-5xl font-bold text-gray-300">{initial}</span>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left z-10 w-full mt-2 sm:mt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight flex items-center justify-center sm:justify-start gap-2">
                  <span>{company.companyName}</span>
                  <VerificationBadge status={profile.verificationStatus} size="md" />
                  {company.isBoosted && <span className="px-2 py-0.5 bg-gray-100 text-[10px] uppercase font-bold text-gray-600 rounded">Boosted</span>}
                </h1>
                <p className="text-gray-500 font-medium mt-1 text-sm">{company.type} • Founded {company.yearOfEstablishment}</p>
              </div>

              {viewerState.isOwnProfile ? (
                <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-start">
                  <Link
                    href="/profile/followers"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                  >
                    <Users size={16} /> Manage Network
                  </Link>
                  <Link
                    href="/profile/connections"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-white text-gray-700 hover:bg-gray-50 transition border border-gray-200 shadow-sm"
                  >
                    <Layers size={16} /> Connection Requests
                  </Link>
                  <Link
                    href="/company/pitches"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition border border-indigo-200 shadow-sm"
                  >
                    <Landmark size={16} /> Pitches & Funding
                  </Link>

                  {profile.verificationStatus === "VERIFIED" ? (
                    <div className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-blue-50 text-blue-700 border border-blue-200 shadow-sm select-none">
                      <VerificationBadge status="VERIFIED" size="sm" showTooltip={false} /> Verified
                    </div>
                  ) : profile.verificationStatus === "PENDING" ? (
                    <Link
                      href="/verification"
                      className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-amber-50 text-amber-700 hover:bg-amber-100 transition shadow-sm border border-amber-200"
                    >
                      <Clock size={16} /> Verification Pending
                    </Link>
                  ) : profile.verificationStatus === "MORE_INFO_REQUIRED" ? (
                    <Link
                      href="/verification"
                      className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-purple-50 text-purple-700 hover:bg-purple-100 transition shadow-sm border border-purple-200"
                    >
                      <ShieldCheck size={16} /> Info Required — Update Request
                    </Link>
                  ) : profile.verificationStatus === "REJECTED" ? (
                    <Link
                      href="/verification"
                      className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-red-50 text-red-700 hover:bg-red-100 transition shadow-sm border border-red-200"
                    >
                      <ShieldCheck size={16} /> Reapply for Verification
                    </Link>
                  ) : (
                    <Link
                      href="/verification"
                      className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition shadow-sm border border-blue-200"
                    >
                      <ShieldCheck size={16} /> Apply for Verification
                    </Link>
                  )}

                  <Link
                    href="/settings"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition shadow-sm"
                  >
                    <Settings size={16} /> Settings
                  </Link>
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm"
                  >
                    <Pencil size={16} /> Edit Profile
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 justify-center sm:justify-start flex-wrap">
                  <button
                    onClick={toggleFollow}
                    disabled={isFollowLoading}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition min-w-[120px] justify-center ${isFollowing ? "bg-gray-100 text-gray-700 hover:bg-gray-200" : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                  >
                    {isFollowLoading ? <Loader2 size={16} className="animate-spin" /> :
                      isFollowing ? <CheckCircle size={16} /> : <UserPlus size={16} />}
                    {isFollowing ? "Following" : "Follow"}
                  </button>

                  {connectionStatus === "ACCEPTED" ? (
                    <>
                      <button
                        onClick={toggleConnect}
                        disabled={isConnectLoading}
                        className="group flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition border min-w-[120px] justify-center bg-green-50 text-green-700 border-green-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                      >
                        {isConnectLoading ? <Loader2 size={16} className="animate-spin" /> : (
                          <>
                            <CheckCircle size={16} className="block group-hover:hidden" />
                            <UserMinus size={16} className="hidden group-hover:block" />
                          </>
                        )}
                        <span className="block group-hover:hidden">Connected</span>
                        <span className="hidden group-hover:block">Disconnect</span>
                      </button>
                      <Link
                        href={`/messages/${userId}`}
                        className="flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
                      >
                        <MessageSquare size={16} /> Message
                      </Link>
                    </>
                  ) : connectionStatus === "PENDING" ? (
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-3.5 py-2 text-sm font-medium text-amber-700">
                        <Clock size={16} /> Pending
                      </span>
                      <button
                        onClick={handleCancelRequest}
                        disabled={isConnectLoading}
                        className="flex items-center justify-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 transition disabled:opacity-50"
                        title="Cancel Request"
                      >
                        {isConnectLoading ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={toggleConnect}
                      disabled={isConnectLoading}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition border min-w-[130px] justify-center bg-white text-gray-700 border-gray-200 hover:bg-gray-50 shadow-sm"
                    >
                      {isConnectLoading ? <Loader2 size={16} className="animate-spin" /> : <LinkIcon size={16} />}
                      Connect
                    </button>
                  )}
                </div>
              )}

              {showConnectModal && profile?.company && (
                <ConnectModal
                  receiverId={userId}
                  companyName={profile.company.companyName}
                  onClose={() => setShowConnectModal(false)}
                  onSuccess={(message) => {
                    setConnectionStatus("PENDING");
                    toast.success(message);
                  }}
                />
              )}

              {showEditModal && (profile?.company || profile?.investor) && (
                <EditProfileModal
                  profile={
                    profile.company
                      ? { ...profile.company, accountType: "BUSINESS" }
                      : {
                          ...profile.investor,
                          name: profile.name,
                          logoUrl: profile.image,
                          accountType: "INVESTOR",
                        }
                  }
                  onClose={() => setShowEditModal(false)}
                  onSuccess={() => {
                    setShowEditModal(false);
                    // Refresh profile
                    const fetchProfile = async () => {
                      const res = await fetch(`/api/profile/${userId}`);
                      const json = await res.json();
                      if (json.success) setProfile(json.data);
                    };
                    fetchProfile();
                  }}
                />
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-6 mt-6">
              <div className="rounded-xl border border-purple-200 bg-purple-50/80 px-4 py-2 text-center sm:text-left shadow-xs">
                <span className="font-extrabold text-purple-900 text-xl block">{stats.connectedInvestors ?? 0}</span>
                <span className="text-[11px] font-bold text-purple-700 tracking-tight">Connected Investors - {stats.connectedInvestors ?? 0}</span>
              </div>
              <div className="w-px h-8 bg-gray-200 hidden sm:block"></div>
              <div className="flex flex-col items-center sm:items-start">
                <span className="font-bold text-gray-900 text-xl">{stats.followers}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Followers</span>
              </div>
              <div className="w-px h-8 bg-gray-200 hidden sm:block"></div>
              <div className="flex flex-col items-center sm:items-start">
                <span className="font-bold text-gray-900 text-xl">{stats.connections}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Connections</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </ScrollReveal>

      {/* Bento Grid Content */}
      <ScrollReveal direction="up" delay={0.1}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Navigation size={18} className="text-gray-400" /> About
            </h2>
            <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-line">
              {company.description || "No description provided."}
            </p>
          </div>

          {company.dealIn?.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Services & Offerings</h2>
              <div className="flex flex-wrap gap-2">
                {company.dealIn.map((item: string, i: number) => (
                  <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm font-medium">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {company.lookingFor?.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Looking For</h2>
              <div className="flex flex-wrap gap-2">
                {company.lookingFor.map((item: string, i: number) => (
                  <span key={i} className="px-3 py-1 bg-green-50 text-green-700 rounded-md text-sm font-medium">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recent Posts — inside main column */}
          {recentPosts.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Recent Posts</h2>
                <Link href={`/profile/${userId}/posts`} className="text-sm font-semibold text-blue-600 hover:underline">
                  View all →
                </Link>
              </div>
              <div className="divide-y divide-gray-100">
                {recentPosts.map((post) => (
                  <FeedCard key={post.id} post={post} currentUser={user} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Info Panel */}
        <div className="space-y-4">
          {/* Details Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Details</h2>

            {company.location && (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="text-gray-400"><MapPin size={18} /></div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Location</span>
                  <span className="font-medium text-gray-800">{company.location}</span>
                </div>
              </div>
            )}

            {company.website && (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="text-gray-400"><LinkIcon size={18} /></div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Website</span>
                  <a href={company.website} target="_blank" rel="noreferrer" className="font-medium text-blue-600 hover:underline truncate">
                    {company.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="text-gray-400"><Users size={18} /></div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Company Size</span>
                <span className="font-medium text-gray-800">{company.size} Employees</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="text-gray-400"><Building2 size={18} /></div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Industry</span>
                <span className="font-medium text-gray-800">{company.type}</span>
              </div>
            </div>
          </div>

          {/* Activity & Posts Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm space-y-2">
            <h2 className="text-lg font-bold text-gray-900 mb-3 px-1">Activity</h2>

            {viewerState.isOwnProfile ? (
              <>
                <Link
                  href={`/profile/${userId}/posts`}
                  className="flex items-center gap-3 w-full p-2.5 rounded-md hover:bg-gray-50 transition border border-transparent hover:border-gray-200"
                >
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-md">
                    <Layers size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-800 text-sm">My Posts</span>
                    <span className="text-[11px] text-gray-500 font-medium">View your recent updates</span>
                  </div>
                </Link>

                <Link
                  href={`/profile/saved-posts`}
                  className="flex items-center gap-3 w-full p-2.5 rounded-md hover:bg-gray-50 transition border border-transparent hover:border-gray-200"
                >
                  <div className="p-2 bg-green-50 text-green-600 rounded-md">
                    <Bookmark size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-800 text-sm">Saved Posts</span>
                    <span className="text-[11px] text-gray-500 font-medium">Posts you've bookmarked</span>
                  </div>
                </Link>
              </>
            ) : (
              <Link
                href={`/profile/${userId}/posts`}
                className="flex items-center gap-3 w-full p-2.5 rounded-md hover:bg-gray-50 transition border border-transparent hover:border-gray-200"
              >
                <div className="p-2 bg-blue-50 text-blue-600 rounded-md">
                  <Layers size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-800 text-sm">View All Posts</span>
                  <span className="text-[11px] text-gray-500 font-medium">See their recent updates</span>
                </div>
              </Link>
            )}


          </div>

        </div>
      </div>
      </ScrollReveal>

    </div>
  );
}