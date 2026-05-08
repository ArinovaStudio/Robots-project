import TopSearches from "./top-searches";
import TopTags from "./top-tags";

export default function RightSidebar() {
  return (
    <aside className="space-y-6">
      <TopSearches />
      <TopTags />
    </aside>
  );
}