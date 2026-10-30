"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ReadMoreTextProps {
  text: string;
  charLimit?: number;
  title?: string;
  subtitle?: string;
  className?: string;
  buttonClassName?: string;
}

export function ReadMoreText({
  text,
  charLimit = 160,
  title = "Full Description",
  subtitle,
  className = "text-xs text-gray-600 leading-relaxed",
  buttonClassName,
}: ReadMoreTextProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!text) return null;

  const isLong = text.length > charLimit;

  if (!isLong) {
    return <p className={className}>{text}</p>;
  }

  const preview = text.slice(0, charLimit).trimEnd();

  return (
    <>
      <p className={className}>
        <span>{preview}… </span>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(true);
          }}
          className={
            buttonClassName ||
            "inline-flex items-center text-xs font-semibold text-[#2563EB] hover:text-[#1E3A5F] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          }
        >
          Read more
        </button>
      </p>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className="max-w-2xl bg-white p-6 sm:p-7 rounded-2xl border border-[#E5E7EB] text-left"
          showCloseButton={true}
        >
          <DialogHeader className="gap-1">
            <DialogTitle className="text-base font-bold text-[#172033]">
              {title}
            </DialogTitle>
            {subtitle && (
              <DialogDescription className="text-xs text-[#64748B]">
                {subtitle}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="mt-3 max-h-[60vh] overflow-y-auto pr-1 text-xs sm:text-sm leading-relaxed text-[#172033] whitespace-pre-wrap">
            {text}
          </div>

          <DialogFooter className="mt-4 pt-3 border-t border-[#E5E7EB] flex items-center justify-end">
            <DialogClose asChild>
              <Button
                variant="outline"
                className="rounded-xl border-[#E5E7EB] text-xs font-semibold hover:bg-gray-50"
              >
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ReadMoreText;

