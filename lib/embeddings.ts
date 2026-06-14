import { Ollama } from "ollama";
import { prisma } from "./prisma";

const ollama = new Ollama({ 
  host: process.env.OLLAMA_HOST || 'http://127.0.0.1:11434' 
});

export async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const response = await ollama.embeddings({
      model: 'nomic-embed-text',
      prompt: text,
    });
    return response.embedding;
  } catch {
    return null;
  }
}

export async function syncVectors(userId: string, description: string, dealIn: string[], lookingFor: string[]) {
  try {
    const offeringText = `Services offered: ${dealIn.join(", ")}. Keywords: ${dealIn.join(" ")}. Business Description: ${description}`;
    const offeringVector = await generateEmbedding(offeringText);

    const needsText = lookingFor.length > 0 
      ? `Looking for services in: ${lookingFor.join(", ")}. Required skills: ${lookingFor.join(" ")}.` 
      : "general business growth networking partnership";
    const needsVector = await generateEmbedding(needsText);

    if (offeringVector && needsVector) {
      const fv = `[${offeringVector.join(",")}]`;
      const nv = `[${needsVector.join(",")}]`;
      await prisma.$executeRaw`
        UPDATE "CompanyProfile"
        SET "offeringVector" = ${fv}::vector, "needsVector" = ${nv}::vector
        WHERE "userId" = ${userId}
      `;
    } else if (offeringVector) {
      const fv = `[${offeringVector.join(",")}]`;
      await prisma.$executeRaw`
        UPDATE "CompanyProfile" SET "offeringVector" = ${fv}::vector WHERE "userId" = ${userId}
      `;
    } else if (needsVector) {
      const nv = `[${needsVector.join(",")}]`;
      await prisma.$executeRaw`
        UPDATE "CompanyProfile" SET "needsVector" = ${nv}::vector WHERE "userId" = ${userId}
      `;
    } else {
      return;
    }
    
  } catch (error) {
    console.error("Vector Sync Error:", error);
  }
}