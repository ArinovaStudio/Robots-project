import { Boxes, Network, Sparkles, MessageSquare, Search, Home, Bell, User } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const search = formData.get("search");
    if (search) {
      router.push(`/search?search=${encodeURIComponent(search.toString())}`);
    }
  };

  return (
    <div className="sticky top-0 z-50 border-b bg-white">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5">
        
        {/* Left: Logo & Search */}
        <div className="flex items-center gap-4">
          <Link href="/feed" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <span className="text-xl font-bold text-gray-900 hidden sm:block">Connecto</span>
          </Link>
          
          <form onSubmit={handleSearch} className="hidden md:flex relative ml-2">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              name="search"
              className="block w-[240px] lg:w-[300px] pl-10 pr-3 py-2 border border-transparent rounded-md leading-5 bg-[#EEF3F8] placeholder-gray-500 focus:outline-none focus:bg-white focus:border-gray-300 focus:ring-1 focus:ring-blue-500 sm:text-sm transition-colors"
              placeholder="Search for people, companies, posts..."
            />
          </form>
        </div>

        {/* Right: Navigation */}
        <div className="flex items-center h-full gap-2 sm:gap-6">
          <NavItem
            href="/feed"
            icon={<Home size={22} />}
            label="Home"
            isActive={pathname === "/feed"}
          />

          <NavItem
            href="/network"
            icon={<Network size={22} />}
            label="Network"
            isActive={pathname === "/network"}
          />

          <NavItem
            href="/messages"
            icon={<MessageSquare size={22} />}
            label="Messaging"
            isActive={pathname?.startsWith("/messages")}
          />
          
          <NavItem
            href="/notifications"
            icon={<Bell size={22} />}
            label="Notifications"
            isActive={pathname === "/notifications"}
            badge={3}
          />

          <div className="hidden sm:flex h-full items-center ml-2 border-l pl-6 border-gray-200">
            <Link href="/profile" className="flex flex-col items-center gap-1">
              <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-200">
                <Image
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                  alt="User Profile"
                  width={28}
                  height={28}
                  className="object-cover"
                />
              </div>
              <span className="text-[11px] font-medium text-gray-500 flex items-center">
                Me <span className="ml-0.5 text-[8px]">▼</span>
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavItem({
  icon,
  label,
  href,
  isActive,
  badge
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  isActive: boolean;
  badge?: number;
}) {
  return (
    <Link 
      href={href}
      className={`relative flex h-full flex-col items-center justify-center gap-1 transition-colors min-w-[60px] ${
        isActive ? "text-gray-900 border-b-2 border-gray-900" : "text-gray-500 hover:text-gray-900"
      }`}
    >
      <div className="relative">
        {icon}
        {badge && (
          <span className="absolute -top-1 -right-2 flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white border border-white">
            {badge}
          </span>
        )}
      </div>
      <span className="hidden md:block text-[11px] font-medium">
        {label}
      </span>
    </Link>
  );
}