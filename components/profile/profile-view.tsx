"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  MapPin, Link as LinkIcon, Users, Building2, UserPlus, 
  CheckCircle, Clock, Navigation, Loader2, UserMinus, Layers, Bookmark 
} from "lucide-react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { toast } from "sonner";
import ConnectModal from "../modals/connect-modal";

interface ProfileViewProps {
  userId: string;
}

export default function ProfileView({ userId }: ProfileViewProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);

  const [isFollowing, setIsFollowing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isConnectLoading, setIsConnectLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/profile/${userId}`);
        const json = await res.json();
        if (json.success) {
          setProfile(json.data);
          setIsFollowing(json.data.viewerState.isFollowing);
          setConnectionStatus(json.data.viewerState.connectionStatus);
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
    else if (!connectionStatus) {
        setShowConnectModal(true);
      }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        <SkeletonTheme baseColor="#f1f5f9" highlightColor="#ffffff">
          <Skeleton height={200} borderRadius={32} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Skeleton height={180} borderRadius={32} />
              <Skeleton height={140} borderRadius={32} />
            </div>
            <div className="space-y-6">
              <Skeleton height={300} borderRadius={32} />
            </div>
          </div>
        </SkeletonTheme>
      </div>
    );
  }

  if (!profile || !profile.company) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center p-8 bg-white rounded-[32px] shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Profile Not Found</h2>
          <p className="text-slate-500 mt-2">This user hasn't completed their company profile yet.</p>
        </div>
      </div>
    );
  }

  const { company, stats, viewerState } = profile;
  const initial = company.companyName.charAt(0).toUpperCase();

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      
      {/* Header Banner Card */}
      <div className="relative rounded-[32px] bg-white p-6 sm:p-10 shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 bg-blue-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

        <div className="relative h-28 w-28 sm:h-32 sm:w-32 shrink-0 rounded-full border-[4px] border-white shadow-xl overflow-hidden bg-slate-50 flex items-center justify-center z-10">
          {company.logoUrl ? (
            <Image src={company.logoUrl} alt="Logo" fill className="object-cover" />
          ) : (
            <span className="text-5xl font-bold text-slate-300">{initial}</span>
          )}
        </div>

        <div className="flex-1 text-center sm:text-left z-10 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center justify-center sm:justify-start gap-2">
                {company.companyName}
                {company.isBoosted && <span className="px-2 py-0.5 bg-gradient-to-r from-amber-200 to-yellow-400 text-[10px] uppercase font-bold text-yellow-900 rounded-full">Boosted</span>}
              </h1>
              <p className="text-slate-500 font-medium mt-1 text-sm">{company.type} • Founded {company.yearOfEstablishment}</p>
            </div>

            {viewerState.isOwnProfile ? (
              <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-start">
                <Link 
                  href="/profile/followers"
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition border border-slate-200 shadow-sm"
                >
                  <Users size={14} /> Manage Network
                </Link>
                <Link 
                  href="/profile/connections"
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-full bg-white text-slate-700 hover:bg-slate-50 transition border border-slate-200 shadow-sm"
                >
                  <Layers size={14} /> Connection Requests
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3 justify-center sm:justify-start">
                <button 
                  onClick={toggleFollow}
                  disabled={isFollowLoading}
                  className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-full transition shadow-sm min-w-[120px] justify-center ${
                    isFollowing ? "bg-slate-100 text-slate-700 hover:bg-slate-200" : "bg-black text-white hover:bg-slate-800"
                  }`}
                >
                  {isFollowLoading ? <Loader2 size={16} className="animate-spin" /> : 
                   isFollowing ? <CheckCircle size={16} /> : <UserPlus size={16} />}
                  {isFollowing ? "Following" : "Follow"}
                </button>
                
                <button 
                  onClick={toggleConnect}
                  disabled={isConnectLoading || connectionStatus === "PENDING"}
                  className={`group flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-full transition border min-w-[130px] justify-center ${
                    connectionStatus === "ACCEPTED" ? "bg-green-50 text-green-700 border-green-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200" :
                    connectionStatus === "PENDING" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                    "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-sm"
                  }`}
                >
                  {isConnectLoading ? <Loader2 size={16} className="animate-spin" /> :
                   connectionStatus === "ACCEPTED" ? (
                     <>
                       <CheckCircle size={16} className="block group-hover:hidden" />
                       <UserMinus size={16} className="hidden group-hover:block" />
                     </>
                   ) :
                   connectionStatus === "PENDING" ? <Clock size={16} /> :
                   <LinkIcon size={16} />}
                   
                  {connectionStatus === "ACCEPTED" ? <span className="block group-hover:hidden">Connected</span> : null}
                  {connectionStatus === "ACCEPTED" ? <span className="hidden group-hover:block">Disconnect</span> : null}
                  {connectionStatus === "PENDING" ? "Pending" : null}
                  {!connectionStatus ? "Connect" : null}
                </button>
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
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-6">
            <div className="flex flex-col items-center sm:items-start">
              <span className="font-bold text-slate-900 text-xl">{stats.followers}</span>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Followers</span>
            </div>
            <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>
            <div className="flex flex-col items-center sm:items-start">
              <span className="font-bold text-slate-900 text-xl">{stats.connections}</span>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Connections</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-[32px] bg-white p-8 shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Navigation size={18} className="text-slate-400" /> About
            </h2>
            <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-line">
              {company.description || "No description provided."}
            </p>
          </div>

          {company.dealIn?.length > 0 && (
            <div className="rounded-[32px] bg-white p-8 shadow-sm border border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 mb-5">Services & Offerings</h2>
              <div className="flex flex-wrap gap-2.5">
                {company.dealIn.map((item: string, i: number) => (
                  <span key={i} className="px-4 py-2 bg-[#F8F9FF] text-[#5667ff] rounded-xl text-sm font-semibold border border-[#EEF0FF]">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {company.lookingFor?.length > 0 && (
            <div className="rounded-[32px] bg-white p-8 shadow-sm border border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 mb-5">Looking For</h2>
              <div className="flex flex-wrap gap-2.5">
                {company.lookingFor.map((item: string, i: number) => (
                  <span key={i} className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-semibold border border-emerald-100/50">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Info Panel */}
        <div className="space-y-6">
          {/* Details Card */}
          <div className="rounded-[32px] bg-white p-8 shadow-sm border border-slate-100 space-y-6">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Details</h2>
            
            {company.location && (
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400"><MapPin size={18} /></div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Location</span>
                  <span className="font-medium text-slate-800">{company.location}</span>
                </div>
              </div>
            )}
            
            {company.website && (
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400"><LinkIcon size={18} /></div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Website</span>
                  <a href={company.website} target="_blank" rel="noreferrer" className="font-medium text-[#5667ff] hover:underline truncate">
                    {company.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 text-sm text-slate-600">
              <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400"><Users size={18} /></div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Company Size</span>
                <span className="font-medium text-slate-800">{company.size} Employees</span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-slate-600">
              <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400"><Building2 size={18} /></div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Industry</span>
                <span className="font-medium text-slate-800">{company.type}</span>
              </div>
            </div>
          </div>

          {/* Activity & Posts Card */}
          <div className="rounded-[32px] bg-white p-6 shadow-sm border border-slate-100 space-y-2">
            <h2 className="text-lg font-bold text-slate-900 mb-3 px-2">Activity</h2>
            
            {viewerState.isOwnProfile ? (
              <>
                <Link 
                  href={`/profile/${userId}/posts`}
                  className="flex items-center gap-4 w-full p-3 rounded-2xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100 group"
                >
                  <div className="p-2.5 bg-indigo-50 text-[#5667ff] rounded-xl group-hover:scale-105 transition-transform">
                    <Layers size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-800 text-sm">My Posts</span>
                    <span className="text-[11px] text-slate-500 font-medium">View your recent updates</span>
                  </div>
                </Link>
                
                <Link 
                  href={`/profile/saved-posts`}
                  className="flex items-center gap-4 w-full p-3 rounded-2xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100 group"
                >
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-105 transition-transform">
                    <Bookmark size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-800 text-sm">Saved Posts</span>
                    <span className="text-[11px] text-slate-500 font-medium">Posts you've bookmarked</span>
                  </div>
                </Link>
              </>
            ) : (
              <Link 
                href={`/profile/${userId}/posts`}
                className="flex items-center gap-4 w-full p-3 rounded-2xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100 group"
              >
                <div className="p-2.5 bg-indigo-50 text-[#5667ff] rounded-xl group-hover:scale-105 transition-transform">
                  <Layers size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-800 text-sm">View All Posts</span>
                  <span className="text-[11px] text-slate-500 font-medium">See their recent updates</span>
                </div>
              </Link>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}