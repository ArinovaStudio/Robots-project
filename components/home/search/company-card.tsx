import Image from "next/image";
import Link from "next/link";
import { EllipsisVertical, Handshake } from "lucide-react";
import CompanyStats from "@/components/home/search/company-stats";
import ReadMoreText from "@/components/ui/read-more-text";

interface CompanyCardProps {
  company: any;
  onCollaborate?: (company: any) => void;
  showCollaborate?: boolean;
}

export default function CompanyCard({
  company,
  onCollaborate,
  showCollaborate = false,
}: CompanyCardProps) {
  const matchSource = company.matchSource;
  const matchReason = company.matchReason;

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 mb-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4 items-center flex-1 min-w-0">
          
          <Link 
            href={`/profile/${company.userId}`} 
            className="h-16 w-16 relative rounded-xl overflow-hidden bg-gray-100 border border-[#E5E7EB] shrink-0 block"
          >
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
              <Link 
                href={`/profile/${company.userId}`} 
                className="text-xl sm:text-2xl font-bold leading-none text-[#172033] hover:text-[#2563EB] hover:underline transition truncate"
              >
                {company.companyName}
              </Link>
              {company.isBoosted && (
                <span className="shrink-0 px-2 py-0.5 bg-[#EFF6FF] text-[10px] uppercase font-bold text-[#2563EB] rounded-md border border-blue-200">
                  Boosted
                </span>
              )}

              {/* Match Reason Badge */}
              {matchSource === "both" && (
                <span className="shrink-0 px-2 py-0.5 bg-blue-50 text-[10px] font-bold text-[#2563EB] rounded-md border border-blue-200">
                  Profile & Post Match
                </span>
              )}
              {matchSource === "post" && (
                <span className="shrink-0 px-2 py-0.5 bg-blue-50/70 text-[10px] font-bold text-blue-700 rounded-md border border-blue-200">
                  Post Match
                </span>
              )}
              {matchSource === "profile" && (
                <span className="shrink-0 px-2 py-0.5 bg-gray-100 text-[10px] font-medium text-gray-600 rounded-md border border-gray-200">
                  Profile Match
                </span>
              )}
            </div>
            <p className="text-sm text-[#64748B] font-medium truncate">{company.type}</p>
          </div>
        </div>
        <EllipsisVertical className="size-5 text-[#64748B] cursor-pointer shrink-0" />
      </div>

      <div className="mt-4">
        <ReadMoreText
          text={company.description}
          charLimit={180}
          title={company.companyName}
          subtitle={company.type}
          className="text-sm leading-relaxed text-[#64748B]"
        />
      </div>

      <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
        <CompanyStats 
          size={company.size}
          type={company.type}
          followers={company.followersCount}
          connections={company.connectionsCount}
          year={company.yearOfEstablishment}
        />
      </div>

      {/* Collaborate Action inside Marketplace */}
      {showCollaborate && onCollaborate && (
        <div className="mt-4 pt-3 border-t border-[#E5E7EB] flex items-center justify-between gap-3">
          <div className="text-xs text-[#64748B] font-medium truncate">
            {matchReason ||
              (matchSource === "both"
                ? "Matched through profile & relevant posts"
                : matchSource === "post"
                ? "Matched through commercial post intent"
                : "Matched through business profile")}
          </div>
          <button
            type="button"
            onClick={() => onCollaborate(company)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white transition shrink-0"
          >
            <Handshake size={14} />
            <span>Collaborate</span>
          </button>
        </div>
      )}
    </div>
  );
}