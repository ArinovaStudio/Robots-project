"use client";

import { useState } from "react";
import { FileText, ImageIcon, Video, CalendarDays } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useUserStore } from "@/store/AuthStore";
import CreatePostModal from "@/components/modals/create-post-modal";

export default function AchievementPost() {
  const router = useRouter();
  const { user } = useUserStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [initialMediaType, setInitialMediaType] = useState<"IMAGE" | "VIDEO" | "DOCUMENT" | "EVENT" | null>(null);

  const openModal = (type?: "IMAGE" | "VIDEO" | "DOCUMENT" | "EVENT") => {
    setInitialMediaType(type || null);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm mb-4">
        {/* Input Area */}
        <div className="flex gap-3 mb-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 shrink-0">
            {user?.image ? (
              <Image
                src={user.image}
                alt="Profile"
                width={48}
                height={48}
                className="object-cover h-full w-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold text-lg">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </div>
          
          <div className="flex-1 flex items-center">
            <button 
              onClick={() => openModal()}
              className="w-full text-left rounded-full border border-gray-300 px-5 py-3 text-gray-500 font-medium hover:bg-gray-50 transition-colors"
            >
              Start a post
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-2">
          <div className="flex gap-1 w-full justify-between sm:justify-start sm:gap-2">
            <Action icon={<ImageIcon className="w-5 h-5 text-blue-500" />} label="Media" onClick={() => openModal("IMAGE")} />
            <Action icon={<CalendarDays className="w-5 h-5 text-orange-500" />} label="Event" onClick={() => openModal("EVENT")} />
            <Action icon={<FileText className="w-5 h-5 text-red-500" />} label="Write article" onClick={() => router.push("/post/article")} />
          </div>
        </div>
      </div>

      <CreatePostModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setInitialMediaType(null);
        }} 
        initialType={initialMediaType}
      />
    </>
  );
}

function Action({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      className="
        flex items-center justify-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-md transition-colors text-gray-600 font-medium text-sm
      "
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}