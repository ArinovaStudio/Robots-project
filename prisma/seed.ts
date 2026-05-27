import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";
import { syncVectors } from "../lib/embeddings";
import { prisma } from "@/lib/prisma";
import dataset from "../lib/exchange-dataset.json";

async function main() {
  const hashedPassword = await bcrypt.hash("password123", 12);

  console.log("Seeding 100 companies based on structural dataset...");

  const getStructuralData = () => {
    const industry = faker.helpers.arrayElement(dataset.industries);
    const subIndustry = faker.helpers.arrayElement(industry.subIndustries);
    const product = faker.helpers.arrayElement(subIndustry.products);

    return {
      type: industry.name,
      dealIn: [product.name], 
      lookingFor: product.complementaryNeeds,
    };
  };

  for (let i = 0; i < 100; i++) {
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

    console.log(`[${i + 1}/100] Seeding ${companyName} (${type})...`);
    
    await syncVectors(user.id, description, dealIn, lookingFor);
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