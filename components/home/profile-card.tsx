"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import EditProfileModal from "../modals/edit-profile-modal";
import Link from "next/link";

export default function ProfileCard({ profile, refreshProfile }: any) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  return (
    <>
      <div className="rounded-xl bg-white shadow-sm border border-gray-200 overflow-hidden relative">
        {/* Cover Image */}
        <div className="h-16 w-full bg-gradient-to-r from-blue-600 to-blue-400"></div>

        <div className="px-4 pb-4 flex flex-col items-center text-center -mt-8 relative">
          {/* Avatar */}
           <Link href={`/profile`} className="block">
            <div
              className="
                flex h-16 w-16 items-center justify-center overflow-hidden
                rounded-full bg-white border-2 border-white shadow-sm
                text-2xl font-bold text-blue-600
              "
            >
              {profile.logoUrl ? (
                <img src={profile.logoUrl} alt="Logo" className="h-full w-full object-cover" />
              ) : (
                profile.companyName.charAt(0).toUpperCase()
              )}
            </div>
          </Link>

          {/* Name */}
          <h2 className="mt-3 text-base font-semibold text-gray-900 hover:underline cursor-pointer">
            {profile.companyName} {profile.isBoosted && "⭐"}
          </h2>

          {/* Subtitle */}
          <p className="mt-1 text-xs text-gray-500">
            {profile.type}
          </p>

          {/* Description */}
          <p className="mt-3 text-xs leading-5 text-gray-500 line-clamp-2">
            {profile.description}
          </p>
        </div>

        {/* Stats */}
        <div className="border-t border-gray-100 py-3 flex flex-col px-4 hover:bg-gray-50 cursor-pointer transition-colors">
          <div className="flex justify-between items-center text-xs font-medium text-gray-500">
            <span>Followers</span>
            <span className="text-blue-600 font-semibold">{profile.followersCount}</span>
          </div>
          <div className="flex justify-between items-center text-xs font-medium text-gray-500 mt-1">
            <span>Connections</span>
            <span className="text-blue-600 font-semibold">{profile.connectionsCount}</span>
          </div>
        </div>

        {/* Edit Button */}
        <button
          onClick={() => setIsEditModalOpen(true)}
          className="
            absolute top-3 right-3 rounded-full p-1.5
            bg-white/20 hover:bg-white/40 transition text-white backdrop-blur-sm
          "
        >
          <Pencil size={14} />
        </button>
      </div>

      {isEditModalOpen && (
        <EditProfileModal 
          profile={profile} 
          onClose={() => setIsEditModalOpen(false)} 
          onSuccess={() => {
            setIsEditModalOpen(false);
            refreshProfile(); 
          }}
        />
      )}
    </>
  );
}