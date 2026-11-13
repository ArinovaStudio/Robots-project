import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { otpVerifyLimiter, otpVerifyEmailLimiter, getIP } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().length(6, "Verification code must be 6 digits"),
  type: z.enum(["VERIFY_EMAIL", "RESET_PASSWORD"]),
});

export async function POST(req: NextRequest) {
  try {
    const ip = getIP(req);
    const rateLimit = await otpVerifyLimiter.check(ip);

    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, message: "Too many attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSec) } }
      );
    }

    const body = await req.json();
    const validation = schema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { email: rawEmail, otp, type } = validation.data;
    const email = rawEmail.trim().toLowerCase();

    // Per-email limit (separately for each OTP type): caps guesses at one address's code
    // no matter how many IPs they come from.
    const guessKey = `${type}:${email}`;
    const byEmail = await otpVerifyEmailLimiter.check(guessKey);
    if (!byEmail.success) {
      return NextResponse.json(
        { success: false, message: "Too many attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(byEmail.retryAfterSec) } }
      );
    }

    const record = await prisma.otp.findUnique({
      where: { email_type: { email, type } },
    });

    if (!record || record.otp !== otp) {
      return NextResponse.json(
        { success: false, message: "Invalid verification code. Please check and try again." },
        { status: 400 }
      );
    }

    if (new Date() > record.expiresAt) {
      return NextResponse.json(
        { success: false, message: "Verification code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Correct code: clear this email's guess counter. The IP counter is left alone.
    await otpVerifyEmailLimiter.reset(guessKey);

    return NextResponse.json(
      { success: true, message: "Verification code verified successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("OTP verification error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error during verification." },
      { status: 500 }
    );
  }
}
