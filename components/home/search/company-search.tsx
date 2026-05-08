import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function CompanySearch() {
  return (
    <div className="flex items-center gap-3">
      <Input
        placeholder="Search for Company Name, Topics, Categories..."
        className="h-14 rounded-full border-none bg-white px-6 text-sm shadow-none focus-visible:ring-0"
      />

      <Button
        size="icon"
        className="size-14 rounded-full bg-black hover:bg-black/90"
      >
        <Search className="size-5" />
      </Button>
    </div>
  );
}