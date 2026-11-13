import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { registerIpLimiter, registerEmailLimiter, getIP } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  otp: z.string().length(6),
  accountType: z.enum(["BUSINESS", "INVESTOR"]).default("BUSINESS"),
});

function tooManyAttempts(retryAfterSec: number) {
  return NextResponse.json(
    { success: false, message: "Too many registration attempts. Please try again later." },
    { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
  );
}

export async function POST(req: NextRequest) {
  try {
    // 1. Per-IP limit, checked before doing any work.
    const byIp = await registerIpLimiter.check(getIP(req));
    if (!byIp.success) return tooManyAttempts(byIp.retryAfterSec);

    const body = await req.json();
    const validation = schema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, message: validation.error.issues[0].message }, { status: 400 });
    }

    const { email: rawEmail, password, otp, accountType } = validation.data;
    const email = rawEmail.trim().toLowerCase();

    // 2. Per-email limit: every call here is a guess at the 6-digit OTP for this address,
    //    so cap how many guesses one email gets no matter how many IPs they come from.
    const byEmail = await registerEmailLimiter.check(email);
    if (!byEmail.success) return tooManyAttempts(byEmail.retryAfterSec);

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

    // Registered: clear this email's counter. The IP counter is left alone on purpose.
    await registerEmailLimiter.reset(email);

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