import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

const PASSWORD = "password123"; // change if you like

const investors = [
  {
    name: "Nova Angels",
    email: "nova.angels@connecto.test",
    investorType: "Individual / Angel Investor",
    firmName: "Nova Angel Network",
    sectors: ["SaaS", "AI", "FinTech"],
    stages: ["Pre-Seed", "Seed"],
    investmentRange: "$25k - $150k",
    city: "Bengaluru",
    country: "India",
  },
  {
    name: "Orbit Capital",
    email: "orbit.capital@connecto.test",
    investorType: "Venture Capital (VC) Firm",
    firmName: "Orbit Capital Partners",
    sectors: ["Robotics", "DeepTech", "Manufacturing"],
    stages: ["Seed", "Series A"],
    investmentRange: "$200k - $1M",
    city: "Mumbai",
    country: "India",
  },
  {
    name: "Greenline Ventures",
    email: "greenline.ventures@connecto.test",
    investorType: "Venture Capital (VC) Firm",
    firmName: "Greenline Ventures",
    sectors: ["CleanTech", "AgriTech", "Healthcare"],
    stages: ["Seed", "Series A"],
    investmentRange: "$100k - $500k",
    city: "Hyderabad",
    country: "India",
  },
  {
    name: "Kiran Mehta",
    email: "kiran.mehta@connecto.test",
    investorType: "Individual / Angel Investor",
    firmName: null,
    sectors: ["EdTech", "E-commerce"],
    stages: ["Pre-Seed", "Seed"],
    investmentRange: "$10k - $50k",
    city: "Pune",
    country: "India",
  },
  {
    name: "Summit Family Office",
    email: "summit.fo@connecto.test",
    investorType: "Family Office",
    firmName: "Summit Family Office",
    sectors: ["Real Estate", "Healthcare", "AI"],
    stages: ["Series A", "Series B"],
    investmentRange: "$500k - $2M",
    city: "Delhi",
    country: "India",
  },
];

async function main() {
  const hashed = await bcrypt.hash(PASSWORD, 12);

  for (const inv of investors) {
    const user = await prisma.user.upsert({
      where: { email: inv.email },
      update: {},
      create: {
        name: inv.name,
        email: inv.email,
        password: hashed,
        emailVerified: new Date(),
        accountType: "INVESTOR",
        status: "ACTIVE",
        isOnboarded: true,
      },
    });

    await prisma.investorProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        investorType: inv.investorType,
        firmName: inv.firmName,
        sectors: inv.sectors,
        stages: inv.stages,
        investmentRange: inv.investmentRange,
        city: inv.city,
        country: inv.country,
        location: `${inv.city}, ${inv.country}`,
      },
    });

    console.log(`✅ ${inv.name} (${inv.email})`);
  }

  console.log(`\nDone. Login password for all: ${PASSWORD}`);
}

main()
  .catch((e) => console.error("ERROR:", e))
  .finally(() => process.exit(0));