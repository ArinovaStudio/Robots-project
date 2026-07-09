import Image from "next/image";
import Link from "next/link";
import { EllipsisVertical } from "lucide-react";
import CompanyStats from "@/components/home/search/company-stats";

export default function CompanyCard({ company }: { company: any }) {
  return (
    <div className="rounded-[28px] bg-background p-5 shadow-sm border border-slate-50 hover:border-[#5667ff]/20 transition-all duration-300">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4 items-center flex-1 min-w-0">
          
          <Link 
            href={`/profile/${company.userId}`} 
            className="size-[80px] relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-50 shrink-0 block"
          >
            {company.logoUrl ? (
              <Image src={company.logoUrl} alt={company.companyName} fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-bold text-xl text-slate-400">
                {company.companyName.charAt(0)}
              </div>
            )}
          </Link>
          
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
              <Link 
                href={`/profile/${company.userId}`} 
                className="text-xl sm:text-2xl font-bold leading-none text-slate-900 hover:text-[#5667ff] transition truncate"
              >
                {company.companyName}
              </Link>
              {company.isBoosted && (
                <span className="shrink-0 px-2.5 py-0.5 bg-gradient-to-r from-amber-200 to-yellow-400 text-[10px] uppercase font-bold text-yellow-900 rounded-full shadow-sm">
                  Boosted
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground font-medium truncate">{company.type}</p>
          </div>
        </div>
        <EllipsisVertical className="size-5 text-slate-400 cursor-pointer shrink-0" />
      </div>

      <p className="mt-5 text-sm leading-6 text-slate-600 line-clamp-3">
        {company.description}
      </p>

      <CompanyStats 
        size={company.size}
        type={company.type}
        followers={company.followersCount}
        connections={company.connectionsCount}
        year={company.yearOfEstablishment}
      />
    </div>
  );
}