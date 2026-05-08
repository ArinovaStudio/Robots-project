import SuggestedProfiles from "@/components/SuggestedProfiles";
import { Bed, Lock } from "lucide-react";
import Image from "next/image";

export default function RightSidebar() {
  return (
    <div className="space-y-3">
      {/* Companies */}
      <SuggestedProfiles/>

      {/* Investors */}
      <div className="flex h-[170px] flex-col items-center justify-center rounded-2xl bg-white p-5 text-center shadow-sm">
        <h3 className="text-2xl"><Lock /></h3>

        <h4 className="mt-3 text-lg font-medium text-slate-800">
          Top Investors for you
        </h4>

        <p className="mt-2 text-xs text-slate-400">Coming soon...</p>
      </div>
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        {/* Heading */}
        <h3 className="text-sm font-semibold text-slate-900">
          Requests for connections
        </h3>

        {/* Empty State */}
        <div className="flex h-[140px] flex-col items-center justify-center text-center">
          <Bed size={28} className="text-slate-300" strokeWidth={1.5} />

          <p className="mt-4 max-w-[180px] text-xs leading-5 text-slate-400">
            No one has requested to connect with you
          </p>
        </div>
      </div>
    </div>
  );
}
