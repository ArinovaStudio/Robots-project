"use client";

import { useEffect, useState } from "react";
import TopSearches from "./top-searches";
import TopTags from "./top-tags";

export default function RightSidebar() {
  const [data, setData] = useState({ topSearches: [], topTags: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch("/api/search/analytics?filter=monthly&limit=7");
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch analytics");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <aside className="space-y-6">
      <TopSearches searches={data.topSearches} loading={loading} />
      <TopTags tags={data.topTags} loading={loading} />
    </aside>
  );
}