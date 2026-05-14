"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import EditProfileModal from "../modals/edit-profile-modal";

export default function ProfileCard({ profile, refreshProfile }: any) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  return (
    <>
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex flex-col items-center text-center">
          {/* Avatar */}
          <div
            className="
              flex h-20 w-20 items-center justify-center overflow-hidden
              rounded-full bg-[#EEF0FF] border border-slate-100
              text-3xl font-bold text-[#5667ff]
            "
          >
            {profile.logoUrl ? (
              <img src={profile.logoUrl} alt="Logo" className="h-full w-full object-cover" />
            ) : (
              profile.companyName.charAt(0).toUpperCase()
            )}
          </div>

          {/* Name */}
          <h2 className="mt-3 text-lg font-semibold">
            {profile.companyName}
          </h2>

          {/* Subtitle */}
          <p className="mt-1 text-xs text-slate-400">
            {profile.type} {profile.isBoosted ? "(Boosted)" : ""}
          </p>

          {/* Connections & Followers */}
          <div className="mt-2 flex gap-3 text-[11px] font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
            <span><strong className="text-slate-800">{profile.followersCount}</strong> Followers</span>
            <span className="w-px h-3 bg-slate-300 self-center"></span>
            <span><strong className="text-slate-800">{profile.connectionsCount}</strong> Connections</span>
          </div>

          {/* Description */}
          <p className="mt-3 text-xs leading-5 text-slate-500 line-clamp-3 px-2">
            {profile.description}
          </p>

          {/* Edit Button */}
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="
              ml-auto mt-4 rounded-full p-1.5
              shadow-sm transition hover:bg-slate-100 text-slate-500
            "
          >
            <Pencil size={14} />
          </button>
        </div>
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