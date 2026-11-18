"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, MoreVertical, MapPin, Handshake, UserPlus, UserCheck, UserMinus, Clock, MessageCircle, Trash2, Ban, Flag, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import VerificationBadge from "@/components/ui/VerificationBadge";
import ConnectModal from "@/components/modals/connect-modal";
import ReportInvestorModal from "@/components/modals/report-investor-modal";
import ConfirmModal from "@/components/modals/confirm-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import InvestorCollaborationModal from "@/components/modals/investor-collaboration-modal";
import { INVESTMENT_RANGES, INVESTMENT_STAGES, INVESTOR_TYPES } from "@/lib/investor-options";

type ConnectionStatus = "NONE" | "PENDING" | "INCOMING" | "CONNECTED";

interface InvestorCard {
  id: string;
  name: string;
  image: string | null;
  verified: boolean;
  investorType: string;
  location: string | null;
  sectors: string[];
  stages: string[];
  investmentRange: string;
  bio: string | null;
  portfolioCount: number;
  connections: number;
  matchScore: number | null;
  connectionStatus: ConnectionStatus;
  connectionId: string | null;
}

const selectCls =
  "h-9 rounded-lg border border-[#E5E7EB] bg-white px-3 text-xs text-[#172033] focus:outline-none focus:border-[#2563EB]";


function scoreStyle(score: number) {
  if (score < 40) return "bg-red-50 text-red-700 border-red-200";
  if (score < 70) return "bg-yellow-50 text-yellow-700 border-yellow-200";
  return "bg-green-50 text-green-700 border-green-200";
}

function BioText({ bio }: { bio: string | null }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || expanded) return;
    setOverflowing(el.scrollHeight > el.clientHeight + 1);
  }, [bio, expanded]);

  if (!bio) {
    return (
      <div className="rounded-lg bg-[#F1F5F9] px-3 py-2 text-xs leading-5 text-[#64748B]">
        This investor hasn't added a bio yet.
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-[#F1F5F9] px-3 py-2 text-xs leading-5 text-[#334155]">
      <p ref={ref} className={`whitespace-pre-line break-words ${expanded ? "" : "line-clamp-1"}`}>{bio}</p>
      {(overflowing || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-0.5 font-semibold text-[#2563EB] hover:underline"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

export default function InvestorDirectory() {
  const [investors, setInvestors] = useState<InvestorCard[]>([]);
  const [sectorOptions, setSectorOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoreReason, setScoreReason] = useState<string | null>(null);
  const [stage, setStage] = useState("");
  const [type, setType] = useState("");
  const [sector, setSector] = useState("");
  const [range, setRange] = useState("");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [connectTarget, setConnectTarget] = useState<InvestorCard | null>(null);
  const [partnershipTarget, setPartnershipTarget] = useState<InvestorCard | null>(null);
  const [reportTarget, setReportTarget] = useState<InvestorCard | null>(null);
  const [confirm, setConfirm] = useState<{ kind: "block" | "disconnect"; investor: InvestorCard } | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSearch(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (stage) params.set("stage", stage);
    if (type) params.set("type", type);
    if (sector) params.set("sector", sector);
    if (range) params.set("range", range);
    if (search) params.set("q", search);

    setLoading(true);
    fetch(`/api/investor/directory?${params}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) return;
        setInvestors(json.data);
        setScoreReason(json.meta?.reason ?? null);
        // build the sector dropdown from the unfiltered list only
        if (!stage && !type && !sector && !range && !search) {
          setSectorOptions(Array.from(new Set<string>(json.data.flatMap((i: InvestorCard) => i.sectors))).sort());
        }
      })
      .catch(() => {})
      .finally(() => !controller.signal.aborted && setLoading(false));
    return () => controller.abort();
  }, [stage, type, sector, range, search]);

  const visible = useMemo(() => investors.filter((i) => !hidden.has(i.id)), [investors, hidden]);
  const hide = (id: string) => setHidden((prev) => new Set(prev).add(id));
  const unhide = (id: string) =>
    setHidden((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  const patchInvestor = (id: string, patch: Partial<InvestorCard>) =>
    setInvestors((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const callApi = async (url: string, init: RequestInit) => {
    try {
      const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...init });
      const data = await res.json();
      return { ok: !!data.success, message: data.message as string | undefined };
    } catch {
      return { ok: false, message: "An error occurred. Please try again." };
    }
  };

  // "Delete": remove from this viewer's list (persisted, with undo)
  const handleDelete = async (inv: InvestorCard) => {
    const r = await callApi(`/api/investor/${inv.id}/hide`, { method: "POST" });
    if (!r.ok) return toast.error(r.message || "Couldn't remove this investor");
    hide(inv.id);
    toast.success("Investor removed from your list", {
      action: {
        label: "Undo",
        onClick: async () => {
          const u = await callApi(`/api/investor/${inv.id}/hide`, { method: "DELETE" });
          if (u.ok) unhide(inv.id);
          else toast.error("Couldn't restore this investor");
        },
      },
    });
  };

  const handleCancelRequest = async (inv: InvestorCard) => {
    const r = await callApi("/api/network/connect/remove", { method: "POST", body: JSON.stringify({ targetUserId: inv.id }) });
    if (!r.ok) return toast.error(r.message || "Couldn't cancel the request");
    patchInvestor(inv.id, { connectionStatus: "NONE", connectionId: null });
    toast.success("Connection request cancelled");
  };

  const handleAcceptRequest = async (inv: InvestorCard) => {
    if (!inv.connectionId) return;
    const r = await callApi("/api/network/connect/respond", {
      method: "POST",
      body: JSON.stringify({ connectionId: inv.connectionId, action: "ACCEPTED" }),
    });
    if (!r.ok) return toast.error(r.message || "Couldn't accept the request");
    patchInvestor(inv.id, { connectionStatus: "CONNECTED", connections: inv.connections + 1 });
    toast.success(`You're now connected with ${inv.name}`);
  };

  const handleConfirm = async () => {
    if (!confirm) return;
    const { kind, investor: inv } = confirm;
    setConfirming(true);
    if (kind === "disconnect") {
      const r = await callApi("/api/network/connect/remove", { method: "POST", body: JSON.stringify({ targetUserId: inv.id }) });
      if (r.ok) {
        patchInvestor(inv.id, { connectionStatus: "NONE", connectionId: null, connections: Math.max(0, inv.connections - 1) });
        toast.success("Connection removed");
      } else toast.error(r.message || "Couldn't remove the connection");
    } else {
      const r = await callApi(`/api/investor/${inv.id}/block`, { method: "POST" });
      if (r.ok) {
        hide(inv.id);
        toast.success("Investor blocked", {
          action: {
            label: "Undo",
            onClick: async () => {
              const u = await callApi(`/api/investor/${inv.id}/block`, { method: "DELETE" });
              if (u.ok) unhide(inv.id);
              else toast.error("Couldn't unblock this investor");
            },
          },
        });
      } else toast.error(r.message || "Couldn't block this investor");
    }
    setConfirming(false);
    setConfirm(null);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {[{ label: "All Stages", value: "" }, ...INVESTMENT_STAGES.map((s) => ({ label: s, value: s }))].map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => setStage(s.value)}
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                stage === s.value ? "border-[#2563EB] bg-[#2563EB] text-white" : "border-[#E5E7EB] bg-white text-[#172033] hover:bg-gray-50"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search investors, firms…"
              className={`${selectCls} w-full pl-8`}
            />
          </div>
          <select value={sector} onChange={(e) => setSector(e.target.value)} className={selectCls}>
            <option value="">Sectors of interest</option>
            {sectorOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={type} onChange={(e) => setType(e.target.value)} className={selectCls}>
            <option value="">Investor type</option>
            {INVESTOR_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={range} onChange={(e) => setRange(e.target.value)} className={selectCls}>
            <option value="">Investment range</option>
            {INVESTMENT_RANGES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <p className="text-xs text-[#64748B]">
          Showing <strong>{visible.length}</strong> investors, sorted by match score
        </p>
        {scoreReason && (
          <p className="text-xs text-amber-600">
            {scoreReason === "no-profile"
              ? "Complete your investor or business profile to see match scores."
              : "Log in to see match scores."}
          </p>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-64 rounded-2xl border border-gray-200 bg-white animate-pulse" />)}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500">
          <TrendingUp className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <h3 className="text-base font-bold text-gray-800">No investors found</h3>
          <p className="mt-1 text-xs">Try changing or clearing your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visible.map((inv) => (
            <div key={inv.id} className="rounded-2xl border border-[#E5E7EB] bg-white p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <Link href={`/profile/${inv.id}`} className="flex items-center gap-3 min-w-0 group">
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-gray-100 border border-[#E5E7EB]">
                    {inv.image ? (
                      <Image src={inv.image} alt={inv.name} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-bold text-gray-400">{inv.name.charAt(0)}</div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-sm text-[#172033] truncate group-hover:text-[#2563EB]">{inv.name}</h3>
                      <VerificationBadge status={inv.verified ? "VERIFIED" : "UNVERIFIED"} size="sm" />
                    </div>
                    <p className="flex items-center gap-1 text-xs text-[#64748B] truncate">
                      <MapPin size={11} /> {inv.investorType}{inv.location ? ` · ${inv.location}` : ""}
                    </p>
                  </div>
                </Link>

                <div className="flex items-center gap-1.5 shrink-0">
                  {inv.matchScore !== null && (
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${scoreStyle(inv.matchScore)}`}>
                      {inv.matchScore}% match
                    </span>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100" aria-label="More options">
                      <MoreVertical size={16} />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      {inv.connectionStatus === "CONNECTED" ? (
                        <>
                          <DropdownMenuItem disabled className="gap-2 font-semibold text-emerald-600 opacity-100">
                            <UserCheck size={14} /> Connected
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="gap-2 cursor-pointer">
                            <Link href={`/messages/${inv.id}`}><MessageCircle size={14} /> Message</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setConfirm({ kind: "disconnect", investor: inv })} className="gap-2 cursor-pointer">
                            <UserMinus size={14} /> Remove connection
                          </DropdownMenuItem>
                        </>
                      ) : inv.connectionStatus === "PENDING" ? (
                        <DropdownMenuItem onSelect={() => handleCancelRequest(inv)} className="gap-2 cursor-pointer">
                          <Clock size={14} /> Request sent · Cancel
                        </DropdownMenuItem>
                      ) : inv.connectionStatus === "INCOMING" ? (
                        <DropdownMenuItem onSelect={() => handleAcceptRequest(inv)} className="gap-2 cursor-pointer">
                          <UserCheck size={14} /> Accept request
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onSelect={() => setConnectTarget(inv)} className="gap-2 cursor-pointer">
                          <UserPlus size={14} /> Connect
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => handleDelete(inv)} className="gap-2 cursor-pointer">
                        <Trash2 size={14} /> Delete
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setConfirm({ kind: "block", investor: inv })} className="gap-2 cursor-pointer">
                        <Ban size={14} /> Block
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setReportTarget(inv)} className="gap-2 cursor-pointer text-red-600 focus:text-red-600">
                        <Flag size={14} /> Report
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-[#64748B]">Sectors</span>
                {inv.sectors.slice(0, 4).map((s) => (
                  <span key={s} className="rounded-full border border-[#E5E7EB] px-2 py-0.5 text-[11px] text-[#172033]">{s}</span>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-[#64748B]">Stages</span>
                {inv.stages.map((s) => (
                  <span key={s} className="rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[11px] text-blue-700">{s}</span>
                ))}
              </div>
              <p className="text-xs text-[#172033]">
                <span className="text-[#64748B]">Investment range </span>
                <strong>{inv.investmentRange}</strong>
              </p>

              <BioText bio={inv.bio} />

              <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#F8FAFC] p-3 text-center">
                <div>
                  <span className="block text-[10px] font-semibold uppercase text-[#64748B]">Portfolio</span>
                  <span className="text-base font-bold text-[#172033]">{inv.portfolioCount}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-semibold uppercase text-[#64748B]">Connections</span>
                  <span className="text-base font-bold text-[#172033]">{inv.connections}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPartnershipTarget(inv)}
                className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition"
              >
                <Handshake size={14} /> Partnership Request
              </button>
            </div>
          ))}
        </div>
      )}

      {partnershipTarget && (
        <InvestorCollaborationModal
          collaboratorId={partnershipTarget.id}
          collaboratorName={partnershipTarget.name}
          onClose={() => setPartnershipTarget(null)}
        />
      )}

      {connectTarget && (
        <ConnectModal
          receiverId={connectTarget.id}
          companyName={connectTarget.name}
          onClose={() => setConnectTarget(null)}
          onSuccess={(msg) => {
            toast.success(msg);
            patchInvestor(connectTarget.id, { connectionStatus: "PENDING" });
            setConnectTarget(null);
          }}
        />
      )}

      {reportTarget && (
        <ReportInvestorModal
          investorUserId={reportTarget.id}
          investorName={reportTarget.name}
          onClose={() => setReportTarget(null)}
        />
      )}

      <ConfirmModal
        isOpen={!!confirm}
        title={confirm?.kind === "block" ? `Block ${confirm.investor.name}?` : `Remove connection with ${confirm?.investor.name}?`}
        message={
          confirm?.kind === "block"
            ? "They'll be hidden from your directory and any connection between you will be removed."
            : "You'll no longer be connected. You can send a new request later."
        }
        confirmText={confirm?.kind === "block" ? "Block" : "Remove"}
        cancelText="Cancel"
        variant="danger"
        isLoading={confirming}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}