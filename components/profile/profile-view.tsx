"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin, Link as LinkIcon, Users, Building2, Clock, Loader2,
  Layers, ShieldCheck, Settings, Landmark, MessageSquare, X, Send,
  Handshake, Pencil, PlusCircle, Briefcase, Eye, BarChart2, Search,
  Target, ChevronLeft, ChevronRight, ThumbsUp, Repeat2, Sparkles,
  ArrowRight, Mail, Calendar, FileText, Video, UserCheck, Upload, Trash2, Check
} from "lucide-react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { toast } from "sonner";
import CollaborateModal from "../modals/collaborate-modal";
import SendPitchRequestModal from "../modals/send-pitch-request-modal";
import EditProfileModal from "../modals/edit-profile-modal";
import RecordInvestmentModal from "../modals/record-investment-modal";
import CreatePostModal from "@/components/modals/create-post-modal";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import VerificationBadge from "@/components/ui/VerificationBadge";

interface ProfileViewProps {
  userId: string;
}

type ActivityTab = "posts" | "comments" | "media" | "saved";

const OPEN_TO_OPTIONS = [
  { label: "Open to Projects", description: "Accepting new client projects." },
  { label: "Open to Investment", description: "Seeking investors or funding." },
  { label: "Open to Partnerships", description: "Looking for business or technology partners." },
  { label: "Open to Hiring", description: "Recruiting employees or interns." },
  { label: "Open to Collaborations", description: "Interested in B2B collaborations." }
] as const;

const OPEN_TO_LABELS = new Set<string>(OPEN_TO_OPTIONS.map((opt) => opt.label));

export default function ProfileView({ userId }: ProfileViewProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCollaborateModal, setShowCollaborateModal] = useState(false);
  const [showPitchModal, setShowPitchModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRecordInvestmentModal, setShowRecordInvestmentModal] = useState(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showOpenToModal, setShowOpenToModal] = useState(false);
  const [selectedOpenTo, setSelectedOpenTo] = useState<string[]>([]);
  const [isSavingOpenTo, setIsSavingOpenTo] = useState(false);

  const [showCoverModal, setShowCoverModal] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isSavingCover, setIsSavingCover] = useState(false);

  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [savedLoaded, setSavedLoaded] = useState(false);
  const [savedLoading, setSavedLoading] = useState(false);

  const [activityTab, setActivityTab] = useState<ActivityTab>("posts");
  const [activityOffset, setActivityOffset] = useState(0);

  const [isFollowing, setIsFollowing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isConnectLoading, setIsConnectLoading] = useState(false);

  const fetchProfileData = useCallback(async () => {
    try {
      const [res, postsRes] = await Promise.all([
        fetch(`/api/profile/${userId}`),
        fetch(`/api/user/feed/explore?page=1&limit=10&userId=${userId}`)
      ]);

      const [json, postsJson] = await Promise.all([res.json(), postsRes.json()]);

      if (json.success) {
        setProfile(json.data);
        setIsFollowing(json.data.viewerState.isFollowing);
        setConnectionStatus(json.data.viewerState.connectionStatus);
      }

      if (postsJson.success) {
        setRecentPosts(postsJson.data || []);
      }
    } catch (error) {
      console.error("Failed to load profile", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchProfileData();
    }
  }, [userId, fetchProfileData]);

  const handleSelectTab = async (tab: ActivityTab) => {
    setActivityTab(tab);
    setActivityOffset(0);

    if (tab === "saved" && !savedLoaded && profile?.viewerState?.isOwnProfile) {
      setSavedLoading(true);
      try {
        const res = await fetch("/api/user/saved-posts?page=1&limit=10");
        const data = await res.json();
        if (data.success) {
          setSavedPosts(data.data || []);
        }
      } catch {
        toast.error("Failed to load saved posts");
      } finally {
        setSavedLoaded(true);
        setSavedLoading(false);
      }
    }
  };

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
            followers: data.isFollowing ? prev.stats.followers + 1 : Math.max(0, prev.stats.followers - 1)
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
        body: JSON.stringify({ targetUserId: userId })
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
    if (!profile) return;
    setIsConnectLoading(true);
    try {
      if (connectionStatus === "ACCEPTED") {
        const res = await fetch("/api/network/connect", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetUserId: userId })
        });
        const data = await res.json();
        if (data.success) {
          setConnectionStatus(null);
          toast.info("Connection removed.");
          setProfile((prev: any) => ({
            ...prev,
            stats: {
              ...prev.stats,
              connections: Math.max(0, prev.stats.connections - 1)
            }
          }));
        }
      } else if (!connectionStatus) {
        const isInvestorProfile = Boolean(profile.investor && !profile.company);
        if (isInvestorProfile) {
          setShowPitchModal(true);
        } else {
          setShowCollaborateModal(true);
        }
      }
    } catch {
      toast.error("Failed to update connection.");
    } finally {
      setIsConnectLoading(false);
    }
  };

  const activeItems = useMemo(() => {
    if (activityTab === "saved") return savedPosts;
    if (activityTab === "media") {
      return recentPosts.filter((p) => {
        const mediaList = p.repostOf ? p.repostOf.media : p.media;
        return Array.isArray(mediaList) && mediaList.length > 0;
      });
    }
    if (activityTab === "comments") {
      return profile?.recentComments || [];
    }
    return recentPosts;
  }, [activityTab, recentPosts, savedPosts, profile?.recentComments]);

  const maxOffset = Math.max(0, activeItems.length - 2);
  const clampedOffset = Math.min(activityOffset, maxOffset);
  const visibleItems = activeItems.slice(clampedOffset, clampedOffset + 2);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-3 pb-16">
        <SkeletonTheme baseColor="#f1f5f9" highlightColor="#ffffff">
          <Skeleton height={260} borderRadius={12} />
          <Skeleton height={140} borderRadius={12} />
          <Skeleton height={220} borderRadius={12} />
          <Skeleton height={160} borderRadius={12} />
        </SkeletonTheme>
      </div>
    );
  }

  if (!profile || (!profile.company && !profile.investor)) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Profile Not Found</h2>
          <p className="text-gray-500 mt-2 text-sm">This user hasn&apos;t completed their profile yet.</p>
        </div>
      </div>
    );
  }

  const { company, investor, stats, viewerState } = profile;
  const isInvestorOnly = Boolean(investor && !company);

  const displayName = isInvestorOnly
    ? investor.firmName || profile.name
    : company.companyName || profile.name;
  const avatarUrl = isInvestorOnly
    ? profile.image
    : company.logoUrl || profile.image;
  const bannerUrl = company?.bannerUrl || investor?.bannerUrl || null;
  const initial = (displayName || "U").charAt(0).toUpperCase();

  const subtitle = isInvestorOnly
    ? `${investor.investorType || "Investor"}${investor.investmentRange ? ` · ${investor.investmentRange}` : ""}`
    : `${company.type}${company.yearOfEstablishment ? ` · Founded ${company.yearOfEstablishment}` : ""}`;

  const headline = isInvestorOnly
    ? investor.investmentThesis || investor.thesis || `${investor.investorType} investing across ${investor.sectors?.slice(0, 3).join(", ") || "high-growth startups"}`
    : company.description;

  const location = isInvestorOnly ? investor.location : company.location;
  const website = isInvestorOnly ? investor.website : company.website;
  const linkedInUrl = isInvestorOnly ? investor.linkedInUrl : null;
  const isBoosted = Boolean(company?.isBoosted && company?.boostExpiresAt && new Date(company.boostExpiresAt) > new Date());
  const firstPillItems = (isInvestorOnly ? investor.sectors : company.dealIn) || [];
  const secondPillItems = (isInvestorOnly ? investor.stages : company.lookingFor) || [];

  const isVerified = profile.verificationStatus === "VERIFIED";

  const openOpenToModal = () => {
    const existing = company
      ? ((company.lookingFor || []) as string[]).filter((item) => OPEN_TO_LABELS.has(item))
      : ((investor?.openTo || []) as string[]).filter((item) => OPEN_TO_LABELS.has(item));
    setSelectedOpenTo(existing);
    setShowOpenToModal(true);
  };

  const toggleOpenToOption = (label: string) => {
    setSelectedOpenTo((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  const handleSaveOpenTo = async () => {
    setIsSavingOpenTo(true);
    try {
      if (company) {
        const otherLookingFor = ((company.lookingFor || []) as string[]).filter(
          (item) => !OPEN_TO_LABELS.has(item)
        );
        const updatedLookingFor = [...selectedOpenTo, ...otherLookingFor];

        const res = await fetch("/api/company/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lookingFor: updatedLookingFor })
        });
        const data = await res.json();

        if (data.success) {
          setProfile((prev: any) => ({
            ...prev,
            company: {
              ...prev.company,
              lookingFor: updatedLookingFor
            }
          }));
          toast.success("Open to preferences saved");
          setShowOpenToModal(false);
        } else {
          toast.error(data.message || "Failed to save preferences");
        }
      } else if (investor) {
        const res = await fetch("/api/investor/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ openTo: selectedOpenTo })
        });
        const data = await res.json();

        if (data.success) {
          setProfile((prev: any) => ({
            ...prev,
            investor: {
              ...prev.investor,
              openTo: data.data.openTo
            }
          }));
          toast.success("Open to preferences saved");
          setShowOpenToModal(false);
        } else {
          toast.error(data.message || "Failed to save preferences");
        }
      }
    } catch {
      toast.error("Failed to save preferences");
    } finally {
      setIsSavingOpenTo(false);
    }
  };

  const openCoverModal = () => {
    setCoverFile(null);
    setCoverPreview(bannerUrl);
    setShowCoverModal(true);
  };

  const handleSaveCoverPhoto = async (remove = false) => {
    if (!remove && !coverFile) {
      toast.error("Please select an image first");
      return;
    }

    setIsSavingCover(true);
    try {
      const formData = new FormData();
      if (remove) {
        formData.append("removeBanner", "true");
      } else if (coverFile) {
        formData.append("banner", coverFile);
      }

      const endpoint = isInvestorOnly ? "/api/investor/profile" : "/api/company/profile";
      const res = await fetch(endpoint, {
        method: "PATCH",
        body: formData
      });
      const data = await res.json();

      if (data.success) {
        setProfile((prev: any) => ({
          ...prev,
          company: prev.company ? { ...prev.company, bannerUrl: data.data.bannerUrl } : prev.company,
          investor: prev.investor ? { ...prev.investor, bannerUrl: data.data.bannerUrl } : prev.investor
        }));
        if (coverPreview && coverFile) URL.revokeObjectURL(coverPreview);
        setCoverFile(null);
        setShowCoverModal(false);
        toast.success(remove ? "Cover photo removed" : "Cover photo updated");
      } else {
        toast.error(data.message || "Failed to update cover photo");
      }
    } catch {
      toast.error("Failed to update cover photo");
    } finally {
      setIsSavingCover(false);
    }
  };

  const formatDate = (dateInput: string) => {
    try {
      return new Date(dateInput).toLocaleDateString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "numeric"
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-2.5 pb-20">
      {/* 1. Top Hero Card */}
      <ScrollReveal direction="down">
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
          {/* Cover Banner */}
          <div className="h-36 sm:h-48 w-full relative overflow-hidden bg-linear-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81]">
            {bannerUrl ? (
              <Image src={bannerUrl} alt={`${displayName} cover banner`} fill className="object-cover" />
            ) : (
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_75%_30%,#6366f1_0%,transparent_55%),radial-gradient(circle_at_25%_75%,#0ea5e9_0%,transparent_50%)]" />
            )}

            {isBoosted && (
              <div className="absolute top-3.5 left-4 z-10 inline-flex items-center gap-1 rounded-full bg-amber-400/95 px-2.5 py-1 text-[11px] font-bold text-amber-950 shadow-xs">
                <Sparkles size={12} /> Boosted Profile
              </div>
            )}

            {viewerState.isOwnProfile && (
              <button
                type="button"
                onClick={openCoverModal}
                aria-label="Edit cover photo"
                className="absolute top-3.5 right-3.5 z-10 w-8 h-8 rounded-full bg-white text-gray-700 hover:bg-gray-100 shadow-sm flex items-center justify-center transition"
              >
                <Pencil size={15} />
              </button>
            )}
          </div>

          {/* Card Content */}
          <div className="px-6 pb-6 relative">
            {/* Avatar Overlapping Banner */}
            <div className="flex items-end justify-between -mt-16 sm:-mt-20 mb-3 relative z-10">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-white bg-white shadow-md overflow-hidden flex items-center justify-center shrink-0">
                {avatarUrl ? (
                  <Image src={avatarUrl} alt={displayName} width={144} height={144} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-slate-700 select-none">{initial}</span>
                )}
              </div>

              {viewerState.isOwnProfile && (
                <button
                  type="button"
                  onClick={() => setShowEditModal(true)}
                  aria-label="Edit profile intro"
                  className="mb-1 p-2 rounded-full text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition"
                >
                  <Pencil size={18} />
                </button>
              )}
            </div>

            {/* Name + Org Badge Split */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-900 leading-tight">{displayName}</h1>
                  <VerificationBadge status={profile.verificationStatus} size="md" />
                </div>

                <p className="text-sm font-medium text-gray-700 mt-0.5">{subtitle}</p>

                {headline && (
                  <p className="text-[15px] text-gray-800 mt-1.5 line-clamp-2 max-w-xl leading-snug">
                    {headline}
                  </p>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-gray-500">
                  {location && <span>{location}</span>}
                  {location && <span>·</span>}
                  <button
                    type="button"
                    onClick={() => setShowContactModal(true)}
                    className="font-semibold text-[#0a66c2] hover:underline"
                  >
                    Contact info
                  </button>
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  {viewerState.isOwnProfile ? (
                    <Link href="/profile/connections" className="font-semibold text-[#0a66c2] hover:underline">
                      {stats.connections} {stats.connections === 1 ? "connection" : "connections"}
                    </Link>
                  ) : (
                    <span className="font-semibold text-[#0a66c2]">
                      {stats.connections} {stats.connections === 1 ? "connection" : "connections"}
                    </span>
                  )}

                  {isInvestorOnly && (
                    <span className="text-xs font-medium text-gray-500">
                      · {stats.investedIn ?? 0} invested
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Pills Row */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {viewerState.isOwnProfile ? (
                <>
                  <button
                    type="button"
                    onClick={openOpenToModal}
                    className="rounded-full bg-[#0a66c2] hover:bg-[#004182] text-white px-4 py-1.5 text-sm font-semibold transition cursor-pointer"
                  >
                    Open to
                  </button>

                  {isInvestorOnly ? (
                    <button
                      type="button"
                      onClick={() => setShowRecordInvestmentModal(true)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#0a66c2] text-[#0a66c2] hover:bg-blue-50/70 px-4 py-1.5 text-sm font-semibold transition cursor-pointer"
                    >
                      <PlusCircle size={15} /> Record investment
                    </button>
                  ) : (
                    <Link
                      href="/company/pitches"
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#0a66c2] text-[#0a66c2] hover:bg-blue-50/70 px-4 py-1.5 text-sm font-semibold transition"
                    >
                      <Send size={14} /> Pitches &amp; Funding
                    </Link>
                  )}

                  <Link
                    href="/profile/followers"
                    className="inline-flex items-center gap-1.5 rounded-full border border-gray-400 text-gray-700 hover:bg-gray-100 hover:border-gray-600 px-4 py-1.5 text-sm font-semibold transition"
                  >
                    Manage network
                  </Link>

                  <Link
                    href="/verification"
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${isVerified
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : profile.verificationStatus === "PENDING"
                          ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                          : "border-gray-300 text-gray-700 hover:bg-gray-100"
                      }`}
                  >
                    <ShieldCheck size={15} />
                    {isVerified ? "Verified" : profile.verificationStatus === "PENDING" ? "Pending Review" : "Verify"}
                  </Link>

                  <Link
                    href="/settings"
                    aria-label="Settings"
                    className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition"
                    title="Settings"
                  >
                    <Settings size={16} />
                  </Link>
                </>
              ) : (
                <>
                  {connectionStatus === "ACCEPTED" ? (
                    <>
                      <button
                        type="button"
                        onClick={toggleConnect}
                        disabled={isConnectLoading}
                        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 text-sm font-semibold transition"
                      >
                        {isConnectLoading ? <Loader2 size={15} className="animate-spin" /> : <UserCheck size={15} />}
                        Connected
                      </button>
                      <Link
                        href={`/messages/${userId}`}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#0a66c2] hover:bg-[#004182] text-white px-4 py-1.5 text-sm font-semibold transition"
                      >
                        <MessageSquare size={15} /> Message
                      </Link>
                    </>
                  ) : connectionStatus === "PENDING" ? (
                    <>
                      <button
                        type="button"
                        disabled
                        className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-300 text-amber-700 px-4 py-1.5 text-sm font-semibold"
                      >
                        <Clock size={15} /> Pending
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelRequest}
                        disabled={isConnectLoading}
                        className="inline-flex items-center gap-1 rounded-full border border-gray-300 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 px-3.5 py-1.5 text-sm font-semibold transition"
                      >
                        <X size={15} /> Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={toggleConnect}
                      disabled={isConnectLoading}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#0a66c2] hover:bg-[#004182] text-white px-4 py-1.5 text-sm font-semibold transition cursor-pointer"
                    >
                      {isConnectLoading ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : isInvestorOnly ? (
                        <Send size={15} />
                      ) : (
                        <Handshake size={15} />
                      )}
                      {isInvestorOnly ? "Send pitch request" : "Collaborate"}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={toggleFollow}
                    disabled={isFollowLoading}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold transition cursor-pointer ${isFollowing
                        ? "border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200"
                        : "border-[#0a66c2] text-[#0a66c2] hover:bg-blue-50/70"
                      }`}
                  >
                    {isFollowLoading && <Loader2 size={14} className="animate-spin" />}
                    {isFollowing ? "Following" : "+ Follow"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowContactModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100 px-4 py-1.5 text-sm font-semibold transition"
                  >
                    Contact info
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* 2. Dashboard / Analytics Card (Own Profile Only) */}
      {viewerState.isOwnProfile && (
        <ScrollReveal direction="up" delay={0.08}>
          <section className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
            <div className="p-5 pb-4">
              <h2 className="text-lg font-bold text-gray-900 leading-snug">Dashboard</h2>
              <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                <Eye size={14} className="text-gray-500" />
                Private to you
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <Link href="/profile/connections" className="group flex items-start gap-2.5 p-1.5 rounded-lg hover:bg-gray-50 transition">
                  <Users size={19} className="text-gray-700 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-gray-900 group-hover:text-[#0a66c2] transition">
                      {stats.profileViews ?? 0} profile views
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5 leading-snug">
                      Discover who&apos;s viewed your profile.
                    </p>
                  </div>
                </Link>

                <Link href={`/profile/${userId}/posts`} className="group flex items-start gap-2.5 p-1.5 rounded-lg hover:bg-gray-50 transition">
                  <BarChart2 size={19} className="text-gray-700 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-gray-900 group-hover:text-[#0a66c2] transition">
                      {stats.postImpressions ?? 0} post impressions
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5 leading-snug">
                      {(stats.postImpressions ?? 0) > 0 ? "Recent engagement on your posts." : "Start a post to increase engagement."}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">Past 7 days</p>
                  </div>
                </Link>

                <Link href="/explore" className="group flex items-start gap-2.5 p-1.5 rounded-lg hover:bg-gray-50 transition">
                  <Search size={19} className="text-gray-700 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-gray-900 group-hover:text-[#0a66c2] transition">
                      {stats.searchAppearances ?? 0} search appearances
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5 leading-snug">
                      See how often you appear in search results.
                    </p>
                  </div>
                </Link>
              </div>
            </div>

            <Link
              href={`/profile/${userId}/posts`}
              className="flex items-center justify-center gap-1.5 border-t border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Show all <ArrowRight size={15} />
            </Link>
          </section>
        </ScrollReveal>
      )}

      {/* 4. Activity Card */}
      <ScrollReveal direction="up" delay={0.1}>
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
          <div className="p-5 pb-4">
            {/* Header Row */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900 leading-snug">Activity</h2>
                {viewerState.isOwnProfile ? (
                  <Link href="/profile/followers" className="text-sm font-semibold text-[#0a66c2] hover:underline">
                    {stats.followers} {stats.followers === 1 ? "follower" : "followers"}
                  </Link>
                ) : (
                  <p className="text-sm font-semibold text-[#0a66c2]">
                    {stats.followers} {stats.followers === 1 ? "follower" : "followers"}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {viewerState.isOwnProfile && (
                  <button
                    type="button"
                    onClick={() => setShowCreatePostModal(true)}
                    className="rounded-full border border-[#0a66c2] text-[#0a66c2] hover:bg-blue-50/70 px-3.5 py-1 text-sm font-semibold transition cursor-pointer"
                  >
                    Create a post
                  </button>
                )}
                <Link
                  href={`/profile/${userId}/posts`}
                  aria-label="Manage posts"
                  className="p-2 rounded-full text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition"
                >
                  <Pencil size={17} />
                </Link>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              {([
                { id: "posts", label: "Posts" },
                { id: "comments", label: "Comments" },
                { id: "media", label: "Media" },
                ...(viewerState.isOwnProfile ? [{ id: "saved", label: "Saved" }] : [])
              ] as { id: ActivityTab; label: string }[]).map((tab) => {
                const isActive = activityTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleSelectTab(tab.id)}
                    className={`rounded-full px-3.5 py-1 text-sm font-semibold transition cursor-pointer ${isActive
                        ? "bg-[#01754f] text-white"
                        : "border border-gray-300 text-gray-700 hover:bg-gray-100"
                      }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* 2-Card Carousel Content */}
            <div className="mt-4 relative">
              {activityTab === "saved" && savedLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="h-56 rounded-xl bg-gray-100 animate-pulse" />
                  <div className="h-56 rounded-xl bg-gray-100 animate-pulse" />
                </div>
              ) : visibleItems.length > 0 ? (
                <>
                  {clampedOffset > 0 && (
                    <button
                      type="button"
                      onClick={() => setActivityOffset((prev) => Math.max(0, prev - 1))}
                      aria-label="Previous activity"
                      className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-md items-center justify-center text-gray-700 hover:bg-gray-50 transition"
                    >
                      <ChevronLeft size={18} />
                    </button>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activityTab === "comments"
                      ? visibleItems.map((comment: any) => (
                        <Link
                          key={comment.id}
                          href={`/post/${comment.postId}`}
                          className="rounded-xl border border-gray-200 p-4 flex flex-col justify-between bg-white hover:border-gray-300 transition"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 text-xs text-gray-500">
                              <span className="font-semibold text-gray-800 truncate">
                                {displayName} commented
                              </span>
                              <span>{formatDate(comment.createdAt)}</span>
                            </div>
                            <p className="mt-2.5 text-sm text-gray-900 line-clamp-3 leading-snug">
                              {comment.content}
                            </p>
                          </div>
                          <div className="mt-3 pt-2.5 border-t border-gray-100 text-xs text-gray-500 line-clamp-1">
                            On {comment.post?.author?.name || "a post"}
                            {comment.post?.content ? `: “${comment.post.content}”` : ""}
                          </div>
                        </Link>
                      ))
                      : visibleItems.map((post: any) => {
                        const targetPost = post.repostOf || post;
                        const isRepost = Boolean(post.repostOf);
                        const targetAuthorName =
                          targetPost.author?.company?.companyName ||
                          targetPost.author?.name ||
                          displayName;
                        const targetAuthorImg =
                          targetPost.author?.company?.logoUrl || targetPost.author?.image;
                        const targetVerified = targetPost.author?.verificationStatus || "UNVERIFIED";
                        const firstMedia = targetPost.media?.[0];
                        const likesCount = post.reactionCounts?.total ?? post._count?.reactions ?? 0;
                        const commentsCount = post._count?.comments ?? 0;
                        const repostsCount = post._count?.reposts ?? 0;

                        return (
                          <div
                            key={post.id}
                            className="rounded-xl border border-gray-200 p-3.5 flex flex-col justify-between bg-white hover:border-gray-300 transition"
                          >
                            <div>
                              {isRepost && (
                                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-gray-100 text-xs text-gray-600">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-200 shrink-0 flex items-center justify-center">
                                      {avatarUrl ? (
                                        <Image src={avatarUrl} alt={displayName} width={20} height={20} className="w-full h-full object-cover" />
                                      ) : (
                                        <span className="text-[10px] font-bold text-gray-700">{initial}</span>
                                      )}
                                    </div>
                                    <span className="truncate">
                                      <strong className="text-gray-900">{displayName}</strong> reposted this
                                    </span>
                                  </div>
                                  <Link href={`/post/${post.id}`} className="text-gray-400 hover:text-gray-700 px-1 font-bold">
                                    ···
                                  </Link>
                                </div>
                              )}

                              {/* Post Author Header */}
                              <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 bg-gray-100 shrink-0 flex items-center justify-center">
                                  {targetAuthorImg ? (
                                    <Image src={targetAuthorImg} alt={targetAuthorName} width={36} height={36} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-sm font-bold text-blue-700">
                                      {targetAuthorName.charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1">
                                    <Link
                                      href={`/post/${post.id}`}
                                      className="text-sm font-bold text-gray-900 hover:underline truncate"
                                    >
                                      {targetAuthorName}
                                    </Link>
                                    <VerificationBadge status={targetVerified} size="xs" />
                                  </div>
                                  <p className="text-[11px] text-gray-500">{formatDate(post.createdAt)}</p>
                                </div>
                              </div>

                              {/* Snippet */}
                              <Link href={`/post/${post.id}`} className="block mt-2.5 group">
                                <p className="text-sm text-gray-800 line-clamp-2 leading-snug">
                                  {targetPost.content || "Shared an update"}
                                </p>
                                {(targetPost.content || "").length > 85 && (
                                  <span className="text-xs font-medium text-gray-500 group-hover:text-[#0a66c2]">
                                    ...more
                                  </span>
                                )}
                              </Link>

                              {/* Media Preview */}
                              {firstMedia && (
                                <Link
                                  href={`/post/${post.id}`}
                                  className="block mt-2.5 relative h-36 w-full rounded-lg overflow-hidden bg-slate-900 border border-gray-100"
                                >
                                  {firstMedia.type === "IMAGE" ? (
                                    <Image
                                      src={firstMedia.url}
                                      alt="Post attachment"
                                      fill
                                      className="object-cover"
                                    />
                                  ) : firstMedia.type === "VIDEO" ? (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-white/90 gap-1.5 bg-slate-900">
                                      <Video size={26} />
                                      <span className="text-xs font-medium">Video attachment</span>
                                    </div>
                                  ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-700 gap-1.5 bg-gray-100">
                                      <FileText size={24} />
                                      <span className="text-xs font-medium">Document attachment</span>
                                    </div>
                                  )}
                                </Link>
                              )}
                            </div>

                            {/* Engagement Row */}
                            <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center gap-4">
                                <span className="inline-flex items-center gap-1">
                                  <ThumbsUp size={13} /> {likesCount}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <MessageSquare size={13} /> {commentsCount}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <Repeat2 size={14} /> {repostsCount}
                                </span>
                              </div>
                              <Link href={`/post/${post.id}`} aria-label="View post" className="text-gray-500 hover:text-gray-900">
                                <Send size={13} />
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {clampedOffset < maxOffset && (
                    <button
                      type="button"
                      onClick={() => setActivityOffset((prev) => Math.min(maxOffset, prev + 1))}
                      aria-label="Next activity"
                      className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-md items-center justify-center text-gray-700 hover:bg-gray-50 transition"
                    >
                      <ChevronRight size={18} />
                    </button>
                  )}
                </>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                  {activityTab === "comments"
                    ? "No comments yet."
                    : activityTab === "media"
                      ? "No media posts yet."
                      : activityTab === "saved"
                        ? "You haven't bookmarked any posts yet."
                        : "No posts shared yet."}
                </div>
              )}
            </div>
          </div>

          <Link
            href={activityTab === "saved" ? "/profile/saved-posts" : `/profile/${userId}/posts`}
            className="flex items-center justify-center gap-1.5 border-t border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            Show all <ArrowRight size={15} />
          </Link>
        </section>
      </ScrollReveal>

      {/* 5. About Card */}
      <ScrollReveal direction="up" delay={0.12}>
        <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-lg font-bold text-gray-900">About</h2>
            {viewerState.isOwnProfile && (
              <button
                type="button"
                onClick={() => setShowEditModal(true)}
                aria-label="Edit about"
                className="p-1.5 rounded-full text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition"
              >
                <Pencil size={17} />
              </button>
            )}
          </div>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {headline || "No overview description added yet."}
          </p>
        </section>
      </ScrollReveal>

      {/* 6. Details Card */}
      <ScrollReveal direction="up" delay={0.14}>
        <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="text-lg font-bold text-gray-900">Details</h2>
            {viewerState.isOwnProfile && (
              <button
                type="button"
                onClick={() => setShowEditModal(true)}
                aria-label="Edit details"
                className="p-1.5 rounded-full text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition"
              >
                <Pencil size={17} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isInvestorOnly ? (
              <>
                {investor.firmName && (
                  <div className="flex items-center gap-3 text-sm">
                    <Landmark size={18} className="text-gray-500 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Firm</p>
                      <p className="font-semibold text-gray-900">{investor.firmName}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <Briefcase size={18} className="text-gray-500 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Investor type</p>
                    <p className="font-semibold text-gray-900">{investor.investorType}</p>
                  </div>
                </div>
                {investor.investmentRange && (
                  <div className="flex items-center gap-3 text-sm">
                    <BarChart2 size={18} className="text-gray-500 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Typical investment range</p>
                      <p className="font-semibold text-gray-900">{investor.investmentRange}</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 text-sm sm:border-r sm:border-gray-200 sm:pr-4">
                  <Users size={18} className="text-gray-500 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Company size</p>
                    <p className="font-semibold text-gray-900">{company.size} Employees</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Building2 size={18} className="text-gray-500 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Industry</p>
                    <p className="font-semibold text-gray-900">{company.type}</p>
                  </div>
                </div>
              </>
            )}

            {website && (
              <div className="flex items-center gap-3 text-sm sm:border-r sm:border-gray-200 sm:pr-4">
                <LinkIcon size={18} className="text-gray-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">Website</p>
                  <a
                    href={website.startsWith("http") ? website : `https://${website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-[#0a66c2] hover:underline truncate block"
                  >
                    {website.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              </div>
            )}

            {location && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin size={18} className="text-gray-500 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Location</p>
                  <p className="font-semibold text-gray-900">{location}</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </ScrollReveal>

      {/* 7. Services & Offerings / Focus Sectors */}
      <ScrollReveal direction="up" delay={0.16}>
        <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-gray-800" />
              <h2 className="text-lg font-bold text-gray-900">
                {isInvestorOnly ? "Focus Sectors" : "Services & Offerings"}
              </h2>
            </div>
            {viewerState.isOwnProfile && (
              <button
                type="button"
                onClick={() => setShowEditModal(true)}
                aria-label="Edit services"
                className="p-1.5 rounded-full text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition"
              >
                <Pencil size={17} />
              </button>
            )}
          </div>

          {firstPillItems.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {firstPillItems.map((item: string) => (
                <span
                  key={item}
                  className="rounded-full bg-gray-100 text-gray-800 px-3.5 py-1.5 text-sm font-medium"
                >
                  {item}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">None specified yet.</p>
          )}
        </section>
      </ScrollReveal>

      {/* 8. Looking For / Target Investment Stages */}
      <ScrollReveal direction="up" delay={0.18}>
        <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target size={18} className="text-gray-800" />
              <h2 className="text-lg font-bold text-gray-900">
                {isInvestorOnly ? "Target Investment Stages" : "Looking For"}
              </h2>
            </div>
            {viewerState.isOwnProfile && (
              <button
                type="button"
                onClick={() => setShowEditModal(true)}
                aria-label="Edit looking for"
                className="p-1.5 rounded-full text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition"
              >
                <Pencil size={17} />
              </button>
            )}
          </div>

          {secondPillItems.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {secondPillItems.map((item: string) => (
                <span
                  key={item}
                  className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-3.5 py-1.5 text-sm font-medium"
                >
                  {item}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">None specified yet.</p>
          )}
        </section>
      </ScrollReveal>

      {/* 9. Investor Open To & Portfolio Cards (Investor Profiles Only) */}
      {isInvestorOnly && investor.openTo?.length > 0 && (
        <ScrollReveal direction="up" delay={0.19}>
          <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target size={18} className="text-gray-800" />
                <h2 className="text-lg font-bold text-gray-900">Open to</h2>
              </div>
              {viewerState.isOwnProfile && (
                <button
                  type="button"
                  onClick={openOpenToModal}
                  aria-label="Edit Open to"
                  className="p-1.5 rounded-full text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition"
                >
                  <Pencil size={17} />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {investor.openTo.map((item: string) => (
                <span
                  key={item}
                  className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-3.5 py-1.5 text-sm font-medium"
                >
                  {item}
                </span>
              ))}
            </div>
          </section>
        </ScrollReveal>
      )}

      {isInvestorOnly && (
        <ScrollReveal direction="up" delay={0.2}>
          <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Briefcase size={18} className="text-emerald-600" />
                <h2 className="text-lg font-bold text-gray-900">Portfolio &amp; Companies Invested In</h2>
                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                  {stats.investedIn ?? 0} invested
                </span>
              </div>
              {viewerState.isOwnProfile && (
                <button
                  type="button"
                  onClick={() => setShowRecordInvestmentModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 text-xs font-semibold transition"
                >
                  <PlusCircle size={14} /> Record investment
                </button>
              )}
            </div>

            {investor.recordedInvestments?.length > 0 || investor.previousStartups?.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {investor.recordedInvestments?.map((inv: any) => (
                  <div key={inv.id} className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-gray-900 text-sm">{inv.companyName}</h4>
                      <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        {inv.stage}
                      </span>
                    </div>
                    {inv.amount && <p className="mt-1 text-xs font-semibold text-gray-700">{inv.amount}</p>}
                    <p className="mt-1 text-[11px] text-gray-500">Invested {inv.year || "Recently"}</p>
                    {inv.notes && <p className="mt-2 text-xs text-gray-600 line-clamp-2">{inv.notes}</p>}
                  </div>
                ))}
                {investor.previousStartups?.map((startup: string, idx: number) => (
                  <div key={idx} className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
                    <h4 className="font-bold text-gray-900 text-sm">{startup}</h4>
                    <span className="mt-1.5 inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700">
                      Portfolio / Angel
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                <p>No investments recorded in this portfolio yet.</p>
                {viewerState.isOwnProfile && (
                  <button
                    type="button"
                    onClick={() => setShowRecordInvestmentModal(true)}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:underline"
                  >
                    <PlusCircle size={14} /> Add your first invested company
                  </button>
                )}
              </div>
            )}
          </section>
        </ScrollReveal>
      )}

      {/* Contact Info Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-gray-200 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h3 className="text-lg font-bold text-gray-900">{displayName}</h3>
              <button
                type="button"
                onClick={() => setShowContactModal(false)}
                aria-label="Close contact info"
                className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 transition"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <h4 className="text-sm font-semibold text-gray-900">Contact Info</h4>

              {profile.email && (
                <div className="flex items-start gap-3">
                  <Mail size={18} className="text-gray-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-500">Email</p>
                    <a href={`mailto:${profile.email}`} className="text-sm font-medium text-[#0a66c2] hover:underline">
                      {profile.email}
                    </a>
                  </div>
                </div>
              )}

              {website && (
                <div className="flex items-start gap-3">
                  <LinkIcon size={18} className="text-gray-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-500">Website</p>
                    <a
                      href={website.startsWith("http") ? website : `https://${website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-[#0a66c2] hover:underline break-all"
                    >
                      {website}
                    </a>
                  </div>
                </div>
              )}

              {linkedInUrl && (
                <div className="flex items-start gap-3">
                  <LinkIcon size={18} className="text-gray-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-500">LinkedIn</p>
                    <a
                      href={linkedInUrl.startsWith("http") ? linkedInUrl : `https://${linkedInUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-[#0a66c2] hover:underline break-all"
                    >
                      {linkedInUrl}
                    </a>
                  </div>
                </div>
              )}

              {location && (
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-gray-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-500">Location</p>
                    <p className="text-sm font-medium text-gray-800">{location}</p>
                  </div>
                </div>
              )}

              {profile.joinedAt && (
                <div className="flex items-start gap-3">
                  <Calendar size={18} className="text-gray-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-500">Member since</p>
                    <p className="text-sm font-medium text-gray-800">
                      {new Date(profile.joinedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Open To Modal */}
      {showOpenToModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-gray-200 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h3 className="text-lg font-bold text-gray-900">Open to</h3>
              <button
                type="button"
                onClick={() => setShowOpenToModal(false)}
                aria-label="Close Open to"
                className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 transition"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-2">
              {OPEN_TO_OPTIONS.map((option) => {
                const isSelected = selectedOpenTo.includes(option.label);
                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => toggleOpenToOption(option.label)}
                    className={`w-full text-left flex items-start justify-between gap-3 rounded-xl border p-3.5 transition cursor-pointer ${
                      isSelected
                        ? "border-[#0a66c2] bg-blue-50/60"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-bold text-gray-900">{option.label}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{option.description}</p>
                    </div>
                    <div
                      className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition ${
                        isSelected
                          ? "bg-[#0a66c2] border-[#0a66c2] text-white"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {isSelected && <Check size={12} />}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-5 py-3.5 bg-gray-50">
              <button
                type="button"
                onClick={() => setShowOpenToModal(false)}
                className="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveOpenTo}
                disabled={isSavingOpenTo}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#0a66c2] hover:bg-[#004182] text-white px-5 py-1.5 text-sm font-semibold transition disabled:opacity-60"
              >
                {isSavingOpenTo && <Loader2 size={14} className="animate-spin" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cover Photo Only Modal */}
      {showCoverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-gray-200 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h3 className="text-lg font-bold text-gray-900">Cover photo</h3>
              <button
                type="button"
                onClick={() => {
                  if (coverPreview && coverFile) URL.revokeObjectURL(coverPreview);
                  setShowCoverModal(false);
                }}
                aria-label="Close cover photo editor"
                className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 transition"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="h-44 w-full rounded-xl overflow-hidden relative bg-linear-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81] border border-gray-200">
                {coverPreview ? (
                  <Image src={coverPreview} alt="Cover photo preview" fill unoptimized className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/80 text-sm font-medium">
                    No custom cover photo set
                  </div>
                )}
              </div>

              <label className="flex items-center justify-center gap-2 w-full rounded-xl border border-dashed border-gray-300 px-4 py-3 text-sm font-semibold text-[#0a66c2] hover:bg-blue-50/50 transition cursor-pointer">
                <Upload size={16} />
                {coverFile ? coverFile.name : "Choose a new cover photo"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (coverPreview && coverFile) URL.revokeObjectURL(coverPreview);
                      setCoverFile(file);
                      setCoverPreview(URL.createObjectURL(file));
                    }
                  }}
                />
              </label>
            </div>
            <div className="flex items-center justify-between border-t border-gray-200 px-5 py-3.5 bg-gray-50">
              <div>
                {bannerUrl && (
                  <button
                    type="button"
                    onClick={() => handleSaveCoverPhoto(true)}
                    disabled={isSavingCover}
                    className="inline-flex items-center gap-1.5 rounded-full border border-red-200 px-3.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition disabled:opacity-60"
                  >
                    <Trash2 size={14} /> Remove photo
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (coverPreview && coverFile) URL.revokeObjectURL(coverPreview);
                    setShowCoverModal(false);
                  }}
                  className="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveCoverPhoto(false)}
                  disabled={isSavingCover || !coverFile}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#0a66c2] hover:bg-[#004182] text-white px-5 py-1.5 text-sm font-semibold transition disabled:opacity-50"
                >
                  {isSavingCover && <Loader2 size={14} className="animate-spin" />}
                  Save photo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCollaborateModal && (
        <CollaborateModal
          recipientId={userId}
          companyName={displayName}
          onClose={() => setShowCollaborateModal(false)}
          onSuccess={() => setConnectionStatus("PENDING")}
        />
      )}

      {showPitchModal && (
        <SendPitchRequestModal
          investorId={userId}
          investorName={displayName}
          onClose={() => setShowPitchModal(false)}
          onSuccess={() => setConnectionStatus("PENDING")}
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
            fetchProfileData();
          }}
        />
      )}

      {showRecordInvestmentModal && (
        <RecordInvestmentModal
          onClose={() => setShowRecordInvestmentModal(false)}
          onSuccess={() => fetchProfileData()}
        />
      )}

      <CreatePostModal
        isOpen={showCreatePostModal}
        onClose={() => {
          setShowCreatePostModal(false);
          fetchProfileData();
        }}
      />
    </div>
  );
}