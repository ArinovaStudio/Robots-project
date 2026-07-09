import { MessageSquarePlus } from "lucide-react";

export default function MessagesPage() {
  return (
    <div className="h-full w-full bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-50/50 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Animated Icon Container */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-[#5667ff]/20 rounded-full blur-xl animate-pulse" />
        <div className="h-24 w-24 bg-indigo-50 rounded-full flex items-center justify-center relative border border-indigo-100/50 shadow-sm">
          <MessageSquarePlus size={40} className="text-[#5667ff]" />
        </div>
      </div>
      
      {/* Text Content */}
      <h3 className="text-2xl font-bold text-slate-800 tracking-tight mb-2">
        Your Messages
      </h3>
      <p className="text-slate-500 max-w-sm text-center leading-relaxed text-sm">
        Select a connection from the sidebar to start chatting, or search for a specific partner to pick up where you left off.
      </p>
      
    </div>
  );
}