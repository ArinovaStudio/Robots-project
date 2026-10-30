"use client";

import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface ErrorScreenProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export default function ErrorScreen({
  title = "Something went wrong",
  message = "We couldn’t load this page. Please try again.",
  onRetry,
}: ErrorScreenProps) {
  const router = useRouter();

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#F8F4E8] p-6">
      <div className="max-w-md w-full text-center space-y-6">
        
        {/* Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 border border-red-200">
          <AlertTriangle className="h-7 w-7 text-red-600" />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[#172033]">
            {title}
          </h1>

          <p className="text-sm text-[#64748B] leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          
          {onRetry && (
            <Button
              onClick={onRetry}
              className="rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white shadow-xs"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          )}

          <Button
            variant="outline"
            className="rounded-xl border-[#E5E7EB] bg-white text-[#172033] hover:bg-gray-50"
            onClick={() => router.push("/")}
          >
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Button>
        </div>

        {/* subtle footer */}
        <p className="text-xs text-gray-400 pt-4">
          If the issue persists, contact support or refresh the session.
        </p>
      </div>
    </div>
  );
}