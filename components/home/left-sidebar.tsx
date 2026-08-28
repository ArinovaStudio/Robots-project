"use client";

import { useEffect, useState } from "react";
import MenuCard from "./menu-card";

export default function LeftSidebar() {
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/company/profile");
      const json = await res.json();
      if (json.success) {
        setProfileData(json.data);
      }
    } catch {
      console.error("Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Placeholder for menu skeleton or empty space */}
      </div>
    );
  }

  if (!profileData) return null;

  return (
    <div className="space-y-4">
      <MenuCard />
    </div>
  );
}