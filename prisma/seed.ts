import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";
import { syncVectors } from "../lib/embeddings";
import { prisma } from "@/lib/prisma";

const industries = [
  { type: "Tech", dealIn: ["SaaS", "Web Development", "Cloud Computing"], lookingFor: ["Digital Marketing", "Legal Advice"] },
  { type: "Marketing", dealIn: ["SEO", "Social Media Marketing", "Content Creation"], lookingFor: ["Web Development", "Data Analytics"] },
  { type: "Legal", dealIn: ["Corporate Law", "Intellectual Property", "Compliance"], lookingFor: ["Software Solutions", "Cyber Security"] },
  { type: "Manufacturing", dealIn: ["Automotive Parts", "Industrial Machinery", "Electronics"], lookingFor: ["Logistics", "Cloud ERP"] },
  { type: "Finance", dealIn: ["Fintech", "Investment Banking", "Accounting"], lookingFor: ["Blockchain Devs", "Compliance Consultants"] },
  { type: "Healthcare", dealIn: ["Medical Equipment", "Telemedicine", "Health Informatics"], lookingFor: ["Data Security", "Regulatory Compliance"] },
  { type: "Real Estate", dealIn: ["Property Management", "Commercial Leasing", "Real Estate Tech"], lookingFor: ["Interior Design", "Digital Marketing"] },
  { type: "Education", dealIn: ["E-Learning Platforms", "Skill Development", "Corporate Training"], lookingFor: ["App Development", "Content Strategy"] },
  { type: "Retail", dealIn: ["E-commerce Solutions", "Inventory Management", "Point of Sale Systems"], lookingFor: ["Logistics", "Customer Analytics"] },
  { type: "Logistics", dealIn: ["Warehousing", "Last-Mile Delivery", "Freight Forwarding"], lookingFor: ["Fleet Management AI", "Supply Chain Software"] },
  { type: "Hospitality", dealIn: ["Hotel Management", "Travel Tech", "Event Planning"], lookingFor: ["Booking Systems", "Social Media Marketing"] },
  { type: "Energy", dealIn: ["Solar Panel Installation", "Renewable Energy Consulting", "Power Storage"], lookingFor: ["Infrastructure Funding", "Government Liaison"] },
  { type: "Food & Beverage", dealIn: ["Organic Wholesale", "Food Tech", "Supply Chain Management"], lookingFor: ["Sustainable Packaging", "Cold Storage Logistics"] },
  { type: "Fashion", dealIn: ["Textile Manufacturing", "Apparel Design", "Luxury Goods"], lookingFor: ["E-commerce Branding", "Retail Distribution"] },
  { type: "Construction", dealIn: ["Civil Engineering", "Architecture", "Building Materials"], lookingFor: ["Project Management Software", "Structural Consulting"] }
];

async function main() {
  // console.log("Emptying database...");
  // await prisma.otp.deleteMany();
  // await prisma.companyProfile.deleteMany();
  // await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash("password123", 12);

  console.log("Seeding 100 companies...");

  for (let i = 0; i < 100; i++) {
    const industry = faker.helpers.arrayElement(industries);
    const companyName = faker.company.name();
    const description = `${companyName} is a leading provider of ${faker.helpers.arrayElement(industry.dealIn)} services. ${faker.company.catchPhrase()}. We specialize in delivering high-quality solutions for modern businesses.`;

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
        type: industry.type,
        yearOfEstablishment: faker.number.int({ min: 1990, max: 2024 }),
        dealIn: industry.dealIn,
        lookingFor: industry.lookingFor,
        location: faker.location.city(),
        website: faker.internet.url(),
      },
    });

    console.log(`[${i + 1}/100] Generating vectors for ${companyName}...`);
    await syncVectors(user.id, description, industry.dealIn, industry.lookingFor);
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