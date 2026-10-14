import {
  LayoutDashboard,
  Users,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

export const navItems = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Verification Requests", href: "/admin/verifications", icon: ShieldCheck },
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Reports", href: "/admin/reports", icon: AlertCircle },
    ],
  },
];
