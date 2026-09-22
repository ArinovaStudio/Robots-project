"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, X, FileText, Expand } from "lucide-react";

/* ─── LinkedIn-style image grid layouts ───
 *  1 image  → full width
 *  2 images → side by side 50/50
 *  3 images → 1 large left + 2 stacked right
 *  4 images → 2x2 grid
 *  5+       → 2x2 grid with "+N more" overlay on last cell
 */

function ImageGrid({ images, onOpen }: { images: any[]; onOpen: (i: number) => void }) {
  const count = images.length;
  const show = Math.min(count, 4); // max 4 cells
  const extra = count - 4;

  const cell = (img: any, idx: number, className = "", overlay = false) => (
    <button
      key={idx}
      onClick={() => onOpen(idx)}
      className={`relative overflow-hidden bg-gray-100 focus:outline-none group ${className}`}
    >
      <img
        src={img.url}
        alt={`Post image ${idx + 1}`}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      {overlay && extra > 0 && (
        <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
          <span className="text-white text-2xl font-extrabold tracking-tight">+{extra}</span>
        </div>
      )}
    </button>
  );

  if (show === 1) {
    return (
      <div className="w-full max-h-[520px] overflow-hidden rounded-xl">
        {cell(images[0], 0, "w-full h-full max-h-[520px] block")}
      </div>
    );
  }

  if (show === 2) {
    return (
      <div className="grid grid-cols-2 gap-0.5 rounded-xl overflow-hidden h-[320px]">
        {images.slice(0, 2).map((img, i) => cell(img, i, "h-full"))}
      </div>
    );
  }

  if (show === 3) {
    return (
      <div className="grid grid-cols-2 gap-0.5 rounded-xl overflow-hidden h-[360px]">
        {cell(images[0], 0, "row-span-2 h-full")}
        {cell(images[1], 1, "h-full")}
        {cell(images[2], 2, "h-full", count > 3)}
      </div>
    );
  }

  // 4+ images → 2×2
  return (
    <div className="grid grid-cols-2 gap-0.5 rounded-xl overflow-hidden h-[360px]">
      {images.slice(0, 4).map((img, i) =>
        cell(img, i, "h-full", i === 3 && extra > 0)
      )}
    </div>
  );
}

/* ─── Fullscreen lightbox ─── */
function Lightbox({ media, startIndex, onClose }: { media: any[]; startIndex: number; onClose: () => void }) {
  const [current, setCurrent] = useState(startIndex);
  const item = media[current];

  const prev = () => setCurrent((c) => (c === 0 ? media.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === media.length - 1 ? 0 : c + 1));

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition"
      >
        <X size={20} />
      </button>

      {/* Counter */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium">
        {current + 1} / {media.length}
      </div>

      {media.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/25 transition"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/25 transition"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      <div
        className="relative max-w-5xl max-h-[90vh] w-full flex items-center justify-center px-16"
        onClick={(e) => e.stopPropagation()}
      >
        {item.type === "IMAGE" && (
          <img
            src={item.url}
            alt={`Image ${current + 1}`}
            className="max-h-[85vh] max-w-full object-contain rounded-lg shadow-2xl"
          />
        )}
        {item.type === "VIDEO" && (
          <video
            src={item.url}
            controls
            autoPlay
            className="max-h-[85vh] max-w-full rounded-lg shadow-2xl"
          />
        )}
      </div>

      {/* Thumbnail strip */}
      {media.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {media.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
              className={`h-1.5 rounded-full transition-all ${i === current ? "w-6 bg-white" : "w-1.5 bg-white/40"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main component ─── */
export default function MediaSlider({ media }: { media: any[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!media || media.length === 0) return null;

  const images = media.filter((m) => m.type === "IMAGE");
  const videos = media.filter((m) => m.type === "VIDEO");
  const docs   = media.filter((m) => m.type === "DOCUMENT");

  return (
    <>
      <div className="space-y-2">
        {/* Image grid */}
        {images.length > 0 && (
          <ImageGrid images={images} onOpen={(i) => setLightboxIndex(i)} />
        )}

        {/* Videos */}
        {videos.map((v, i) => (
          <div key={i} className="rounded-xl overflow-hidden bg-black">
            <video src={v.url} controls className="w-full max-h-[400px] object-contain" />
          </div>
        ))}

        {/* Documents */}
        {docs.map((d, i) => (
          <a
            key={i}
            href={d.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 hover:bg-gray-100 transition-colors group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 shrink-0">
              <FileText size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">Document {docs.length > 1 ? i + 1 : ""}</p>
              <p className="text-xs text-gray-500 font-medium">PDF · Click to open</p>
            </div>
            <Expand size={16} className="text-gray-400 group-hover:text-gray-600 transition-colors shrink-0" />
          </a>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          media={images}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}