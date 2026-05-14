"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, AlertTriangle, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary";
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const isDanger = variant === "danger";

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-[24px] bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        
        <div className="flex items-start justify-between gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${isDanger ? 'bg-red-100' : 'bg-blue-100'}`}>
            <AlertTriangle className={`h-6 w-6 ${isDanger ? 'text-red-600' : 'text-blue-600'}`} />
          </div>
          <button onClick={onCancel} disabled={isLoading} className="p-1 text-slate-400 hover:bg-slate-100 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        <div className="mt-4">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">{message}</p>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 rounded-xl bg-white border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition shadow-sm"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 flex justify-center items-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition shadow-sm disabled:opacity-50 ${
              isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-[#5667ff] hover:bg-[#4555e5]'
            }`}
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : confirmText}
          </button>
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}