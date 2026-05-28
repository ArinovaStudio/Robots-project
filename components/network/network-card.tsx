import Image from "next/image";
import Link from "next/link";
import { MapPin, Building2, Loader2 } from "lucide-react";

interface NetworkCardProps {
  item: any;
  activeTab: "followers" | "following";
  actionLoading: boolean;
  onToggleFollow: (userId: string, isFollowingList: boolean) => void;
}

export default function NetworkCard({ item, activeTab, actionLoading, onToggleFollow }: NetworkCardProps) {
  return (
    <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm hover:border-[#5667ff]/20 hover:shadow-md transition-all duration-300 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <Link href={`/profile/${item.userId}`} className="size-[64px] rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shrink-0 relative block">
          {item.logoUrl ? (
            <Image src={item.logoUrl} alt={item.companyName || "Company"} fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-bold text-xl text-slate-400">
              {item.companyName?.charAt(0) || "?"}
            </div>
          )}
        </Link>

        <div className="flex-1 min-w-0">
          <Link href={`/profile/${item.userId}`} className="text-lg font-bold text-slate-900 hover:text-[#5667ff] transition truncate block w-fit">
            {item.companyName || "Unknown Company"}
          </Link>
          
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            {item.type && (
              <div className="flex items-center gap-1 text-xs font-medium text-slate-500">
                <Building2 size={12} className="text-slate-400" /> {item.type}
              </div>
            )}
            {item.location && (
              <div className="flex items-center gap-1 text-xs font-medium text-slate-500">
                <MapPin size={12} className="text-slate-400" /> {item.location}
              </div>
            )}
          </div>
        </div>
      </div>

      <button 
        onClick={() => onToggleFollow(item.userId, activeTab === "following")}
        disabled={actionLoading}
        className={`hidden sm:flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition shrink-0 min-w-[120px] ${
          activeTab === "following" || item.isFollowing 
            ? "bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-100 border border-transparent" 
            : "bg-[#5667ff] text-white hover:bg-[#4352cc]"
        }`}
      >
        {actionLoading ? (
          <Loader2 size={14} className="animate-spin mx-auto" />
        ) : activeTab === "following" || item.isFollowing ? (
          <>Unfollow</>
        ) : (
          <>Follow Back</>
        )}
      </button>
    </div>
  );
}