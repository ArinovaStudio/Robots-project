import ConnectionRequests from "@/components/home/connection-requests";
import SuggestedProfiles from "@/components/SuggestedProfiles";
import { Lock } from "lucide-react";

export default function RightSidebar() {
  return (
    <div className="space-y-4">
      <SuggestedProfiles />

      <div className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col items-center justify-center text-center shadow-sm mt-4">
        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3 text-gray-400">
          <Lock size={20} />
        </div>
        <h4 className="text-sm font-semibold text-gray-900">
          Top Investors for you
        </h4>
        <span className="mt-2 text-[11px] text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded">
          Coming soon
        </span>
      </div>

       <ConnectionRequests />
    </div>
  );
}