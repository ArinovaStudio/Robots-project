
import ConnectionRequests from "@/components/home/connection-requests";
import SuggestedProfiles from "@/components/SuggestedProfiles";
import { Lock } from "lucide-react";

export default function RightSidebar() {
  return (
    <div className="space-y-3">
      <SuggestedProfiles />

      <div className="flex h-[170px] flex-col items-center justify-center rounded-2xl bg-white p-5 text-center shadow-sm">
        <h3 className="text-2xl text-slate-300"><Lock /></h3>
        <h4 className="mt-3 text-lg font-medium text-slate-800">
          Top Investors for you
        </h4>
        <p className="mt-2 text-xs text-slate-400 font-medium bg-slate-50 px-3 py-1 rounded-full">
          Coming soon
        </p>
      </div>

       <ConnectionRequests />
    </div>
  );
}