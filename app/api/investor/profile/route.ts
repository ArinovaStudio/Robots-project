import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadImage } from "@/lib/uploads";
import {
  CAPITAL_RANGES,
  ENTITY_TYPES,
  INVESTMENT_FREQUENCIES,
  INVESTMENT_RANGES,
  INVESTMENT_STAGES,
  INVESTMENT_STRUCTURES,
  ORGANIZATION_INVESTOR_TYPES,
  INVESTOR_TYPES,
} from "@/lib/investor-options";

const optionalUrl = z.string().trim().url("Please enter a valid URL.").optional().or(z.literal(""));
const optionalInteger = z.preprocess(
  (value) => value === "" || value === null ? undefined : Number(value),
  z.number().int().nonnegative().optional(),
);

const profileSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(120),
  phone: z.string().trim().min(4).max(40),
  country: z.string().trim().min(2).max(120),
  city: z.string().trim().min(1).max(120),
  currentDesignation: z.string().trim().min(1).max(120),
  currentCompany: z.string().trim().min(1).max(200),
  linkedInUrl: optionalUrl,
  investorType: z.enum(INVESTOR_TYPES),
  firmName: z.string().trim().max(200).optional().default(""),
  entityLegalName: z.string().trim().max(200).optional().default(""),
  entityType: z.enum(ENTITY_TYPES).optional().or(z.literal("")),
  registrationNumber: z.string().trim().max(120).optional().default(""),
  registeredCountry: z.string().trim().max(120).optional().default(""),
  officialWebsite: optionalUrl,
  representativeName: z.string().trim().max(120).optional().default(""),
  representativeDesignation: z.string().trim().max(120).optional().default(""),
  typicalInvestmentAmount: z.enum(INVESTMENT_RANGES),
  investmentRange: z.enum(INVESTMENT_RANGES),
  totalCapitalAvailable: z.enum(CAPITAL_RANGES),
  currency: z.string().trim().min(3).max(12),
  stages: z.array(z.enum(INVESTMENT_STAGES)).min(1),
  investmentFrequency: z.enum(INVESTMENT_FREQUENCIES),
  expectedTimeline: z.string().trim().min(1).max(120),
  sourceOfFunds: z.string().trim().min(1).max(200),
  canProvideFinancialEvidence: z.boolean(),
  hasPreviousInvestments: z.boolean(),
  previousInvestmentCount: optionalInteger,
  previousStartups: z.array(z.string().trim().min(1).max(120)).max(50).default([]),
  previousInvestmentRange: z.string().trim().max(120).optional().default(""),
  industriesInvested: z.array(z.string().trim().min(1).max(100)).max(30).default([]),
  yearsExperience: optionalInteger,
  portfolioUrl: optionalUrl,
  references: z.string().trim().max(500).optional().default(""),
  sectors: z.array(z.string().trim().min(1).max(100)).min(1).max(20),
  locations: z.array(z.string().trim().min(1).max(120)).min(1).max(30),
  investmentStructures: z.array(z.enum(INVESTMENT_STRUCTURES)).min(1),
  ownershipPreference: z.string().trim().max(200).optional().default(""),
  investorRole: z.enum(["Lead investor", "Co-investor", "Either"]),
  mentorshipInterest: z.boolean(),
  investmentThesis: z.string().trim().min(1).max(500),
  website: optionalUrl,
  location: z.string().trim().max(250).optional().default(""),
}).superRefine((profile, context) => {
  const isOrganization = ORGANIZATION_INVESTOR_TYPES.some(
    (type) => type === profile.investorType,
  );
  if (
    isOrganization &&
    (!profile.entityLegalName ||
      !profile.entityType ||
      !profile.registeredCountry ||
      !profile.representativeName ||
      !profile.representativeDesignation)
  ) {
    context.addIssue({
      code: "custom",
      message: "Complete the required organization details.",
    });
  }

  if (
    profile.hasPreviousInvestments &&
    (!profile.previousInvestmentCount ||
      profile.previousInvestmentCount < 1 ||
      !profile.previousInvestmentRange ||
      profile.industriesInvested.length === 0 ||
      profile.yearsExperience === undefined)
  ) {
    context.addIssue({
      code: "custom",
      message: "Complete the required previous investment details.",
    });
  }
});

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await getUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const rawProfile = formData.get("profile");
    if (typeof rawProfile !== "string") {
      return NextResponse.json({ success: false, message: "Investor profile data is required." }, { status: 400 });
    }

    let parsedProfile: unknown;
    try {
      parsedProfile = JSON.parse(rawProfile);
    } catch {
      return NextResponse.json({ success: false, message: "Investor profile data is invalid." }, { status: 400 });
    }

    const validation = profileSchema.safeParse(parsedProfile);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error.issues[0].message },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { company: true, investor: true },
    });
    if (!existingUser) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }
    if (existingUser.isOnboarded || existingUser.company || existingUser.investor) {
      return NextResponse.json({ success: false, message: "This account already has a completed profile." }, { status: 409 });
    }

    const profile = validation.data;
    const isOrganization = ORGANIZATION_INVESTOR_TYPES.some(
      (type) => type === profile.investorType,
    );
    const photo = formData.get("profilePhoto");
    let image = existingUser.image;
    if (photo instanceof File && photo.size > 0) {
      if (photo.size > 5 * 1024 * 1024) {
        return NextResponse.json({ success: false, message: "Profile photo must be 5MB or smaller." }, { status: 400 });
      }
      image = await uploadImage(photo, "investor-profiles");
    }

    await prisma.$transaction([
      prisma.investorProfile.create({
        data: {
          userId: user.id,
          investorType: profile.investorType,
          firmName: profile.firmName || null,
          phone: profile.phone,
          country: profile.country,
          city: profile.city,
          currentDesignation: profile.currentDesignation,
          currentCompany: profile.currentCompany,
          linkedInUrl: profile.linkedInUrl || null,
          entityLegalName: isOrganization ? profile.entityLegalName || null : null,
          entityType: isOrganization ? profile.entityType || null : null,
          registrationNumber: isOrganization ? profile.registrationNumber || null : null,
          registeredCountry: isOrganization ? profile.registeredCountry || null : null,
          officialWebsite: profile.officialWebsite || null,
          representativeName: isOrganization ? profile.representativeName || null : null,
          representativeDesignation: isOrganization ? profile.representativeDesignation || null : null,
          typicalInvestmentAmount: profile.typicalInvestmentAmount,
          totalCapitalAvailable: profile.totalCapitalAvailable,
          currency: profile.currency,
          stages: profile.stages,
          investmentFrequency: profile.investmentFrequency,
          expectedTimeline: profile.expectedTimeline,
          sourceOfFunds: profile.sourceOfFunds,
          canProvideFinancialEvidence: profile.canProvideFinancialEvidence,
          hasPreviousInvestments: profile.hasPreviousInvestments,
          previousInvestmentCount: profile.hasPreviousInvestments ? profile.previousInvestmentCount ?? null : null,
          previousStartups: profile.hasPreviousInvestments ? profile.previousStartups : [],
          previousInvestmentRange: profile.hasPreviousInvestments ? profile.previousInvestmentRange || null : null,
          industriesInvested: profile.hasPreviousInvestments ? profile.industriesInvested : [],
          yearsExperience: profile.hasPreviousInvestments ? profile.yearsExperience ?? null : null,
          portfolioUrl: profile.portfolioUrl || null,
          references: profile.references || null,
          sectors: profile.sectors,
          investmentRange: profile.investmentRange,
          location: profile.location || null,
          website: profile.website || null,
          locations: profile.locations,
          investmentStructures: profile.investmentStructures,
          ownershipPreference: profile.ownershipPreference || null,
          investorRole: profile.investorRole,
          mentorshipInterest: profile.mentorshipInterest,
          investmentThesis: profile.investmentThesis,
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          name: profile.name,
          image,
          accountType: "INVESTOR",
          isOnboarded: true,
        },
      }),
    ]);

    return NextResponse.json({ success: true, message: "Investor profile created successfully." }, { status: 201 });
  } catch (error) {
    console.error("Failed to create investor profile:", error);
    return NextResponse.json({ success: false, message: "Internal server error." }, { status: 500 });
  }
}
