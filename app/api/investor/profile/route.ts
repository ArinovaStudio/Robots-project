import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { INVESTMENT_RANGES, INVESTMENT_STAGES, INVESTOR_TYPES } from "@/lib/investor-options";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(120),
  investorType: z.enum(INVESTOR_TYPES),
  firmName: z.string().trim().max(200).optional().default(""),
  sectors: z.array(z.string().trim().min(1).max(100)).min(1, "Add at least one sector.").max(20),
  stages: z.array(z.enum(INVESTMENT_STAGES)).min(1, "Select at least one investment stage."),
  investmentRange: z.enum(INVESTMENT_RANGES),
  location: z.string().trim().max(120).optional().default(""),
  website: z.string().url("Please enter a valid website URL.").optional().or(z.literal("")),
  linkedInUrl: z.string().url("Please enter a valid LinkedIn URL.").optional().or(z.literal("")),
});

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await getUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const validation = profileSchema.safeParse(await request.json());
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
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }
    if (existingUser.isOnboarded || existingUser.company || existingUser.investor) {
      return NextResponse.json({ success: false, message: "This account already has a completed profile." }, { status: 409 });
    }

    const profile = validation.data;
    await prisma.$transaction([
      prisma.investorProfile.create({
        data: {
          userId: user.id,
          investorType: profile.investorType,
          firmName: profile.firmName || null,
          sectors: profile.sectors,
          stages: profile.stages,
          investmentRange: profile.investmentRange,
          location: profile.location || null,
          website: profile.website || null,
          linkedInUrl: profile.linkedInUrl || null,
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { name: profile.name, accountType: "INVESTOR", isOnboarded: true },
      }),
    ]);

    return NextResponse.json({ success: true, message: "Investor profile created successfully" }, { status: 201 });
  } catch (error) {
    console.error("Failed to create investor profile:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
