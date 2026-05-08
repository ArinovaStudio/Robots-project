import { ArrowRight } from "lucide-react";

const searches = [
  "Digital Marketing Company",
  "Cyber Security Company",
  "Photography",
  "SAAS Developer",
  "Website Development company",
  "CyberFort",
  "Outright Creators",
];

export default function TopSearches() {
  return (
    <div className="rounded-3xl bg-background p-5 border">
      <h3 className="text-lg font-semibold">Top Searches</h3>

      <div className="mt-4 space-y-4">
        {searches.map((item) => (
          <button
            key={item}
            className="flex w-full items-center justify-between text-left text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <span>{item}</span>

            <ArrowRight className="size-4 text-blue-500" />
          </button>
        ))}
      </div>
    </div>
  );
}