import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface ChatHeaderProps {
  user: {
    id: string;
    name: string | null;
    company: {
      logoUrl: string | null;
      companyName: string | null;
    } | null;
  };
  isOnline: boolean;
}

export default function ChatHeader({ user, isOnline }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white/50 backdrop-blur-sm z-10 shrink-0">
      <div className="flex items-center gap-4">
        <Link href="/profile/connections" className="xl:hidden p-2 -ml-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition">
          <ArrowLeft size={20} />
        </Link>

        <Link 
          href={`/profile/${user.id}`} 
          className="flex items-center gap-4 group transition-opacity hover:opacity-90"
        >
          {/* Avatar */}
          <div className="relative">
            <div className="size-12 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shrink-0 relative group-hover:border-slate-300 transition-colors">
              {user.company?.logoUrl ? (
                <Image src={user.company.logoUrl} alt={user.name || "User"} fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-bold text-lg text-slate-400">
                  {user.company?.companyName?.charAt(0) || user.name?.charAt(0) || "?"}
                </div>
              )}
            </div>
            {/* Live Online Indicator */}
            {isOnline && (
              <div className="absolute -bottom-1 -right-1 size-4 bg-white rounded-full flex items-center justify-center">
                <div className="size-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              </div>
            )}
          </div>

          {/* User Info */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-tight group-hover:text-[#5667ff] transition-colors">
              {user.company?.companyName || user.name || "Unknown User"}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xs font-semibold ${isOnline ? "text-emerald-500" : "text-slate-400"}`}>
                {isOnline ? "Online" : "Offline"}
              </span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}