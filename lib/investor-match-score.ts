import { OLLAMA_HOST, OLLAMA_INTENT_MODEL } from "./embeddings";

/**
 * Match score between the viewer's business and an investor.
 * Ollama returns a 0-100 score per investor; if it is offline/slow we fall back
 * to plain keyword overlap between the business profile and the investor profile.
 */

const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_MATCH_TIMEOUT_MS || 10000);
const CACHE_TTL_MS = 30 * 60 * 1000;
const cache = new Map<string, { score: number; expires: number }>();

export interface BusinessSignals {
  userId: string;
  updatedAt: Date | string;
  description: string;
  type: string;
  dealIn: string[];
  lookingFor: string[];
}

export interface InvestorViewerSignals {
  userId: string;
  updatedAt: Date | string;
  investorType: string;
  sectors: string[];
  stages: string[];
  investmentRange: string;
  investmentThesis: string;
  industriesInvested: string[];
}

export type ViewerSignals =
  | ({ kind: "business" } & BusinessSignals)
  | ({ kind: "investor" } & InvestorViewerSignals);

export interface InvestorSignals {
  userId: string;
  updatedAt: Date | string;
  sectors: string[];
  stages: string[];
  investmentRange: string;
  investmentThesis: string;
  industriesInvested: string[];
}

const words = (t: string) =>
  (t || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length >= 3);

function viewerText(v: ViewerSignals): string {
  return v.kind === "business"
    ? [v.description, v.type, ...v.dealIn, ...v.lookingFor].join(" ")
    : [...v.sectors, ...v.industriesInvested, v.investmentThesis].join(" ");
}

function keywordScore(v: ViewerSignals, i: InvestorSignals): number {
  const mine = new Set(words(viewerText(v)));
  const theirs = new Set(words([...i.sectors, ...i.industriesInvested, i.investmentThesis].join(" ")));
  if (mine.size === 0 || theirs.size === 0) return 0;
  let hit = 0;
  theirs.forEach((w) => mine.has(w) && hit++);
  let score = (hit / Math.min(theirs.size, 12)) * 100;
  // investor-to-investor: shared stages add a little signal
  if (v.kind === "investor") {
    const sharedStages = i.stages.filter((st) => v.stages.includes(st)).length;
    score = score * 0.8 + (sharedStages > 0 ? 20 : 0);
  }
  return Math.min(100, Math.round(score));
}

async function askOllama(v: ViewerSignals, list: { id: string; i: InvestorSignals }[]) {
  const intro =
    v.kind === "business"
      ? `You are an investor-startup matchmaking engine.
Business: ${JSON.stringify({ type: v.type, description: v.description.slice(0, 500), offers: v.dealIn, lookingFor: v.lookingFor })}

For each investor below give an integer "score" from 0 to 100 for how well this business fits the investor's sectors and thesis (related sectors and synonyms count).`
      : `You are an investor-to-investor collaboration matchmaking engine (co-investing, deal sharing, syndicates).
Investor A: ${JSON.stringify({ type: v.investorType, sectors: v.sectors, stages: v.stages, range: v.investmentRange, industriesInvested: v.industriesInvested, thesis: v.investmentThesis.slice(0, 500) })}

For each investor below give an integer "score" from 0 to 100 for how well they would collaborate with Investor A: overlapping or related sectors and thesis (synonyms count), compatible or complementary stages and ticket sizes.`;
  const prompt = `${intro}
Reply ONLY with JSON: {"results":[{"id":"...","score":0}]}

Investors: ${JSON.stringify(
    list.map(({ id, i }) => ({ id, sectors: i.sectors, stages: i.stages, range: i.investmentRange, industriesInvested: i.industriesInvested, thesis: i.investmentThesis }))
  )}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: OLLAMA_INTENT_MODEL, prompt, stream: false, format: "json", options: { temperature: 0 } }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = await res.json();
    let text: string = data.response || "";
    if (text.includes("```")) text = text.split("```")[1].replace(/^json/i, "");
    const parsed = JSON.parse(text.trim());
    const rows: any[] = Array.isArray(parsed) ? parsed : parsed?.results;
    if (!Array.isArray(rows)) return null;
    const map = new Map<string, number>();
    rows.forEach((r) => {
      const n = Number(r?.score);
      if (r && typeof r.id === "string" && Number.isFinite(n)) map.set(r.id, Math.max(0, Math.min(100, Math.round(n))));
    });
    return map;
  } catch (err: any) {
    console.warn("[InvestorMatch] Ollama unavailable, using keyword fallback:", err?.name === "AbortError" ? "timeout" : err?.message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Returns Map<investorUserId, score 0-100>. Never throws. */
export async function scoreInvestors(viewer: ViewerSignals | null, investors: InvestorSignals[]) {
  const out = new Map<string, number>();
  if (!viewer) return out;
  const key = (i: InvestorSignals) =>
    [viewer.kind, viewer.userId, new Date(viewer.updatedAt).getTime(), i.userId, new Date(i.updatedAt).getTime()].join("|");

  const pending: InvestorSignals[] = [];
  for (const i of investors) {
    const hit = cache.get(key(i));
    if (hit && hit.expires > Date.now()) out.set(i.userId, hit.score);
    else pending.push(i);
  }
  if (pending.length === 0) return out;

  const entries = pending.map((i, n) => ({ id: `i${n}`, i }));
  const ai = await askOllama(viewer, entries);
  for (const { id, i } of entries) {
    const score = ai?.get(id) ?? keywordScore(viewer, i);
    out.set(i.userId, score);
    if (ai?.has(id)) cache.set(key(i), { score, expires: Date.now() + CACHE_TTL_MS });
  }
  return out;
}