
import ConnectionRequests from "@/components/home/connection-requests";
import SuggestedProfiles from "@/components/SuggestedProfiles";
import { Lock, Layers, Bookmark, Users } from "lucide-react";
import Link from "next/link";

export default function RightSidebar() {
  return (
    <div className="space-y-4">
      {/* Navigation Options */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-2">
        <ul className="space-y-1">
          <li>
            <Link href="/profile/my-posts" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
              <Layers size={18} className="text-gray-400" />
              My Posts
            </Link>
          </li>
          <li>
            <Link href="/profile/saved-posts" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
              <Bookmark size={18} className="text-gray-400" />
              Saved Posts
            </Link>
          </li>
          <li>
            <Link href="/groups" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
              <Users size={18} className="text-gray-400" />
              Groups
            </Link>
          </li>
        </ul>
      </div>

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