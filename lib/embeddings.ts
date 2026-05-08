import { Ollama } from "ollama";
import { prisma } from "./prisma";

const ollama = new Ollama();

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await ollama.embeddings({
    model: 'nomic-embed-text',
    prompt: text,
  });
  return response.embedding;
}

export async function syncVectors(userId: string, description: string, dealIn: string[], lookingFor: string[]) {
  try {
    const offeringText = `${description} ${dealIn.join(" ")}`;
    const offeringVector = await generateEmbedding(offeringText);

    const needsText = lookingFor.length > 0 ? lookingFor.join(" ") : "general business growth";
    const needsVector = await generateEmbedding(needsText);

    await prisma.$queryRaw`
      UPDATE "CompanyProfile" 
      SET "offeringVector" = ${offeringVector}::vector, "needsVector" = ${needsVector}::vector 
      WHERE "userId" = ${userId}
    `;
    
  } catch {
    console.error("Vector Sync Error:");
  }
}