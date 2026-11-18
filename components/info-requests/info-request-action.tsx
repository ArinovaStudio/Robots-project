"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageSquare, Eye } from "lucide-react";
import InfoRequestDialog from "@/components/info-requests/info-request-dialog";

type RequestType = "INVESTMENT_OFFER" | "PITCH_REQUEST" | "INVESTOR_COLLABORATION" | "BUSINESS_COLLABORATION";
type Role = "asker" | "answerer";
type InfoRequestStatus = "PENDING" | "ANSWERED";

export default function InfoRequestAction({
  requestId,
  requestType,
  className = "inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700",
}: {
  requestId: string;
  requestType: RequestType;
  className?: string;
}) {
  const [status, setStatus] = useState<InfoRequestStatus | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [hasRounds, setHasRounds] = useState(false);
  const [hasAnsweredRounds, setHasAnsweredRounds] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"answer" | "view" | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/info-requests?requestId=${encodeURIComponent(requestId)}&requestType=${requestType}`);
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || "Could not load information request.");
      setStatus(json.data?.status ?? null);
      setRole(json.data?.viewerRole ?? null);
      setHasRounds(Array.isArray(json.rounds) && json.rounds.length > 0);
      setHasAnsweredRounds(Boolean(json.hasAnsweredRounds));
    } catch (error) {
      console.error("Failed to load information request status:", error);
      setStatus(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  }, [requestId, requestType]);

  useEffect(() => { void loadStatus(); }, [loadStatus]);

  if (loading) return null;
  if (!hasRounds || !role || !status) return null;

  const openClass = className;
  return <>
    {role === "answerer" && <>
      <button type="button" onClick={() => setMode(status === "PENDING" ? "answer" : "view")} className={openClass}>
        {status === "PENDING" ? <MessageSquare size={13}/> : <Eye size={13}/>}
        <span>{status === "PENDING" ? "Answer questions" : "View submitted answers"}</span>
      </button>
      {status === "PENDING" && hasAnsweredRounds && <button type="button" onClick={() => setMode("view")} className={openClass}><Eye size={13}/><span>View previous answers</span></button>}
    </>}
    {role === "asker" && hasAnsweredRounds && <>
      <button type="button" onClick={() => setMode("view")} className={openClass}><Eye size={13}/><span>View answers</span></button>
    </>}
    {mode && <InfoRequestDialog requestId={requestId} requestType={requestType} mode={mode} onClose={() => { setMode(null); void loadStatus(); }}/ >}
  </>;
}
