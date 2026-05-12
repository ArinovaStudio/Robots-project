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
    const offeringText = `Services offered: ${dealIn.join(", ")}. Keywords: ${dealIn.join(" ")}. Business Description: ${description}`;
    const offeringVector = await generateEmbedding(offeringText);

    const needsText = lookingFor.length > 0 
      ? `Looking for services in: ${lookingFor.join(", ")}. Required skills: ${lookingFor.join(" ")}.` 
      : "general business growth networking partnership";
    const needsVector = await generateEmbedding(needsText);

    const formattedOffering = `[${offeringVector.join(",")}]`;
    const formattedNeeds = `[${needsVector.join(",")}]`;

    await prisma.$executeRaw`
      UPDATE "CompanyProfile" 
      SET "offeringVector" = ${formattedOffering}::vector, "needsVector" = ${formattedNeeds}::vector 
      WHERE "userId" = ${userId}
    `;
    
  } catch (error) {
    console.error("Vector Sync Error:", error);
  }
}