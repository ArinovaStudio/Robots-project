"use client";

import { useCallback, useEffect, useRef, useState } from "react";
export function useNewConnectionPosts(enabled: boolean, intervalMs = 30_000) {
  const [count, setCount] = useState(0);
  const sinceRef = useRef<string | null>(null);

  const poll = useCallback(async () => {
    try {
      const url = sinceRef.current
        ? `/api/user/feed/new-posts?since=${encodeURIComponent(sinceRef.current)}`
        : "/api/user/feed/new-posts";
      const res = await fetch(url, { cache: "no-store" });
      const json = await res.json();
      if (!json.success) return;

      if (!sinceRef.current) {
        sinceRef.current = json.serverTime;
        setCount(0);
        return;
      }
      setCount(json.count);
    } catch {
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    poll();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") poll();
    }, intervalMs);
    const onVisible = () => {
      if (document.visibilityState === "visible") poll();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled, intervalMs, poll]);

  const reset = useCallback(() => {
    sinceRef.current = null;
    setCount(0);
    poll();
  }, [poll]);

  return { count, reset };
}