"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function ContactListSidebar() {
  const pathname = usePathname();
  
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); 
      setContacts([]); 
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchContacts = useCallback(async () => {
    if (loading || (!hasMore && page !== 1)) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/network/connect/connections?page=${page}&limit=15&search=${encodeURIComponent(debouncedSearch)}`);
      const json = await res.json();
      
      if (json.success) {
        if (page === 1) {
          setContacts(json.data);
        } else {
          setContacts((prev) => [...prev, ...json.data]);
        }
        setHasMore(page < json.pagination.totalPages);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50 && hasMore && !loading) {
      setPage((prev) => prev + 1);
    }
  };

  return (
    <div className="flex flex-col h-full p-4 gap-4 bg-transparent">
      
      <div className="p-4 bg-white border border-slate-100 rounded-3xl shadow-sm shrink-0">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Messages</h2>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search connections..." 
            className="w-full bg-slate-100 border-none rounded-xl pl-9 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-[#5667ff]/20 outline-none transition"
          />
        </div>
      </div>

      <div 
        className="flex-1 overflow-y-auto p-2 bg-white border border-slate-100 rounded-3xl shadow-sm"
        onScroll={handleScroll}
      >
        {contacts.map((contact) => {
          const isActive = pathname.includes(contact.userId);
          
          return (
            <Link 
              href={`/messages/${contact.userId}`} 
              key={contact.connectionId}
              className={`flex items-center gap-3 p-3 rounded-xl transition cursor-pointer mb-1 ${
                isActive ? "bg-[#5667ff] text-white shadow-md" : "hover:bg-slate-100 text-slate-700"
              }`}
            >
              {/* Avatar */}
              <div className="size-10 rounded-full bg-white border border-slate-200 overflow-hidden flex-shrink-0 relative flex items-center justify-center font-bold text-sm text-slate-400">
                {contact.logoUrl ? (
                  <Image src={contact.logoUrl} alt="Logo" fill className="object-cover" />
                ) : (
                  contact.companyName?.charAt(0) || "?"
                )}
              </div>
              
              {/* Info */}
              <div className="overflow-hidden">
                <h3 className={`font-semibold text-sm truncate ${isActive ? "text-white" : "text-slate-900"}`}>
                  {contact.companyName || "Unknown User"}
                </h3>
                <p className={`text-xs truncate ${isActive ? "text-indigo-100" : "text-slate-500"}`}>
                  {contact.type || "Connection"}
                </p>
              </div>
            </Link>
          )
        })}

        {loading && (
          <div className="space-y-1 px-1 mt-1">
            <SkeletonTheme baseColor="#f1f5f9" highlightColor="#ffffff">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
                  <Skeleton circle width={40} height={40} />
                  <div className="flex-1">
                    <Skeleton width="70%" height={16} />
                    <Skeleton width="40%" height={12} className="mt-1" />
                  </div>
                </div>
              ))}
            </SkeletonTheme>
          </div>
        )}
        
        {!loading && contacts.length === 0 && (
          <div className="text-center p-6 text-sm text-slate-400 mt-4">
            {search ? "No matches found." : "No connections yet."}
          </div>
        )}
      </div>
    </div>
  );
}