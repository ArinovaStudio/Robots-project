import Image from "next/image";
import Link from "next/link";
import { EllipsisVertical } from "lucide-react";
import CompanyStats from "@/components/home/search/company-stats";

export default function CompanyCard({ company }: { company: any }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm mb-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4 items-center flex-1 min-w-0">
          
          <Link 
            href={`/profile/${company.userId}`} 
            className="h-16 w-16 relative rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0 block"
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
                className="text-xl sm:text-2xl font-bold leading-none text-gray-900 hover:text-blue-600 hover:underline transition truncate"
              >
                {company.companyName}
              </Link>
              {company.isBoosted && (
                <span className="shrink-0 px-2.5 py-0.5 bg-gray-100 text-[10px] uppercase font-bold text-gray-600 rounded">
                  Boosted
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 font-medium truncate">{company.type}</p>
          </div>
        </div>
        <EllipsisVertical className="size-5 text-gray-400 cursor-pointer shrink-0" />
      </div>

      <p className="mt-4 text-sm leading-relaxed text-gray-600 line-clamp-3">
        {company.description}
      </p>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <CompanyStats 
          size={company.size}
          type={company.type}
          followers={company.followersCount}
          connections={company.connectionsCount}
          year={company.yearOfEstablishment}
        />
      </div>
    </div>
  );
}