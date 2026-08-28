import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";
import { syncVectors } from "../lib/embeddings";
import { prisma } from "../lib/prisma";

async function main() {
  const hashedPassword = await bcrypt.hash("password123", 12);

  console.log("Seeding 20 companies based on structural dataset...");

  const getStructuralData = () => {
    const industry = faker.helpers.arrayElement(["Technology", "Finance", "Healthcare", "Manufacturing"]);
    const product = faker.helpers.arrayElement(["Software", "Consulting", "Hardware", "Services"]);
    const needs = faker.helpers.arrayElement([["Marketing", "HR"], ["Cloud Hosting"], ["Logistics"]]);

    return {
      type: industry,
      dealIn: [product], 
      lookingFor: needs,
    };
  };

  for (let i = 0; i < 20; i++) {
    const { type, dealIn, lookingFor } = getStructuralData();
    const companyName = faker.company.name();
    const description = `${companyName} is a professional ${type} company specializing in ${dealIn[0]}. We pride ourselves on innovation and quality.`;

    const user = await prisma.user.create({
      data: {
        email: faker.internet.email().toLowerCase(),
        password: hashedPassword,
        isOnboarded: true,
        role: "USER",
      },
    });

   await prisma.companyProfile.create({
      data: {
        userId: user.id,
        companyName,
        description,
        size: faker.number.int({ min: 10, max: 1000 }),
        type,
        yearOfEstablishment: faker.number.int({ min: 1990, max: 2024 }),
        dealIn, 
        lookingFor,
        location: faker.location.city(),
        website: faker.internet.url(),
      },
    });

    console.log(`[${i + 1}/20] Seeding ${companyName} (${type})...`);
    
    try {
      await syncVectors(user.id, description, dealIn, lookingFor);
    } catch (error) {
      console.warn(`Could not sync vectors for ${companyName}. (Ollama might be down)`);
    }
  }

  console.log("Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });