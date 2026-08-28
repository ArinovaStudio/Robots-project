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
        className="h-12 rounded-lg border border-gray-200 bg-white px-4 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500"
      />
      <Button onClick={onSearch} size="icon" className="h-12 w-12 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shrink-0">
        <Search className="h-5 w-5" />
      </Button>
    </div>
  );
}