"use client";

import { Loader2, Sparkles } from "lucide-react";

export default function FullPageLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-[#f8fafc] via-white to-[#eef2ff]">
      <div className="flex flex-col items-center text-center space-y-6">
        
        {/* Logo / Brand Mark */}
        <div className="relative">
          <div className="h-14 w-14 rounded-2xl bg-[#050a30] flex items-center justify-center shadow-lg">
            <Sparkles className="h-6 w-6 text-white" />
          </div>

          {/* subtle pulse ring */}
          <span className="absolute inset-0 rounded-2xl animate-ping bg-[#050a30]/20" />
        </div>

        {/* App Name */}
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-[#050a30]">
            Your Platform
          </h1>

          <p className="text-sm text-gray-500">
            Initializing dashboard experience
          </p>
        </div>

        {/* Loader */}
        <div className="flex items-center gap-2 text-[#4338ca]">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm font-medium">
            Loading resources...
          </span>
        </div>

        {/* Skeleton shimmer line */}
        <div className="mt-4 w-52 h-1 rounded-full bg-gray-100 overflow-hidden relative">
          <div className="absolute inset-0 -translate-x-full animate-[loading_1.2s_infinite] bg-gradient-to-r from-transparent via-[#4338ca]/30 to-transparent" />
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