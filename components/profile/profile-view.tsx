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
    <div className="max-w-5xl mx-auto space-y-4 pb-20">
      
      {/* Header Banner Card */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-4">
        {/* Cover Photo */}
        <div className="h-32 sm:h-48 w-full bg-slate-200 relative"></div>

        <div className="p-6 sm:p-8 pt-0 sm:pt-0 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 relative">
          <div className="-mt-12 sm:-mt-16 h-24 w-24 sm:h-32 sm:w-32 shrink-0 rounded-lg border-4 border-white shadow-sm overflow-hidden bg-gray-100 flex items-center justify-center z-10 relative">
            {company.logoUrl ? (
              <Image src={company.logoUrl} alt="Logo" fill className="object-cover" />
            ) : (
              <span className="text-5xl font-bold text-gray-300">{initial}</span>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left z-10 w-full mt-2 sm:mt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight flex items-center justify-center sm:justify-start gap-2">
                  {company.companyName}
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
              </div>
            ) : (
              <div className="flex items-center gap-3 justify-center sm:justify-start">
                <button 
                  onClick={toggleFollow}
                  disabled={isFollowLoading}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition min-w-[120px] justify-center ${
                    isFollowing ? "bg-gray-100 text-gray-700 hover:bg-gray-200" : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {isFollowLoading ? <Loader2 size={16} className="animate-spin" /> : 
                   isFollowing ? <CheckCircle size={16} /> : <UserPlus size={16} />}
                  {isFollowing ? "Following" : "Follow"}
                </button>
                
                <button 
                  onClick={toggleConnect}
                  disabled={isConnectLoading || connectionStatus === "PENDING"}
                  className={`group flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition border min-w-[130px] justify-center ${
                    connectionStatus === "ACCEPTED" ? "bg-green-50 text-green-700 border-green-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200" :
                    connectionStatus === "PENDING" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                    "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 shadow-sm"
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

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-6 mt-6">
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

      {/* Bento Grid Content */}
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
    </div>
  );
}