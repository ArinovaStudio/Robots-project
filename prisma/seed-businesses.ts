import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

const PASSWORD = process.env.SEED_PASSWORD || "password123"; // login password for all seeded businesses

type SeedBusiness = {
  name: string; // user display name (founder / contact)
  email: string;
  companyName: string;
  type: string; // industry shown on the profile
  description: string;
  size: number; // number of employees
  yearOfEstablishment: number;
  dealIn: string[]; // "Services & Offerings"
  lookingFor: string[]; // first item should be an "Open to ..." label (see lib/open-to.ts)
  website: string | null;
  city: string;
  country: string;
  verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED";
  isBoosted?: boolean;
};

const businesses: SeedBusiness[] = [
  {
    name: "Aarav Sharma",
    email: "aarav.sharma@connecto.test",
    companyName: "CloudNest Technologies",
    type: "SaaS",
    description:
      "Cloud infrastructure and managed hosting for fast-growing startups. We handle deployments, monitoring and scaling so your team can ship faster.",
    size: 45,
    yearOfEstablishment: 2019,
    dealIn: ["Cloud Hosting", "DevOps", "Server Maintenance"],
    lookingFor: ["Open to Partnerships", "Reseller Partners"],
    website: "https://cloudnest.example.com",
    city: "Delhi",
    country: "India",
    verificationStatus: "VERIFIED",
    isBoosted: true,
  },
  {
    name: "Meera Iyer",
    email: "meera.iyer@connecto.test",
    companyName: "FinLeaf Payments",
    type: "FinTech",
    description:
      "Payment gateway and reconciliation tools for D2C brands and marketplaces. Low-latency checkout, UPI-first, with settlement dashboards.",
    size: 60,
    yearOfEstablishment: 2020,
    dealIn: ["Payment Gateway", "UPI Integration", "Reconciliation"],
    lookingFor: ["Open to Investment", "Enterprise Clients"],
    website: "https://finleaf.example.com",
    city: "Bengaluru",
    country: "India",
    verificationStatus: "VERIFIED",
  },
  {
    name: "Rohan Gupta",
    email: "rohan.gupta@connecto.test",
    companyName: "RoboForge Systems",
    type: "Robotics",
    description:
      "Industrial robotic arms and automation kits for small manufacturers. We design, build and install custom pick-and-place lines.",
    size: 32,
    yearOfEstablishment: 2018,
    dealIn: ["Industrial Automation", "Robotic Arms", "Custom Fabrication"],
    lookingFor: ["Open to Projects", "Component Suppliers"],
    website: "https://roboforge.example.com",
    city: "Pune",
    country: "India",
    verificationStatus: "VERIFIED",
  },
  {
    name: "Ananya Reddy",
    email: "ananya.reddy@connecto.test",
    companyName: "GreenHarvest AgriTech",
    type: "AgriTech",
    description:
      "Farm-to-market platform with soil sensors and crop advisory for small farmers. Connecting growers directly with bulk buyers.",
    size: 28,
    yearOfEstablishment: 2021,
    dealIn: ["Soil Sensors", "Crop Advisory", "Direct Procurement"],
    lookingFor: ["Open to Investment", "Distribution Partners"],
    website: "https://greenharvest.example.com",
    city: "Hyderabad",
    country: "India",
    verificationStatus: "PENDING",
  },
  {
    name: "Vikram Singh",
    email: "vikram.singh@connecto.test",
    companyName: "PixelCraft Studio",
    type: "Design & Branding",
    description:
      "Brand identity, UI/UX and product design for startups. From logo to launch-ready design systems in weeks, not months.",
    size: 14,
    yearOfEstablishment: 2020,
    dealIn: ["Branding", "UI/UX Design", "Design Systems"],
    lookingFor: ["Open to Projects", "Startup Clients"],
    website: "https://pixelcraft.example.com",
    city: "Mumbai",
    country: "India",
    verificationStatus: "UNVERIFIED",
  },
  {
    name: "Neha Kapoor",
    email: "neha.kapoor@connecto.test",
    companyName: "MediSync Health",
    type: "HealthTech",
    description:
      "Clinic management and teleconsultation software for small hospitals. Appointments, records and billing in one place.",
    size: 38,
    yearOfEstablishment: 2019,
    dealIn: ["Clinic Software", "Telemedicine", "Medical Billing"],
    lookingFor: ["Open to Collaborations", "Hospital Partners"],
    website: "https://medisync.example.com",
    city: "Chennai",
    country: "India",
    verificationStatus: "VERIFIED",
  },
  {
    name: "Karan Malhotra",
    email: "karan.malhotra@connecto.test",
    companyName: "LogiTrack Freight",
    type: "Logistics",
    description:
      "Last-mile delivery and freight tracking for e-commerce sellers. Real-time tracking, route optimisation and COD reconciliation.",
    size: 120,
    yearOfEstablishment: 2016,
    dealIn: ["Last-Mile Delivery", "Freight Tracking", "Warehousing"],
    lookingFor: ["Open to Partnerships", "E-commerce Sellers"],
    website: "https://logitrack.example.com",
    city: "Gurugram",
    country: "India",
    verificationStatus: "VERIFIED",
  },
  {
    name: "Sana Khan",
    email: "sana.khan@connecto.test",
    companyName: "LearnLoop EdTech",
    type: "EdTech",
    description:
      "Adaptive learning platform for K-12 schools with assessments, analytics and teacher dashboards.",
    size: 22,
    yearOfEstablishment: 2022,
    dealIn: ["Adaptive Learning", "Assessments", "School ERP"],
    lookingFor: ["Open to Investment", "School Partnerships"],
    website: null,
    city: "Jaipur",
    country: "India",
    verificationStatus: "UNVERIFIED",
  },
  {
    name: "Arjun Nair",
    email: "arjun.nair@connecto.test",
    companyName: "SolarBridge Energy",
    type: "CleanTech",
    description:
      "Rooftop solar installation and energy monitoring for factories and warehouses. EPC, financing support and 10-year maintenance.",
    size: 75,
    yearOfEstablishment: 2017,
    dealIn: ["Rooftop Solar", "Energy Monitoring", "EPC Services"],
    lookingFor: ["Open to Projects", "Industrial Clients"],
    website: "https://solarbridge.example.com",
    city: "Ahmedabad",
    country: "India",
    verificationStatus: "VERIFIED",
  },
  {
    name: "Ishita Bose",
    email: "ishita.bose@connecto.test",
    companyName: "TalentBridge HR",
    type: "HR & Recruitment",
    description:
      "Tech hiring partner for startups. Contract staffing, executive search and employer-branding support.",
    size: 18,
    yearOfEstablishment: 2021,
    dealIn: ["Tech Recruitment", "Contract Staffing", "Employer Branding"],
    lookingFor: ["Open to Hiring", "Startup Clients"],
    website: "https://talentbridge.example.com",
    city: "Kolkata",
    country: "India",
    verificationStatus: "PENDING",
  },
  {
    name: "Dev Patel",
    email: "dev.patel@connecto.test",
    companyName: "ShopSpark Commerce",
    type: "E-commerce",
    description:
      "Storefront builder and growth tooling for D2C brands. Catalog sync, abandoned-cart recovery and marketing automation.",
    size: 40,
    yearOfEstablishment: 2020,
    dealIn: ["Storefront Builder", "Marketing Automation", "Catalog Sync"],
    lookingFor: ["Open to Partnerships", "Agency Partners"],
    website: "https://shopspark.example.com",
    city: "Surat",
    country: "India",
    verificationStatus: "VERIFIED",
  },
  {
    name: "Tanvi Joshi",
    email: "tanvi.joshi@connecto.test",
    companyName: "SecureGrid Cyber",
    type: "Cybersecurity",
    description:
      "Penetration testing, SOC monitoring and compliance consulting for SaaS and fintech teams.",
    size: 26,
    yearOfEstablishment: 2019,
    dealIn: ["Penetration Testing", "SOC Monitoring", "Compliance Consulting"],
    lookingFor: ["Open to Collaborations", "Enterprise Clients"],
    website: "https://securegrid.example.com",
    city: "Noida",
    country: "India",
    verificationStatus: "UNVERIFIED",
  },
];

async function main() {
  const hashed = await bcrypt.hash(PASSWORD, 12);

  for (const b of businesses) {
    const user = await prisma.user.upsert({
      where: { email: b.email },
      update: {},
      create: {
        name: b.name,
        email: b.email,
        password: hashed,
        emailVerified: new Date(),
        accountType: "BUSINESS",
        status: "ACTIVE",
        verificationStatus: b.verificationStatus,
        isOnboarded: true,
      },
    });

    await prisma.companyProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        companyName: b.companyName,
        description: b.description,
        size: b.size,
        type: b.type,
        yearOfEstablishment: b.yearOfEstablishment,
        dealIn: b.dealIn,
        lookingFor: b.lookingFor,
        website: b.website,
        location: `${b.city}, ${b.country}`,
        isBoosted: b.isBoosted ?? false,
      },
    });

    console.log(`✅ ${b.companyName} (${b.email})`);
  }

  console.log(`\nSeeded ${businesses.length} business profiles.`);
  console.log(`Login password for all: ${PASSWORD}`);
}

main()
  .catch((e) => {
    console.error("ERROR:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit();
  });