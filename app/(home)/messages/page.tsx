import { MessageSquarePlus } from "lucide-react";

export default function MessagesPage() {
  return (
    <div className="h-full w-full bg-white rounded-lg border border-gray-200 p-8 flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* Icon Container */}
      <div className="relative mb-6">
        <div className="h-20 w-20 bg-gray-50 rounded-lg flex items-center justify-center relative border border-gray-200">
          <MessageSquarePlus size={32} className="text-gray-400" />
        </div>
      </div>
      
      {/* Text Content */}
      <h3 className="text-xl font-bold text-gray-900 tracking-tight mb-2">
        Your Messages
      </h3>
      <p className="text-gray-500 max-w-sm text-center leading-relaxed text-sm">
        Select a connection from the sidebar to start chatting, or search for a specific partner to pick up where you left off.
      </p>
      
    </div>
  );
}