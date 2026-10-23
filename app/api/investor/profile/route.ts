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

const optionalUrl = z.string().trim().url("Please enter a valid URL.").optional().or(z.literal("")).nullable();
const optionalInteger = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : Number(value)),
  z.number().int().nonnegative().optional().nullable(),
);

const profileSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(120),
  investorType: z.enum(INVESTOR_TYPES, {
    message: "Please select a valid investor type.",
  }),
  firmName: z.string().trim().max(200).optional().nullable().default(""),
  sectors: z.array(z.string().trim().min(1).max(100)).min(1, "Add at least one sector.").max(20),
  stages: z.array(z.enum(INVESTMENT_STAGES)).min(1, "Select at least one investment stage."),
  investmentRange: z.enum(INVESTMENT_RANGES, {
    message: "Please select a valid investment range.",
  }),
  location: z.string().trim().max(250).optional().nullable().default(""),
  website: optionalUrl,
  linkedInUrl: optionalUrl,

  // Optional extended fields
  phone: z.string().trim().max(40).optional().nullable(),
  country: z.string().trim().max(120).optional().nullable(),
  city: z.string().trim().max(120).optional().nullable(),
  currentDesignation: z.string().trim().max(120).optional().nullable(),
  currentCompany: z.string().trim().max(200).optional().nullable(),
  entityLegalName: z.string().trim().max(200).optional().nullable().default(""),
  entityType: z.enum(ENTITY_TYPES).optional().nullable().or(z.literal("")),
  registrationNumber: z.string().trim().max(120).optional().nullable().default(""),
  registeredCountry: z.string().trim().max(120).optional().nullable().default(""),
  officialWebsite: optionalUrl,
  representativeName: z.string().trim().max(120).optional().nullable().default(""),
  representativeDesignation: z.string().trim().max(120).optional().nullable().default(""),
  typicalInvestmentAmount: z.enum(INVESTMENT_RANGES).optional().nullable(),
  totalCapitalAvailable: z.enum(CAPITAL_RANGES).optional().nullable(),
  currency: z.string().trim().max(12).optional().nullable().default("USD"),
  investmentFrequency: z.enum(INVESTMENT_FREQUENCIES).optional().nullable(),
  expectedTimeline: z.string().trim().max(120).optional().nullable(),
  sourceOfFunds: z.string().trim().max(200).optional().nullable(),
  canProvideFinancialEvidence: z.boolean().optional().default(false),
  hasPreviousInvestments: z.boolean().optional().default(false),
  previousInvestmentCount: optionalInteger,
  previousStartups: z.array(z.string().trim().min(1).max(120)).max(50).optional().default([]),
  previousInvestmentRange: z.string().trim().max(120).optional().nullable().default(""),
  industriesInvested: z.array(z.string().trim().min(1).max(100)).max(30).optional().default([]),
  yearsExperience: optionalInteger,
  portfolioUrl: optionalUrl,
  references: z.string().trim().max(500).optional().nullable().default(""),
  locations: z.array(z.string().trim().min(1).max(120)).max(30).optional().default([]),
  investmentStructures: z.array(z.enum(INVESTMENT_STRUCTURES)).optional().default([]),
  ownershipPreference: z.string().trim().max(200).optional().nullable().default(""),
  investorRole: z.enum(["Lead investor", "Co-investor", "Either"]).optional().default("Either"),
  mentorshipInterest: z.boolean().optional().default(false),
  investmentThesis: z.string().trim().max(500).optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await getUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    let parsedProfile: unknown;
    let photo: File | null = null;

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      parsedProfile = await request.json();
    } else if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();
      const rawProfile = formData.get("profile");
      if (typeof rawProfile === "string") {
        try {
          parsedProfile = JSON.parse(rawProfile);
        } catch {
          return NextResponse.json({ success: false, message: "Investor profile data is invalid." }, { status: 400 });
        }
      } else {
        // Form submitted as direct form fields
        parsedProfile = {
          name: formData.get("name"),
          investorType: formData.get("investorType"),
          firmName: formData.get("firmName") || "",
          sectors: formData.getAll("sectors").length > 0 ? formData.getAll("sectors") : (formData.get("sectors") ? String(formData.get("sectors")).split(",").map(s => s.trim()).filter(Boolean) : []),
          stages: formData.getAll("stages"),
          investmentRange: formData.get("investmentRange"),
          location: formData.get("location") || "",
          website: formData.get("website") || "",
          linkedInUrl: formData.get("linkedInUrl") || "",
        };
      }
      const rawPhoto = formData.get("profilePhoto") || formData.get("photo") || formData.get("image");
      if (rawPhoto instanceof File && rawPhoto.size > 0) {
        photo = rawPhoto;
      }
    } else {
      try {
        parsedProfile = await request.json();
      } catch {
        return NextResponse.json({ success: false, message: "Investor profile data is required." }, { status: 400 });
      }
    }

    const validation = profileSchema.safeParse(parsedProfile);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error.issues[0]?.message || "Invalid profile data." },
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

    let image = existingUser.image;
    if (photo instanceof File && photo.size > 0) {
      if (photo.size > 5 * 1024 * 1024) {
        return NextResponse.json({ success: false, message: "Profile photo must be 5MB or smaller." }, { status: 400 });
      }
      image = await uploadImage(photo, "investor-profiles");
    }

    const locationsArray = profile.locations && profile.locations.length > 0
      ? profile.locations
      : (profile.location ? [profile.location] : []);

    await prisma.$transaction([
      prisma.investorProfile.create({
        data: {
          userId: user.id,
          investorType: profile.investorType,
          firmName: profile.firmName || null,
          phone: profile.phone || null,
          country: profile.country || null,
          city: profile.city || null,
          currentDesignation: profile.currentDesignation || null,
          currentCompany: profile.currentCompany || null,
          linkedInUrl: profile.linkedInUrl || null,
          entityLegalName: isOrganization ? profile.entityLegalName || null : null,
          entityType: isOrganization ? profile.entityType || null : null,
          registrationNumber: isOrganization ? profile.registrationNumber || null : null,
          registeredCountry: isOrganization ? profile.registeredCountry || null : null,
          officialWebsite: profile.officialWebsite || null,
          representativeName: isOrganization ? profile.representativeName || null : null,
          representativeDesignation: isOrganization ? profile.representativeDesignation || null : null,
          typicalInvestmentAmount: profile.typicalInvestmentAmount || profile.investmentRange,
          totalCapitalAvailable: profile.totalCapitalAvailable || null,
          currency: profile.currency || "USD",
          stages: profile.stages,
          investmentFrequency: profile.investmentFrequency || null,
          expectedTimeline: profile.expectedTimeline || null,
          sourceOfFunds: profile.sourceOfFunds || null,
          canProvideFinancialEvidence: profile.canProvideFinancialEvidence ?? false,
          hasPreviousInvestments: profile.hasPreviousInvestments ?? false,
          previousInvestmentCount: profile.hasPreviousInvestments ? profile.previousInvestmentCount ?? null : null,
          previousStartups: profile.hasPreviousInvestments ? profile.previousStartups || [] : [],
          previousInvestmentRange: profile.hasPreviousInvestments ? profile.previousInvestmentRange || null : null,
          industriesInvested: profile.hasPreviousInvestments ? profile.industriesInvested || [] : [],
          yearsExperience: profile.hasPreviousInvestments ? profile.yearsExperience ?? null : null,
          portfolioUrl: profile.portfolioUrl || null,
          references: profile.references || null,
          sectors: profile.sectors,
          investmentRange: profile.investmentRange,
          location: profile.location || null,
          website: profile.website || null,
          locations: locationsArray,
          investmentStructures: profile.investmentStructures || [],
          ownershipPreference: profile.ownershipPreference || null,
          investorRole: profile.investorRole || "Either",
          mentorshipInterest: profile.mentorshipInterest ?? false,
          investmentThesis: profile.investmentThesis || null,
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
