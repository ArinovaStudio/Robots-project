import Image from "next/image";
import Link from "next/link";
import { EllipsisVertical, Target } from "lucide-react";
import CompanyStats from "@/components/home/search/company-stats";

export default function ExchangeCard({ company }: { company: any }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm mb-4">
      {/* Header Section */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4 items-center flex-1 min-w-0">
          <Link href={`/profile/${company.author?.id || ""}`} className="h-16 w-16 relative rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0 block">
            {company.logoUrl ? (
              <Image src={company.logoUrl} alt={company.companyName} fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-bold text-2xl text-gray-400">
                {company.companyName.charAt(0)}
              </div>
            )}
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Link href={`/profile/${company.author?.id || ""}`} className="text-xl font-bold leading-none text-gray-900 hover:text-blue-600 hover:underline transition truncate">
                {company.companyName}
              </Link>
              {company.isBoosted && (
                <span className="shrink-0 px-2 py-0.5 bg-gray-100 text-[10px] uppercase font-bold text-gray-600 rounded">
                  Boosted
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 font-medium truncate">{company.type}</p>
          </div>
        </div>
        <EllipsisVertical className="size-5 text-gray-400 cursor-pointer shrink-0" />
      </div>

      {/* Match Reason Section */}
      <div className="mt-4 flex gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <Target size={18} className="text-blue-600 shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Match Reason</span>
            <p className="text-sm text-gray-800 leading-relaxed">
                "{company.matchReason}"
            </p>
        </div>
      </div>

      {/* Description */}
      <p className="mt-4 text-sm leading-relaxed text-gray-600 line-clamp-3">
        {company.description}
      </p>

      {/* Company Stats & Match Score */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Partner Stats</span>
            <span className="px-2 py-1 bg-green-50 text-green-700 text-[11px] font-bold rounded">
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