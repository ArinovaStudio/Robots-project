import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { resetIpLimiter, resetEmailLimiter, getIP } from "@/lib/rate-limit";

const resetSchema = z.object({
  email: z.string().email(),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  otp: z.string().length(6),
});

function tooManyAttempts(retryAfterSec: number) {
  return NextResponse.json(
    { success: false, message: "Too many attempts. Please try again later." },
    { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
  );
}

export async function POST(req: Request) {
  try {
    // 1. Per-IP limit, checked before doing any work.
    const byIp = await resetIpLimiter.check(getIP(req));
    if (!byIp.success) return tooManyAttempts(byIp.retryAfterSec);

    const body = await req.json();
    const validation = resetSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, message: validation.error.issues[0].message }, { status: 400 });
    }

    const { email: rawEmail, newPassword, otp } = validation.data;
    const email = rawEmail.trim().toLowerCase();

    // 2. Per-email limit: every call here is a guess at the reset OTP for this address.
    const byEmail = await resetEmailLimiter.check(email);
    if (!byEmail.success) return tooManyAttempts(byEmail.retryAfterSec);

    const otpRecord = await prisma.otp.findUnique({ where: { email_type: { email, type: "RESET_PASSWORD" } } });

    if (!otpRecord || otpRecord.otp !== otp) {
      return NextResponse.json({ success: false, message: "Invalid OTP" }, { status: 400 });
    }

    if (new Date() > otpRecord.expiresAt) {
      return NextResponse.json({ success: false, message: "OTP has expired" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({ where: { email }, data: { password: hashedNewPassword } });

    await prisma.otp.delete({ where: { email_type: { email, type: "RESET_PASSWORD" } } });

    // Password reset: clear this email's counter. The IP counter is left alone.
    await resetEmailLimiter.reset(email);

    return NextResponse.json({ success: true, message: "Password updated successfully" });

  } catch (error) {
    console.error("Reset password failed:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}