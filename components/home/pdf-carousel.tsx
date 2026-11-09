"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Loader2, Maximize2, Minimize2, FileWarning } from "lucide-react";

type PdfDoc = import("pdfjs-dist").PDFDocumentProxy;

const RENDER_WIDTH = 1080; 
const MAX_RENDERED_PAGES = 100; 

export default function PdfCarousel({
  url,
  title,
  className = "",
}: {
  url: string;
  title?: string;
  className?: string;
}) {
  const [doc, setDoc] = useState<PdfDoc | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [ratio, setRatio] = useState(4 / 5); // width / height of page 1
  const [current, setCurrent] = useState(0);
  const [pages, setPages] = useState<Record<number, string>>({});
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [fullscreen, setFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const pageUrls = useRef<Record<number, string>>({});
  const inFlight = useRef<Set<number>>(new Set());
  const touchStartX = useRef<number | null>(null);

  // Load the PDF document (client only; pdfjs touches DOM globals on import).
  useEffect(() => {
    let cancelled = false;
    let loadingTask: import("pdfjs-dist").PDFDocumentLoadingTask | null = null;
    const urls = pageUrls.current;
    const flight = inFlight.current;

    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url
        ).toString();

        loadingTask = pdfjs.getDocument({ url });
        const pdf = await loadingTask.promise;
        if (cancelled) return;

        const first = await pdf.getPage(1);
        const vp = first.getViewport({ scale: 1 });
        if (cancelled) return;

        setRatio(vp.width / vp.height);
        setNumPages(Math.min(pdf.numPages, MAX_RENDERED_PAGES));
        setDoc(pdf);
        setStatus("ready");
      } catch (err) {
        console.error("PDF carousel failed to load:", err);
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      loadingTask?.destroy(); // also tears down the document + worker transport
      Object.values(urls).forEach((u) => URL.revokeObjectURL(u));
      for (const k of Object.keys(urls)) delete urls[Number(k)];
      flight.clear();
    };
  }, [url]);

  const renderPage = useCallback(
    async (index: number) => {
      if (!doc || index < 0 || index >= numPages) return;
      if (pageUrls.current[index] || inFlight.current.has(index)) return;
      inFlight.current.add(index);
      try {
        const page = await doc.getPage(index + 1);
        const base = page.getViewport({ scale: 1 });
        const scale = RENDER_WIDTH / base.width;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        await page.render({ canvas, viewport }).promise;

        const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.9));
        if (!blob) return;
        const objectUrl = URL.createObjectURL(blob);
        pageUrls.current[index] = objectUrl;
        setPages((p) => ({ ...p, [index]: objectUrl }));
      } catch (err) {
        console.error(`Failed to render PDF page ${index + 1}:`, err);
      } finally {
        inFlight.current.delete(index);
      }
    },
    [doc, numPages]
  );

  useEffect(() => {
    if (status !== "ready") return;
    let stale = false;
    void (async () => {
      await renderPage(current);
      if (stale) return;
      await Promise.all([renderPage(current + 1), renderPage(current - 1)]);
    })();
    return () => {
      stale = true;
    };
  }, [current, status, renderPage]);

  const go = useCallback(
    (delta: number) => setCurrent((c) => Math.min(Math.max(c + delta, 0), Math.max(numPages - 1, 0))),
    [numPages]
  );
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(-1);
    }
  };
  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await el.requestFullscreen();
    } catch {
      /* fullscreen not supported — ignore */
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
  };

  if (status === "error") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className={`flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 hover:bg-gray-100 transition-colors ${className}`}
      >
        <FileWarning size={20} className="text-gray-400 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{title || "Document"}</p>
          <p className="text-xs text-gray-500">Couldn&apos;t preview this PDF · Click to open</p>
        </div>
      </a>
    );
  }

  const progress = numPages > 0 ? ((current + 1) / numPages) * 100 : 0;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      aria-roledescription="carousel"
      aria-label={title || "PDF document"}
      className={`group relative select-none overflow-hidden rounded-xl border border-gray-200 bg-gray-900 outline-none ${
        fullscreen ? "flex items-center justify-center rounded-none border-0 bg-black" : ""
      } ${className}`}
    >
      {/* Page stage */}
      <div
        className={fullscreen ? "relative h-full max-h-screen" : "relative w-full"}
        style={
          fullscreen
            ? { aspectRatio: String(ratio), maxWidth: "100vw" }
            : { aspectRatio: String(ratio), maxHeight: 560 }
        }
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {pages[current] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={pages[current]}
            alt={`${title ? title + " — " : ""}page ${current + 1} of ${numPages}`}
            draggable={false}
            className="absolute inset-0 h-full w-full bg-white object-contain"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <Loader2 className="animate-spin text-gray-400" size={28} />
          </div>
        )}

        {/* Prev / Next */}
        {current > 0 && (
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous page"
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/55 p-2 text-white shadow transition hover:bg-black/75 md:opacity-0 md:group-hover:opacity-100"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        {current < numPages - 1 && (
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next page"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/55 p-2 text-white shadow transition hover:bg-black/75 md:opacity-0 md:group-hover:opacity-100"
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>

      {/* Footer bar: progress, counter, actions */}
      <div className={fullscreen ? "absolute inset-x-0 bottom-0" : "relative"}>
        <div className="h-1 w-full bg-white/20">
          <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center justify-between gap-3 bg-gray-900 px-3 py-2 text-white">
          <p className="min-w-0 flex-1 truncate text-xs font-medium text-white/80">{title || "Document"}</p>
          <span className="shrink-0 text-xs font-semibold tabular-nums text-white/80">
            {numPages > 0 ? `${current + 1} / ${numPages}` : "…"}
          </span>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            download
            aria-label="Download PDF"
            className="rounded-full p-1.5 text-white/80 transition hover:bg-white/15 hover:text-white"
          >
            <Download size={16} />
          </a>
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={fullscreen ? "Exit full screen" : "Full screen"}
            className="rounded-full p-1.5 text-white/80 transition hover:bg-white/15 hover:text-white"
          >
            {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
