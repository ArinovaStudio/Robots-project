import { prisma } from "./prisma";
import { OLLAMA_HOST, OLLAMA_INTENT_MODEL } from "./embeddings";

/**
 * Match score between the viewer's business and a candidate business.
 *
 * Ollama decides WHICH services / keywords / tags are matched (so synonyms like
 * "web development" ~ "website design" count). The number itself is always
 * calculated in code from those match counts, so it stays consistent and explainable.
 * If Ollama is offline or slow, we fall back to plain text overlap.
 */

export type MatchDirection = "suppliers" | "buyers";

export interface MatchScore {
  score: number; // 0-100
  matchedServices: string[];
  matchedKeywords: string[];
  matchedTags: string[];
  source: "ollama" | "keyword";
}

interface Signals {
  services: string[]; // what the business offers (dealIn)
  needs: string[]; // what the business is looking for
  keywords: string[]; // keywords from description
  tags: string[]; // tags from posts / open collaboration requests
}

const WEIGHTS = { services: 0.6, keywords: 0.25, tags: 0.15 };
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_MATCH_TIMEOUT_MS || 10000);
const CACHE_TTL_MS = 30 * 60 * 1000;
const FALLBACK_TTL_MS = 2 * 60 * 1000;
const CACHE_MAX = 2000;

const cache = new Map<string, { value: MatchScore; expires: number }>();

const STOPWORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "your", "our", "are", "you", "was", "has", "have",
  "will", "can", "all", "any", "not", "but", "its", "their", "they", "who", "what", "which", "into", "more",
  "most", "also", "than", "then", "them", "been", "being", "company", "business", "businesses", "services",
  "service", "solutions", "solution", "provide", "provides", "providing", "leading", "global", "worldwide",
  "offer", "offers", "offering", "specializing", "specialising", "partner", "partners", "deliver", "excellence",
  "based", "help", "helps", "like", "one", "work", "well", "using", "use", "such", "other", "over", "across",
]);

/* ───────────────────────── text helpers ───────────────────────── */

function stem(word: string): string {
  return word.replace(/(ing|ers|er|ies|es|s)$/i, (m) => (m === "ies" ? "y" : "")).trim() || word;
}

function tokens(text: string): string[] {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w))
    .map(stem)
    .filter((w) => w.length >= 3);
}

function uniq(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of list) {
    const key = item.trim().toLowerCase();
    if (key && !seen.has(key)) {
      seen.add(key);
      out.push(item.trim());
    }
  }
  return out;
}

/** Two phrases match if they are equal, one contains the other, or share half their words. */
function phrasesMatch(a: string, b: string): boolean {
  const ta = tokens(a);
  const tb = tokens(b);
  if (ta.length === 0 || tb.length === 0) return false;
  const sa = new Set(ta);
  const sb = new Set(tb);
  let shared = 0;
  sa.forEach((t) => {
    if (sb.has(t)) shared++;
  });
  if (shared === 0) return false;
  return shared / Math.min(sa.size, sb.size) >= 0.5;
}

function topKeywords(text: string, extra: string[], limit = 20): string[] {
  const freq = new Map<string, number>();
  for (const t of [...tokens(text), ...extra.flatMap(tokens)]) freq.set(t, (freq.get(t) || 0) + 1);
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([w]) => w);
}

/* ───────────────────────── signals ───────────────────────── */

async function loadTags(userIds: string[]): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (userIds.length === 0) return map;

  try {
    const [intents, requests] = await Promise.all([
      prisma.postBusinessIntent.findMany({
        where: { authorId: { in: userIds }, isBusinessIntent: true },
        select: { authorId: true, services: true, category: true, industry: true },
        orderBy: { createdAt: "desc" },
        take: 300,
      }),
      prisma.collaborationRequest.findMany({
        where: { authorId: { in: userIds }, status: "OPEN" },
        select: { authorId: true, tags: true },
        orderBy: { createdAt: "desc" },
        take: 300,
      }),
    ]);

    const push = (id: string, values: (string | null | undefined)[]) => {
      const list = map.get(id) || [];
      for (const v of values) if (v && v.trim()) list.push(v.trim());
      map.set(id, list);
    };

    intents.forEach((i) => push(i.authorId, [...i.services, i.category, i.industry]));
    requests.forEach((r) => push(r.authorId, r.tags));

    map.forEach((list, id) => map.set(id, uniq(list).slice(0, 20)));
  } catch (err) {
    console.warn("[MatchScore] Could not load tags:", err);
  }
  return map;
}

function buildSignals(profile: any, tags: string[]): Signals {
  const services = uniq(profile.dealIn || []).slice(0, 15);
  const needs = uniq(profile.lookingFor || []).slice(0, 15);
  return {
    services,
    needs,
    keywords: topKeywords(profile.description || "", [...services, ...needs]),
    tags,
  };
}

/* ───────────────────────── scoring ───────────────────────── */

interface Pair {
  needSide: Signals; // the side that is looking for something
  offerSide: Signals; // the side that offers it
}

function pairFor(direction: MatchDirection, viewer: Signals, candidate: Signals): Pair {
  // suppliers: candidate offers what the viewer needs. buyers: candidate needs what the viewer offers.
  return direction === "suppliers"
    ? { needSide: viewer, offerSide: candidate }
    : { needSide: candidate, offerSide: viewer };
}

/** Plain text-overlap matching. Used as the fallback and as a safety net next to Ollama. */
function keywordMatches(pair: Pair) {
  const { needSide, offerSide } = pair;

  const matchedServices = needSide.needs.filter((n) => offerSide.services.some((s) => phrasesMatch(n, s)));

  const offerKw = new Set(offerSide.keywords);
  const matchedKeywords = needSide.keywords.filter((k) => offerKw.has(k));

  const matchedTags = needSide.tags.filter((t) => offerSide.tags.some((o) => phrasesMatch(t, o)));

  return { matchedServices, matchedKeywords, matchedTags };
}

function calculateScore(
  pair: Pair,
  matched: { matchedServices: string[]; matchedKeywords: string[]; matchedTags: string[] }
): number {
  const { needSide, offerSide } = pair;
  const parts: { weight: number; value: number }[] = [];

  if (needSide.needs.length > 0 && offerSide.services.length > 0) {
    parts.push({ weight: WEIGHTS.services, value: Math.min(1, matched.matchedServices.length / needSide.needs.length) });
  }
  if (needSide.keywords.length > 0 && offerSide.keywords.length > 0) {
    const denom = Math.max(1, Math.min(8, needSide.keywords.length, offerSide.keywords.length));
    parts.push({ weight: WEIGHTS.keywords, value: Math.min(1, matched.matchedKeywords.length / denom) });
  }
  if (needSide.tags.length > 0 && offerSide.tags.length > 0) {
    const denom = Math.max(1, Math.min(5, needSide.tags.length, offerSide.tags.length));
    parts.push({ weight: WEIGHTS.tags, value: Math.min(1, matched.matchedTags.length / denom) });
  }

  if (parts.length === 0) return 0;
  const totalWeight = parts.reduce((s, p) => s + p.weight, 0);
  const raw = parts.reduce((s, p) => s + p.weight * p.value, 0) / totalWeight;
  return Math.round(Math.max(0, Math.min(1, raw)) * 100);
}

/* ───────────────────────── Ollama ───────────────────────── */

interface OllamaResult {
  matchedServices?: unknown;
  matchedKeywords?: unknown;
  matchedTags?: unknown;
}

function keepKnown(value: unknown, allowed: string[]): string[] {
  if (!Array.isArray(value)) return [];
  const lookup = new Map(allowed.map((a) => [a.toLowerCase(), a]));
  const out: string[] = [];
  for (const v of value) {
    const hit = typeof v === "string" ? lookup.get(v.trim().toLowerCase()) : undefined;
    if (hit && !out.includes(hit)) out.push(hit); // ignore anything Ollama invented
  }
  return out;
}

async function askOllama(pairs: { id: string; pair: Pair }[]): Promise<Map<string, OllamaResult> | null> {
  const payload = pairs.map(({ id, pair }) => ({
    id,
    needs: pair.needSide.needs,
    offers: pair.offerSide.services,
    keywordsA: pair.needSide.keywords,
    keywordsB: pair.offerSide.keywords,
    tagsA: pair.needSide.tags,
    tagsB: pair.offerSide.tags,
  }));

  const prompt = `You are a B2B matchmaking engine. For each entry, compare what a business NEEDS with what another business OFFERS.

For every entry return:
- "matchedServices": items from "needs" that are covered by an item in "offers" (same service, or a clearly related one / synonym)
- "matchedKeywords": words from "keywordsA" that also appear in, or mean the same as, a word in "keywordsB"
- "matchedTags": items from "tagsA" that match or closely relate to an item in "tagsB"

Rules: copy items EXACTLY as written in "needs" / "keywordsA" / "tagsA". Do not invent items. Use an empty array when nothing matches.

Reply ONLY with JSON in this shape:
{"results":[{"id":"...","matchedServices":[],"matchedKeywords":[],"matchedTags":[]}]}

Entries:
${JSON.stringify(payload)}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

  try {
    const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_INTENT_MODEL,
        prompt,
        stream: false,
        format: "json",
        options: { temperature: 0 },
      }),
      signal: controller.signal,
    });
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.response) return null;

    let text: string = data.response;
    if (text.includes("```")) text = text.split("```")[1].replace(/^json/i, "");
    const parsed = JSON.parse(text.trim());
    const rows: any[] = Array.isArray(parsed) ? parsed : parsed?.results;
    if (!Array.isArray(rows)) return null;

    const map = new Map<string, OllamaResult>();
    rows.forEach((r) => r && typeof r.id === "string" && map.set(r.id, r));
    return map;
  } catch (err: any) {
    console.warn("[MatchScore] Ollama unavailable, using keyword fallback:", err?.name === "AbortError" ? "timeout" : err?.message);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/* ───────────────────────── public API ───────────────────────── */

function cacheKey(direction: MatchDirection, viewer: any, company: any) {
  return [
    direction,
    viewer.userId,
    new Date(viewer.updatedAt).getTime(),
    company.userId,
    new Date(company.updatedAt).getTime(),
  ].join("|");
}

function remember(key: string, value: MatchScore) {
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, { value, expires: Date.now() + (value.source === "ollama" ? CACHE_TTL_MS : FALLBACK_TTL_MS) });
}

/**
 * Returns a Map of companyUserId -> MatchScore for the given candidates.
 * Never throws: on any failure the candidate simply gets the keyword-based score.
 */
export async function scoreMatches(
  viewerProfile: any,
  candidates: any[],
  direction: MatchDirection
): Promise<Map<string, MatchScore>> {
  const result = new Map<string, MatchScore>();
  if (!viewerProfile || candidates.length === 0) return result;

  try {
    const toScore: any[] = [];
    for (const c of candidates) {
      const hit = cache.get(cacheKey(direction, viewerProfile, c));
      if (hit && hit.expires > Date.now()) result.set(c.userId, hit.value);
      else toScore.push(c);
    }
    if (toScore.length === 0) return result;

    const tagMap = await loadTags([viewerProfile.userId, ...toScore.map((c) => c.userId)]);
    const viewer = buildSignals(viewerProfile, tagMap.get(viewerProfile.userId) || []);

    const entries = toScore.map((c, i) => ({
      id: `c${i}`,
      company: c,
      pair: pairFor(direction, viewer, buildSignals(c, tagMap.get(c.userId) || [])),
    }));

    const ai = await askOllama(entries.map(({ id, pair }) => ({ id, pair })));

    for (const { id, company, pair } of entries) {
      try {
      const fallback = keywordMatches(pair);
      const row = ai?.get(id);

      let matched = fallback;
      let source: MatchScore["source"] = "keyword";

      if (row) {
        source = "ollama";
        matched = {
          matchedServices: uniq([...keepKnown(row.matchedServices, pair.needSide.needs), ...fallback.matchedServices]),
          matchedKeywords: uniq([...keepKnown(row.matchedKeywords, pair.needSide.keywords), ...fallback.matchedKeywords]),
          matchedTags: uniq([...keepKnown(row.matchedTags, pair.needSide.tags), ...fallback.matchedTags]),
        };
      }

      const value: MatchScore = { score: calculateScore(pair, matched), ...matched, source };
      result.set(company.userId, value);
      remember(cacheKey(direction, viewerProfile, company), value);
      } catch (err) {
        console.error(`[MatchScore] failed for company ${company?.userId}:`, err);
      }
    }
  } catch (err) {
    console.error("[MatchScore] scoring failed:", err);
  }

  // Never leave a candidate without a score: the UI would show a blank badge
  for (const c of candidates) {
    if (!result.has(c.userId)) {
      result.set(c.userId, { score: 0, matchedServices: [], matchedKeywords: [], matchedTags: [], source: "keyword" });
    }
  }

  return result;
}
