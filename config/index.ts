import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  BarChart2,
  Settings,
  FileText,
  MessageSquare,
  PackagePlus,
  AlertCircle,
} from "lucide-react";

export const navItems = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Plans", href: "/admin/plans", icon: PackagePlus },
      { label: "Reports", href: "/admin/reports", icon: AlertCircle },
    ],
  },
  // {
  //   title: "Manage",
  //   items: [
  //     { label: "Users", href: "/admin/users", icon: Users },
  //     { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  //     {
  //       label: "Messages",
  //       href: "/admin/messages",
  //       icon: MessageSquare,
  //       badge: 4,
  //     },
  //   ],
  // },
  // {
  //   title: "System",
  //   items: [{ label: "Settings", href: "/admin/settings", icon: Settings }],
  // },
];
