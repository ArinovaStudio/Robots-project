import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function CompanySearch({ value, onChange, onSearch }: any) {
  return (
    <div className="flex items-center gap-3">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSearch()}
        placeholder="Search for Company Name, Topics, Categories..."
        className="h-14 rounded-full border-none bg-white px-6 text-sm shadow-none focus-visible:ring-0"
      />
      <Button onClick={onSearch} size="icon" className="size-14 rounded-full bg-black hover:bg-black/90">
        <Search className="size-5" />
      </Button>
    </div>
  );
}