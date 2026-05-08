import AchievementPost from "@/components/home/achievements-post";
import FeedCard from "@/components/home/feed-card";

export default function DashboardPage() {
  return (
    <div className="space-y-5">
      <AchievementPost />
      <FeedCard />
      <FeedCard />
    </div>
  );
}