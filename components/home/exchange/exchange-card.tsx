import Image from "next/image";
import Link from "next/link";
import { EllipsisVertical, Target } from "lucide-react";
import CompanyStats from "@/components/home/search/company-stats";

export default function ExchangeCard({ company }: { company: any }) {
  return (
    <div className="rounded-[28px] bg-background p-5 shadow-sm border border-slate-50 hover:border-[#5667ff]/20 transition-all">
      {/* Header Section */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4 items-center">
          <Link href={`/profile/${company.author.id}`} className="size-[80px] relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-50 shrink-0">
            {company.logoUrl ? (
              <Image src={company.logoUrl} alt={company.companyName} fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-bold text-xl text-slate-400">
                {company.companyName.charAt(0)}
              </div>
            )}
          </Link>

          <div>
            <Link href={`/profile/${company.author.id}`} className="text-2xl font-bold leading-none hover:text-[#5667ff] transition">
              {company.companyName}
            </Link>
            <p className="mt-2 text-sm text-muted-foreground font-medium">{company.type}</p>
          </div>
        </div>
        <EllipsisVertical className="size-5 text-slate-400 cursor-pointer" />
      </div>

      {/* Match Reason Section */}
      <div className="mt-5 flex gap-3 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/30">
        <Target size={18} className="text-indigo-500 shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Match Reason</span>
            <p className="text-sm text-slate-700 leading-relaxed italic">
                "{company.matchReason}"
            </p>
        </div>
      </div>

      {/* Description */}
      <p className="mt-5 text-sm leading-6 text-slate-600 line-clamp-3">
        {company.description}
      </p>

      {/* Company Stats & Match Score */}
      <div className="mt-5 pt-5 border-t border-slate-100">
        <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-slate-500 uppercase">Partner Stats</span>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-full">
                {company.matchPercentage}% Compatibility
            </span>
        </div>
        
        <CompanyStats 
          size={company.size || 0}
          type={company.type}
          followers={company.followersCount}
          connections={company.connectionsCount}
          year={company.yearOfEstablishment}
        />
      </div>
    </div>
  );
}