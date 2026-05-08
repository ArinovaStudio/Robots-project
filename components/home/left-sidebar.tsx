import ProfileCard from "./profile-card";
import StatsCard from "./stats-card";
import MenuCard from "./menu-card";

export default function LeftSidebar() {
  return (
    <div className="space-y-4">
      <ProfileCard />

      <StatsCard />

      <MenuCard />
    </div>
  );
}