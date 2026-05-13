import { BadgeInfo, Building2, CalendarDays, UserPlus, Users } from "lucide-react";

export default function CompanyStats({ size, type, followers, connections, year }: any) {
  const stats = [
    { icon: Users, value: `${size} Employees`, label: "Company Size" },
    { icon: BadgeInfo, value: type, label: "Company Type" },
    { icon: UserPlus, value: followers, label: "Followers" },
    { icon: Building2, value: connections, label: "Connections" }, 
    { icon: CalendarDays, value: year || "N/A", label: "Est. Year" },
  ];

  return (
    <div className="grid grid-cols-2 gap-6 pt-6 sm:grid-cols-3 lg:grid-cols-5 border-t border-slate-100 mt-5">
      {stats.map(({ icon: Icon, value, label }) => (
        <div key={label} className="flex flex-col items-center text-center">
          <Icon className="mb-2 size-5 text-slate-400" />
          <p className="text-xs font-bold text-slate-800 truncate w-full">{value}</p>
          <span className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}