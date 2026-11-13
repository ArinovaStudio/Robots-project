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
            <Link href={`/profile/${item.userId}`} className="text-lg font-bold text-slate-900 hover:text-blue-600 transition truncate block w-fit">
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

        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center mt-2 sm:mt-0">
          <button 
            onClick={() => onRespond(item.connectionId, "REJECTED")}
            disabled={actionLoading}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-gray-400 text-gray-700 hover:bg-gray-100 hover:border-gray-600 hover:text-gray-900 transition disabled:opacity-50 cursor-pointer shadow-2xs"
            title="Ignore invitation"
            aria-label="Ignore invitation"
          >
            {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <X size={18} strokeWidth={2} />}
          </button>
          <button 
            onClick={() => onRespond(item.connectionId, "ACCEPTED")}
            disabled={actionLoading}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-[#0a66c2] text-[#0a66c2] hover:bg-blue-50 hover:border-blue-700 hover:text-[#004182] transition disabled:opacity-50 cursor-pointer shadow-2xs"
            title="Accept invitation"
            aria-label="Accept invitation"
          >
            {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={18} strokeWidth={2.2} />}
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