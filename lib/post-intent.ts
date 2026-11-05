import { prisma } from "./prisma";
import { generateEmbedding, OLLAMA_HOST, OLLAMA_INTENT_MODEL } from "./embeddings";

export interface BusinessIntentAnalysis {
  is_business_intent: boolean;
  intent_type: "LOOKING_FOR" | "OFFERING" | null;
  category: string;
  services: string[];
  industry: string;
  confidence: number;
}

/**
 * Parses and validates Ollama's raw JSON response
 */
export function sanitizeAndParseIntentJson(rawText: string): BusinessIntentAnalysis | null {
  try {
    let clean = rawText.trim();
    if (clean.includes("```json")) {
      clean = clean.split("```json")[1].split("```")[0];
    } else if (clean.includes("```")) {
      clean = clean.split("```")[1].split("```")[0];
    }

    const firstBrace = clean.indexOf("{");
    const lastBrace = clean.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1) return null;

    clean = clean.substring(firstBrace, lastBrace + 1);
    const parsed = JSON.parse(clean);

    if (typeof parsed !== "object" || parsed === null) return null;

    const isBusinessIntent = Boolean(parsed.is_business_intent);
    const intentType =
      parsed.intent_type === "LOOKING_FOR" || parsed.intent_type === "OFFERING"
        ? parsed.intent_type
        : null;

    const services = Array.isArray(parsed.services)
      ? parsed.services.map((s: any) => String(s).trim()).filter(Boolean)
      : [];

    return {
      is_business_intent: isBusinessIntent && intentType !== null && services.length > 0,
      intent_type: intentType,
      category: typeof parsed.category === "string" ? parsed.category.trim() : "",
      services,
      industry: typeof parsed.industry === "string" ? parsed.industry.trim() : "",
      confidence: typeof parsed.confidence === "number" ? Math.min(1, Math.max(0, parsed.confidence)) : 0.8,
    };
  } catch {
    return null;
  }
}

/**
 * Sends post text to Ollama and extracts structured business intention
 */
export async function analyzeTextWithOllama(content: string): Promise<BusinessIntentAnalysis | null> {
  const prompt = `You are an expert B2B business intent classifier and analyzer.
Analyze the following post published by a business and determine if it explicitly communicates a business requirement (LOOKING_FOR) or a business service offering (OFFERING).

Classification Rules:
1. "LOOKING_FOR": The post explicitly mentions that the business needs, seeks, wants to hire, or purchases products, services, agencies, or software partners (e.g. "Looking for web developers", "Seeking tax accountant", "Need 3PL logistics partner").
2. "OFFERING": The post explicitly states that the business sells, provides, or delivers specific commercial services/products to other businesses (e.g. "We provide custom web development and SEO", "Our team delivers cloud migration services").
3. "NOT_BUSINESS_INTENT": If the post is a general greeting, holiday wish, internal celebration, general opinion, news announcement, or personal update without an explicit commercial requirement or offering, set "is_business_intent": false.

Post Content:
"${content.replace(/"/g, '\\"')}"

You MUST reply ONLY with a raw JSON object strictly matching this schema:
{
  "is_business_intent": true or false,
  "intent_type": "LOOKING_FOR" or "OFFERING" or null,
  "category": "High level category (e.g. Technology, Marketing, Logistics, Legal)",
  "services": ["Specific service 1", "Specific service 2"],
  "industry": "Industry name or empty string",
  "confidence": 0.95
}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

  try {
    const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_INTENT_MODEL,
        prompt,
        stream: false,
        options: {
          temperature: 0.1, // low temperature for consistent JSON
        },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.warn(`[Ollama Intent] Request failed with status ${res.status}`);
      return null;
    }

    const data = await res.json();
    if (!data.response) return null;

    return sanitizeAndParseIntentJson(data.response);
  } catch (err: any) {
    if (err.name === "AbortError") {
      console.warn("[Ollama Intent] Request timed out");
    } else {
      console.warn("[Ollama Intent] Service unavailable or error:", err.message);
    }
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Asynchronously processes a post for business intent in the background.
 * Completely idempotent: if a post has already been analyzed, it is not re-processed.
 */
export async function analyzePostBusinessIntent(
  postId: string,
  content: string,
  authorId: string
): Promise<void> {
  if (!content || content.trim().length < 15) {
    return;
  }

  try {
    // 1. Idempotency check: see if record already exists and is finished
    const existing = await prisma.$queryRaw<any[]>`
      SELECT id, status, "isBusinessIntent" 
      FROM "PostBusinessIntent" 
      WHERE "postId" = ${postId} 
      LIMIT 1
    `;

    if (existing.length > 0 && (existing[0].status === "COMPLETED" || existing[0].status === "IGNORED")) {
      return;
    }

    // 2. Mark as PROCESSING or insert initial placeholder
    if (existing.length === 0) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "PostBusinessIntent" ("id", "postId", "authorId", "status", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, $2, 'PROCESSING', NOW(), NOW())
         ON CONFLICT ("postId") DO UPDATE SET "status" = 'PROCESSING', "updatedAt" = NOW()`,
        postId,
        authorId
      );
    }

    // 3. Call Ollama for classification
    const analysis = await analyzeTextWithOllama(content);

    if (!analysis) {
      // Ollama was offline or failed: mark as FAILED so it can be retried later
      await prisma.$executeRawUnsafe(
        `UPDATE "PostBusinessIntent" SET "status" = 'FAILED', "updatedAt" = NOW() WHERE "postId" = $1`,
        postId
      );
      return;
    }

    if (!analysis.is_business_intent || !analysis.intent_type || analysis.services.length === 0) {
      // Mark as IGNORED: general post with no commercial intent
      await prisma.$executeRawUnsafe(
        `UPDATE "PostBusinessIntent" 
         SET "isBusinessIntent" = false, "status" = 'IGNORED', "rawAnalysis" = $1::jsonb, "updatedAt" = NOW() 
         WHERE "postId" = $2`,
        JSON.stringify(analysis),
        postId
      );
      return;
    }

    // 4. Generate vector embedding for the extracted business intent
    const textToEmbed = `${
      analysis.intent_type === "LOOKING_FOR" ? "Looking for services in" : "Services offered"
    }: ${analysis.services.join(", ")}. Category: ${analysis.category}. Industry: ${analysis.industry}. Content: ${content}`.trim();

    let formattedVector: string | null = null;
    try {
      const vector = await generateEmbedding(textToEmbed);
      if (Array.isArray(vector) && vector.length > 0) {
        formattedVector = `[${vector.join(",")}]`;
      }
    } catch (embErr) {
      console.warn("[Ollama Intent] Embedding generation failed:", embErr);
    }

    // 5. Store completed record with pgvector
    if (formattedVector) {
      await prisma.$executeRawUnsafe(
        `UPDATE "PostBusinessIntent" 
         SET "isBusinessIntent" = true,
             "intentType" = $1,
             "category" = $2,
             "services" = $3,
             "industry" = $4,
             "confidence" = $5,
             "rawAnalysis" = $6::jsonb,
             "embedding" = ${formattedVector}::vector,
             "status" = 'COMPLETED',
             "updatedAt" = NOW()
         WHERE "postId" = $7`,
        analysis.intent_type,
        analysis.category,
        analysis.services,
        analysis.industry,
        analysis.confidence,
        JSON.stringify(analysis),
        postId
      );
    } else {
      await prisma.$executeRawUnsafe(
        `UPDATE "PostBusinessIntent" 
         SET "isBusinessIntent" = true,
             "intentType" = $1,
             "category" = $2,
             "services" = $3,
             "industry" = $4,
             "confidence" = $5,
             "rawAnalysis" = $6::jsonb,
             "status" = 'COMPLETED',
             "updatedAt" = NOW()
         WHERE "postId" = $7`,
        analysis.intent_type,
        analysis.category,
        analysis.services,
        analysis.industry,
        analysis.confidence,
        JSON.stringify(analysis),
        postId
      );
    }
  } catch (error) {
    console.error("[Ollama Intent] Background analysis error:", error);
    try {
      await prisma.$executeRawUnsafe(
        `UPDATE "PostBusinessIntent" SET "status" = 'FAILED', "updatedAt" = NOW() WHERE "postId" = $1`,
        postId
      );
    } catch {
      // ignore
    }
  }
}

