"use client";

import { useEffect, useState } from "react";
import ProfileCard from "./profile-card";
import StatsCard from "./stats-card";
import MenuCard from "./menu-card";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

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
        <SkeletonTheme baseColor="#f1f5f9" highlightColor="#ffffff">
          <Skeleton height={280} borderRadius={16} />
          <Skeleton height={140} borderRadius={16} />
        </SkeletonTheme>
      </div>
    );
  }

  if (!profileData) return null;

  return (
    <div className="space-y-4">
      <ProfileCard profile={profileData} refreshProfile={fetchProfile} />
      <StatsCard 
        viewers={profileData.profileViewers} 
        impressions={profileData.impressions} 
      />
      <MenuCard />
    </div>
  );
}