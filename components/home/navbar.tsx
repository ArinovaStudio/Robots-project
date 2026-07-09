import { Boxes, Network, Sparkles, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function Navbar() {
  return (
    <div className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-5">
        <h1 className="text-3xl font-black tracking-tight">
          LOGO
        </h1>

        <div className="flex items-center gap-8">
          <NavItem
            href="/categories"
            icon={<Sparkles size={16} />}
            label="Categories"
          />

          <NavItem
            href="/expand"
            icon={<Network size={16} />}
            label="Expand Business"
          />

          <NavItem
            href="/explore"
            icon={<Boxes size={16} />}
            label="Explore Services"
          />

          <NavItem
            href="/messages"
            icon={<MessageSquare size={16} />}
            label="Messages"
          />
        </div>
      </div>
    </div>
  );
}

function NavItem({
  icon,
  label,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
}) {
  return (
    <Link 
      href={href}
      className="flex cursor-pointer flex-col items-center gap-0.5 text-slate-500 transition hover:text-black"
    >
      {icon}
      <span className="text-[11px] font-medium">
        {label}
      </span>
    </Link>
  );
}