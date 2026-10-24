import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  otp: z.string().length(6),
  accountType: z.enum(["BUSINESS", "INVESTOR"]).default("BUSINESS"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = schema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, message: validation.error.issues[0].message }, { status: 400 });
    }

    const { email, password, otp, accountType } = validation.data;

    const otpRecord = await prisma.otp.findUnique({ where: { email_type: { email, type: "VERIFY_EMAIL" } } });

    if (!otpRecord || otpRecord.otp !== otp) {
      return NextResponse.json({ success: false, message: "Invalid OTP" }, { status: 400 });
    }

    if (new Date() > otpRecord.expiresAt) {
      return NextResponse.json({ success: false, message: "OTP has expired" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: { company: true, investor: true },
    });
    if (existingUser) {
      const isReallyOnboarded = Boolean(existingUser.isOnboarded || existingUser.company || existingUser.investor);
      if (!isReallyOnboarded) {
        return NextResponse.json(
          {
            success: false,
            message: "An account with this email already exists but setup is incomplete. Please sign in to complete your profile.",
            isIncomplete: true,
          },
          { status: 409 }
        );
      }
      return NextResponse.json({ success: false, message: "An account with this email already exists. Please sign in." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    
    await prisma.$transaction([
      prisma.user.create({
        data: { email, password: hashedPassword, accountType, emailVerified: new Date() },
      }),
      prisma.otp.delete({ where: { email_type: { email, type: "VERIFY_EMAIL" } } }),
    ]);

    return NextResponse.json({ success: true, message: "Registration successful" }, { status: 200 });
  } catch (error: any) {
    console.error("Failed to register user:", error);
    if (error?.code === "P2002") {
      return NextResponse.json(
        { success: false, message: "An account with this email already exists. Please sign in." },
        { status: 409 }
      );
    }
    return NextResponse.json({ success: false, message: error?.message || "Internal server error" }, { status: 500 });
  }
}