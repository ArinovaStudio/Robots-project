"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeftRight, Landmark } from "lucide-react";
import { useUserStore } from "@/store/AuthStore";
import BusinessRequestsPanel from "@/components/collaboration-requests/business-requests-panel";
import InvestorRequestsPanel from "@/components/collaboration-requests/investor-requests-panel";

type Division = "business" | "investor";

export default function CollaborationRequestsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useUserStore((s) => s.user);

  const [division, setDivision] = useState<Division>(
    searchParams.get("tab") === "investor" ? "investor" : "business"
  );
  const [businessPending, setBusinessPending] = useState(0);
  const [investorPending, setInvestorPending] = useState(0);
  useEffect(() => {
    if (user?.accountType === "INVESTOR") router.replace("/investors/requests");
  }, [user?.accountType, router]);

  const switchDivision = (next: Division) => {
    setDivision(next);
    router.replace(`/collaboration-requests?tab=${next}`, { scroll: false });
  };

  const onBusinessPending = useCallback((n: number) => setBusinessPending(n), []);
  const onInvestorPending = useCallback((n: number) => setInvestorPending(n), []);

  if (user?.accountType === "INVESTOR") return null;

  const tabs: { key: Division; label: string; icon: typeof Landmark; pending: number }[] = [
    { key: "business", label: "Business", icon: ArrowLeftRight, pending: businessPending },
    { key: "investor", label: "Investor", icon: Landmark, pending: investorPending },
  ];

  return (
    <div className="space-y-6 pb-20">
      <h1 className="sr-only">Collaboration Requests</h1>

      {/* Division navbar */}
      <div className="bg-white rounded-xl border border-gray-200 p-1 shadow-xs flex items-center" role="tablist">
        {tabs.map(({ key, label, icon: Icon, pending }) => {
          const active = division === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => switchDivision(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                active ? "bg-blue-50 text-blue-700 shadow-xs" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
              {pending > 0 && (
                <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                  {pending}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Both panels stay mounted so each tab's pending count is known up front */}
      <div className={division === "business" ? "" : "hidden"} role="tabpanel">
        <BusinessRequestsPanel onPendingCountChange={onBusinessPending} />
      </div>
      <div className={division === "investor" ? "" : "hidden"} role="tabpanel">
        <InvestorRequestsPanel onPendingCountChange={onInvestorPending} />
      </div>
    </div>
  );
}
