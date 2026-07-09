import Image from "next/image";
import Link from "next/link";
import { MapPin, Building2, Loader2, Check, X, Quote } from "lucide-react";

interface PendingCardProps {
  item: any;
  actionLoading: boolean;
  onRespond: (connectionId: string, action: "ACCEPTED" | "REJECTED") => void;
}

export default function PendingCard({ item, actionLoading, onRespond }: PendingCardProps) {
  return (
    <div className="bg-white p-5 sm:p-6 rounded-[28px] border border-slate-100 shadow-sm hover:border-indigo-200/50 hover:shadow-md transition-all duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Link href={`/profile/${item.userId}`} className="size-[56px] sm:size-[64px] rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shrink-0 relative block">
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

        <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
          <button 
            onClick={() => onRespond(item.connectionId, "REJECTED")}
            disabled={actionLoading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold text-slate-500 bg-slate-50 border border-slate-100 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition disabled:opacity-50"
          >
            {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
            Decline
          </button>
          <button 
            onClick={() => onRespond(item.connectionId, "ACCEPTED")}
            disabled={actionLoading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-bold text-white bg-slate-900 hover:bg-emerald-600 transition shadow-sm disabled:opacity-50"
          >
            {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Accept
          </button>
        </div>
      </div>

      {/* Connection Message / Reason */}
      {item.message && (
        <div className="mt-4 flex gap-3 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
          <Quote size={16} className="text-indigo-400 shrink-0 mt-0.5 fill-indigo-100" />
          <p className="text-sm text-indigo-900/80 italic font-medium leading-relaxed">
            "{item.message}"
          </p>
        </div>
      )}
    </div>
  );
}