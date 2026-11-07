"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Building2, MapPin, Sparkles } from "lucide-react";
import { toast } from "sonner";
import ConnectModal from "@/components/modals/connect-modal";
import VerificationBadge from "@/components/ui/VerificationBadge";

interface Business {
  id: string;
  name: string;
  image: string | null;
  verificationStatus: string;
  type: string;
  location: string | null;
  description: string;
  connectedCount: number;
}

async function loadTopBusinesses(): Promise<Business[]> {
  const res = await fetch("/api/investor/top-businesses");
  const json = await res.json();
  if (!res.ok || !json.success || !Array.isArray(json.data)) {
    throw new Error(json.message || "Failed to fetch businesses");
  }
  return json.data;
}

export default function TopBusinesses() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

  useEffect(() => {
    let active = true;
    loadTopBusinesses()
      .then((data) => {
        if (active) setBusinesses(data);
      })
      .catch((error) => {
        console.error("Failed to fetch top businesses:", error);
        toast.error("Couldn't load suggested businesses.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleConnectSuccess = (message: string) => {
    toast.success(message);
    if (selectedBusiness) {
      setBusinesses((current) => current.filter((business) => business.id !== selectedBusiness.id));
      setSelectedBusiness(null);
      loadTopBusinesses()
        .then(setBusinesses)
        .catch((error) => {
          console.error("Failed to refresh top businesses:", error);
          toast.error("Couldn't refresh suggested businesses.");
        });
    }
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3.5 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
          <Building2 size={16} />
        </div>
        <h3 className="text-sm font-bold tracking-tight text-gray-900">Top Businesses</h3>
      </div>

      <div className="space-y-5">
        {loading ? (
          <div className="space-y-3" aria-label="Loading businesses">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-14 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : businesses.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/70 p-4 text-center">
            <Sparkles className="mx-auto mb-2 h-5 w-5 text-blue-600" />
            <p className="text-xs font-semibold text-gray-800">No businesses to connect with yet</p>
            <p className="mt-1 text-[11px] text-gray-500">
              Businesses you have a connection request with are excluded.
            </p>
          </div>
        ) : (
          businesses.map((business) => (
            <div key={business.id} className="flex items-center gap-3 py-1">
              <Link href={`/profile/${business.id}`} className="shrink-0">
                <div className="relative h-11 w-11 overflow-hidden rounded-lg border border-gray-200 bg-blue-50">
                  {business.image ? (
                    <Image src={business.image} alt={business.name} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-bold text-blue-700">
                      {business.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </Link>

              <div className="min-w-0 flex-1">
                <Link
                  href={`/profile/${business.id}`}
                  className="flex items-center gap-1 truncate text-xs font-bold text-gray-900 hover:text-blue-600 hover:underline"
                >
                  <span className="truncate">{business.name}</span>
                  <VerificationBadge status={business.verificationStatus} size="xs" />
                </Link>
                <p className="mt-0.5 truncate text-[11px] text-gray-500">{business.type}</p>
                {business.location && (
                  <p className="mt-0.5 flex items-center gap-1 truncate text-[10px] text-gray-500">
                    <MapPin size={11} className="shrink-0" />
                    {business.location}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedBusiness(business)}
                className="shrink-0 rounded-full border border-gray-300 px-2.5 py-1 text-[11px] font-medium text-gray-700 transition hover:border-gray-900 hover:bg-gray-100"
              >
                Connect
              </button>
            </div>
          ))
        )}
      </div>

      {selectedBusiness && (
        <ConnectModal
          receiverId={selectedBusiness.id}
          companyName={selectedBusiness.name}
          onClose={() => setSelectedBusiness(null)}
          onSuccess={handleConnectSuccess}
        />
      )}
    </section>
  );
}
