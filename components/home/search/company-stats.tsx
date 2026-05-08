import {
  BadgeInfo,
  Building2,
  CalendarDays,
  Trophy,
  Users,
} from "lucide-react";

const stats = [
  {
    icon: Users,
    value: "1-100 Employees",
    label: "Company Size",
  },
  {
    icon: BadgeInfo,
    value: "Cyber Security Company",
    label: "Company Type",
  },
  {
    icon: Trophy,
    value: "Level 1",
    label: "Company Level",
  },
  {
    icon: Building2,
    value: "#102",
    label: "Company Rank",
  },
  {
    icon: CalendarDays,
    value: "2025",
    label: "Year of establishment",
  },
];

export default function CompanyStats() {
  return (
    <div className="grid grid-cols-2 gap-6 pt-6 sm:grid-cols-3 lg:grid-cols-5">
      {stats.map(({ icon: Icon, value, label }) => (
        <div key={label} className="flex flex-col items-center text-center">
          <Icon className="mb-2 size-5" />

          <p className="text-xs font-semibold">{value}</p>
          <span className="text-[10px] text-muted-foreground">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}