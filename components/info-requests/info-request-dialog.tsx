"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DEFAULT_INFO_QUESTIONS } from "@/lib/info-request-questions";

type RequestType = "INVESTMENT_OFFER" | "PITCH_REQUEST" | "INVESTOR_COLLABORATION" | "BUSINESS_COLLABORATION";
type InfoRequest = { id: string; roundNumber: number; questions: string[]; answers: string[] | null; status: "PENDING" | "ANSWERED" };

export default function InfoRequestDialog({ requestId, requestType, mode, onClose }: { requestId: string; requestType: RequestType; mode: "ask" | "answer" | "view"; onClose: () => void }) {
  const [activeMode, setActiveMode] = useState<"ask" | "answer" | "view">(mode);
  const [viewerRole, setViewerRole] = useState<"asker" | "answerer" | null>(null);
  const [questions, setQuestions] = useState<string[]>([...DEFAULT_INFO_QUESTIONS]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [record, setRecord] = useState<InfoRequest | null>(null);
  const [rounds, setRounds] = useState<InfoRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch(`/api/info-requests?requestId=${encodeURIComponent(requestId)}&requestType=${requestType}`)
      .then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j.message || "Could not load questions."); return j; })
      .then((j) => {
        if (!active) return;
        const history = Array.isArray(j.rounds) ? j.rounds : (j.data ? [j.data] : []);
        setRounds(history);
        setViewerRole(j.data?.viewerRole ?? history[0]?.viewerRole ?? null);
        const latest = j.data as InfoRequest | null;
        setRecord(latest);
        if (activeMode !== "ask" && !latest) setError("No information request has been sent for this item yet.");
        if (activeMode === "answer" && latest) setAnswers(Array.isArray(latest.answers) ? latest.answers : Array(latest.questions.length).fill(""));
      })
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [activeMode, requestId, requestType]);

  const nextRound = rounds.length + 1;
  const submit = async () => {
    const clean = questions.map((q) => q.trim());
    if (activeMode === "ask" && (clean.length < 1 || clean.length > 20 || clean.some((q) => !q))) return toast.error("Provide between 1 and 20 non-empty questions.");
    if (activeMode === "answer" && answers.some((a) => !a.trim())) return toast.error("Answer every question.");
    setSaving(true);
    try {
      const res = await fetch("/api/info-requests", { method: activeMode === "ask" ? "POST" : "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(activeMode === "ask" ? { requestId, requestType, questions: clean } : { id: record?.id, answers }) });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Request failed.");
      toast.success(activeMode === "ask" ? `Round ${json.data.roundNumber} questions sent.` : "Answers submitted.");
      onClose();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Something went wrong."); }
    finally { setSaving(false); }
  };

  const title = activeMode === "ask" ? (rounds.length ? `Ask more questions — Round ${nextRound}` : "Ask for information") : activeMode === "answer" ? `Answer questions — Round ${record?.roundNumber ?? ""}` : "Questions and answers";
  const displayedRounds = useMemo(() => activeMode === "answer" ? (record ? [record] : []) : rounds, [activeMode, record, rounds]);

  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3 sm:p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <section
  role="dialog"
  aria-modal="true"
  aria-label={title}
  className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-4 sm:p-5 shadow-2xl dark:bg-slate-900"
>
      <header className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2><button onClick={onClose} aria-label="Close"><X size={20}/></button></header>
      {loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin"/></div> : error ? <p className="py-6 text-sm text-red-600">{error}</p> : activeMode === "ask" ? <>
        {rounds.length > 0 && <p className="mb-3 text-sm text-slate-500">Your previous rounds are preserved. These questions will be saved as a new round.</p>}
        <p className="mb-4 text-sm text-slate-500">Edit these suggested questions, remove any, or add your own. You can send up to 20 questions.</p>
        <div className="space-y-3">{questions.map((q, i) => <div key={i} className="flex gap-2"><textarea value={q} maxLength={500} onChange={(e) => setQuestions((p) => p.map((v, n) => n === i ? e.target.value : v))} rows={2} className="min-w-0 flex-1 rounded-lg border border-slate-300 p-3 text-sm dark:border-slate-700 dark:bg-slate-800"/><button type="button" onClick={() => setQuestions((p) => p.filter((_, n) => n !== i))} className="text-red-500" aria-label="Remove question"><Trash2 size={17}/></button></div>)}</div>
        <button type="button" disabled={questions.length >= 20} onClick={() => setQuestions((p) => [...p, ""])} className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-blue-600 disabled:opacity-40"><Plus size={16}/> Add question</button>
      </> : displayedRounds.length ? <div className="space-y-6">{displayedRounds.map((round) => <section key={round.id} className="space-y-3"><div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-700"><h3 className="font-semibold text-slate-800 dark:text-slate-100">Round {round.roundNumber}</h3><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${round.status === "ANSWERED" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>{round.status === "ANSWERED" ? "Answered" : "Awaiting answers"}</span></div>{round.questions.map((q, i) => <div key={`${round.id}-${i}`} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700"><p className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">{i + 1}. {q}</p>{activeMode === "answer" && round.id === record?.id && round.status === "PENDING" ? <textarea rows={3} value={answers[i] || ""} onChange={(e) => setAnswers((p) => p.map((v, n) => n === i ? e.target.value : v))} maxLength={5000} placeholder="Write your answer..." className="w-full rounded-lg border border-slate-300 p-3 text-sm dark:border-slate-700 dark:bg-slate-800"/> : <p className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{round.answers?.[i] || (round.status === "PENDING" ? "Waiting for an answer." : "No answer provided.")}</p>}</div>)}</section>)}</div> : <p className="py-6 text-sm text-slate-500">No information request rounds yet.</p>}
      {!loading && !error && activeMode === "view" && viewerRole === "asker" && record?.status === "ANSWERED" && <footer className="mt-5 flex justify-end"><button type="button" onClick={() => { setQuestions([...DEFAULT_INFO_QUESTIONS]); setActiveMode("ask"); }} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"><Plus size={16}/> Ask more questions</button></footer>}
      {!loading && !error && (activeMode === "ask" || (activeMode === "answer" && record?.status === "PENDING")) && <footer className="mt-5 flex justify-end gap-2"><button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm">Cancel</button><button onClick={submit} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving && <Loader2 size={15} className="animate-spin"/>}{activeMode === "ask" ? (rounds.length ? "Send new round" : "Send questions") : "Submit answers"}</button></footer>}
    </section>
  </div>;
}
