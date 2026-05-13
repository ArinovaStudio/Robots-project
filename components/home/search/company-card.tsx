import Image from "next/image";
import { EllipsisVertical } from "lucide-react";
import CompanyStats from "@/components/home/search/company-stats";

interface Props {
  title: string;
  category: string;
}

export default function CompanyCard({ company }: { company: any }) {
  return (
    <div className="rounded-[28px] bg-background p-5 shadow-sm border border-slate-50">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4 items-center">
          <div className="size-[80px] relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-50">
            {company.logoUrl ? (
              <Image src={company.logoUrl} alt={company.companyName} fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-bold text-xl text-slate-400">
                {company.companyName.charAt(0)}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-2xl font-bold leading-none">{company.companyName}</h3>
            <p className="mt-2 text-sm text-muted-foreground font-medium">{company.type}</p>
          </div>
        </div>
        <EllipsisVertical className="size-5 text-slate-400 cursor-pointer" />
      </div>

      <p className="mt-5 text-sm leading-6 text-slate-600 line-clamp-3">
        {company.description}
        {/* <span className="cursor-pointer ml-1 font-semibold text-[#5667ff] hover:underline">
          Read More
        </span> */}
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