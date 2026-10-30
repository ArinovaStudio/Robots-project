"use client";

import { Loader2, Sparkles } from "lucide-react";

export default function FullPageLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#F8F4E8]">
      <div className="flex flex-col items-center text-center space-y-6">

        {/* Logo / Brand Mark */}
        <div className="relative">
          <div className="h-14 w-14 rounded-2xl bg-[#1E3A5F] flex items-center justify-center shadow-md">
            <Sparkles className="h-6 w-6 text-white" />
          </div>

          {/* subtle pulse ring */}
          <span className="absolute inset-0 rounded-2xl animate-ping bg-[#1E3A5F]/15" />
        </div>

        {/* App Name */}
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-[#172033]">
            Connecto
          </h1>

          <p className="text-sm text-[#64748B]">
            Initializing dashboard experience
          </p>
        </div>

        {/* Loader */}
        <div className="flex items-center gap-2 text-[#2563EB]">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm font-medium">
            Loading resources...
          </span>
        </div>

        {/* Skeleton shimmer line */}
        <div className="mt-4 w-52 h-1 rounded-full bg-[#E5E7EB] overflow-hidden relative">
          <div className="absolute inset-0 -translate-x-full animate-[loading_1.2s_infinite] bg-[#2563EB]/40" />
        </div>

        {/* subtle footer */}
        <p className="text-[11px] text-gray-400 mt-4">
          Secure session • Encrypted connection • Syncing data
        </p>
      </div>

      {/* animation keyframes */}
      <style jsx>{`
        @keyframes loading {
          100% {
            transform: translateX(200%);
          }
        }
      `}</style>
    </div>
  );
}