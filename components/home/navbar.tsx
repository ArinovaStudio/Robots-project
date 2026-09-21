import { Boxes, Network, Sparkles, MessageSquare, Search, Home, Bell, User, Loader2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { signOut } from "next-auth/react";
import { useUserStore } from "@/store/AuthStore";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUserStore();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLFormElement>(null);

  const { data: countsData } = useSWR(user ? "/api/user/counts" : null, fetcher, {
    refreshInterval: 10000,
    revalidateOnFocus: true,
  });

  const unreadNotifications = countsData?.data?.unreadNotifications || 0;
  const pendingConnections = countsData?.data?.pendingConnections || 0;

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length < 2) {
        setSuggestions([]);
        return;
      }
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(searchQuery)}`);
        const json = await res.json();
        if (json.success) {
          setSuggestions(json.data);
        }
      } catch (error) {
        console.error("Failed to fetch suggestions", error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(() => {
      fetchSuggestions();
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery) {
      setShowSuggestions(false);
      router.push(`/search?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="sticky top-0 z-50 border-b bg-white">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5">
        
        {/* Left: Logo & Search */}
        <div className="flex items-center gap-4">
          <Link href="/explore" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <span className="text-xl font-bold text-gray-900 hidden sm:block">Connecto</span>
          </Link>
          
          <form ref={searchRef} onSubmit={handleSearch} className="hidden md:flex relative ml-2">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              name="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="block w-[240px] lg:w-[320px] pl-10 pr-3 py-2 border border-transparent rounded-md leading-5 bg-[#EEF3F8] placeholder-gray-500 focus:outline-none focus:bg-white focus:border-gray-300 focus:ring-1 focus:ring-blue-500 sm:text-sm transition-colors"
              placeholder="Search for people, companies, posts..."
            />
            {isSearching && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
              </div>
            )}
            
            {showSuggestions && searchQuery.trim().length >= 2 && (
              <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden py-1 z-50">
                {suggestions.length > 0 ? (
                  suggestions.map((suggestion) => (
                    <Link
                      key={suggestion.id}
                      href={suggestion.href}
                      onClick={() => setShowSuggestions(false)}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 shrink-0">
                        {suggestion.image ? (
                          <img src={suggestion.image} alt={suggestion.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-gray-400 text-sm">
                            {suggestion.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium text-gray-900 truncate">{suggestion.name}</p>
                        <p className="text-xs text-gray-500 truncate">{suggestion.subtitle}</p>
                      </div>
                    </Link>
                  ))
                ) : !isSearching ? (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">
                    No results found for "{searchQuery}"
                  </div>
                ) : null}
                <div 
                  className="px-4 py-2 border-t border-gray-100 text-sm font-medium text-blue-600 hover:bg-blue-50 cursor-pointer text-center"
                  onClick={() => {
                    setShowSuggestions(false);
                    router.push(`/search?search=${encodeURIComponent(searchQuery)}`);
                  }}
                >
                  See all results
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Right: Navigation */}
        <div className="flex items-center h-full gap-2 sm:gap-6">
          <NavItem
            href="/explore"
            icon={<Home size={22} />}
            label="Home"
            isActive={pathname === "/explore"}
          />

          <NavItem
            href="/network"
            icon={<Network size={22} />}
            label="Network"
            isActive={pathname === "/network"}
            badge={pendingConnections > 0 ? pendingConnections : undefined}
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
            badge={unreadNotifications > 0 ? unreadNotifications : undefined}
          />

          <div className="hidden sm:flex h-full items-center ml-2 border-l pl-6 border-gray-200">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex flex-col items-center gap-1 focus:outline-none cursor-pointer">
                <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                  {user?.image ? (
                    <Image
                      src={user.image}
                      alt="User Profile"
                      width={28}
                      height={28}
                      className="object-cover h-full w-full"
                    />
                  ) : (
                    <span className="text-xs font-bold text-gray-500">{user?.name?.charAt(0).toUpperCase() || "U"}</span>
                  )}
                </div>
                <span className="text-[11px] font-medium text-gray-500 flex items-center max-w-[60px] truncate">
                  {user?.name || "Me"} <span className="ml-0.5 text-[8px]">▼</span>
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white z-[100]">
                <div className="px-2 py-1.5 text-sm text-gray-500 font-medium truncate">
                  {user?.email}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/profile">View Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50" 
                  onClick={() => signOut({ callbackUrl: "/login" })}
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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