"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, FileText, Download } from "lucide-react";

export default function MediaSlider({ media }: { media: any[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!media || media.length === 0) return null;

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
  };

  const currentMedia = media[currentIndex];

  return (
    <div className="mt-4 relative group rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
      {/* Media Display Area */}
      <div className="relative w-full h-[300px] sm:h-[400px] flex items-center justify-center">
        {currentMedia.type === "IMAGE" && (
          <img 
            src={currentMedia.url} 
            alt="Post media" 
            className="w-full h-full object-contain bg-black/5" 
          />
        )}
        
        {currentMedia.type === "VIDEO" && (
          <video 
            src={currentMedia.url} 
            controls 
            className="w-full h-full object-contain bg-black/5" 
          />
        )}
        
       {currentMedia.type === "DOCUMENT" && (
          <iframe 
            src={`${currentMedia.url}#toolbar=0&navpanes=0&scrollbar=0`} 
            title="PDF Preview"
            className="w-full h-full border-none bg-white"
          />
        )}
      </div>

      {media.length > 1 && (
        <>
          <button 
            onClick={prevSlide}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 text-slate-800 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={nextSlide}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 text-slate-800 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
          >
            <ChevronRight size={20} />
          </button>

          {/* Dots indicator */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {media.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1.5 rounded-full transition-all ${idx === currentIndex ? "w-4 bg-[#5667ff]" : "w-1.5 bg-slate-300/80"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}