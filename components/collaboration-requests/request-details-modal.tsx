"use client";

import { useEffect, type ReactNode } from "react";
import { ExternalLink, X } from "lucide-react";

export interface DetailSection {
  label: string;
  value?: string | null;
  chips?: string[];
  href?: string;
  hrefLabel?: string;
}

interface RequestDetailsModalProps {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  sections: DetailSection[];
  actions?: ReactNode;
  onClose: () => void;
}

export default function RequestDetailsModal({
  title,
  subtitle,
  badge,
  sections,
  actions,
  onClose,
}: RequestDetailsModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const visible = sections.filter((s) => s.value?.trim() || s.chips?.length || s.href);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 p-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-gray-900 truncate">{title}</h2>
              {badge}
            </div>
            {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {visible.map((s) => (
            <div key={s.label} className="space-y-1.5">
              <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{s.label}</span>
              {s.value?.trim() && (
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">{s.value}</p>
              )}
              {s.chips && s.chips.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {s.chips.map((c) => (
                    <span key={c} className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                      {c}
                    </span>
                  ))}
                </div>
              )}
              {s.href && (
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:underline"
                >
                  {s.hrefLabel || "Open"} <ExternalLink size={13} />
                </a>
              )}
            </div>
          ))}
        </div>
        
        {actions && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 p-4">{actions}</div>
        )}
      </div>
    </div>
  );
}
