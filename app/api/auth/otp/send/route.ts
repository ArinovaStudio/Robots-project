import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { getOtpEmailTemplate } from "@/lib/template";
import { authRateLimiter, getIP } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  type: z.enum(["VERIFY_EMAIL", "RESET_PASSWORD"]),
});

export async function POST(req: NextRequest) {
  try {
    const ip = getIP(req);
    const rateLimit = authRateLimiter.check(ip);

    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, message: "Too many attempts. Please try again in 15 minutes." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const validation = schema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, message: validation.error.issues[0].message }, { status: 400 });
    }

    const { email: rawEmail, type } = validation.data;
    const email = rawEmail.trim().toLowerCase();

    if (type === "RESET_PASSWORD") {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        // Return 200 without creating an OTP to prevent account enumeration
        return NextResponse.json(
          { success: true, message: "If an account with this email exists, an OTP has been sent." },
          { status: 200 }
        );
      }
    } else if (type === "VERIFY_EMAIL") {
      const existingUser = await prisma.user.findUnique({
        where: { email },
        include: { company: true, investor: true },
      });
      if (existingUser && (existingUser.isOnboarded || existingUser.company || existingUser.investor)) {
        return NextResponse.json(
          { success: false, message: "An account with this email already exists. Please sign in." },
          { status: 409 }
        );
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.otp.upsert({
      where: { email_type: { email, type } },
      update: { otp, expiresAt },
      create: { email, otp, type, expiresAt },
    });

    const html = getOtpEmailTemplate(otp, type);
    const emailSent = await sendEmail({
      to: email,
      subject: type === "VERIFY_EMAIL" ? "Verify Email" : "Reset Password",
      html,
    });

    if (!emailSent) {
      console.error("Failed to send email to", email);
      return NextResponse.json({ success: false, message: "Failed to send email. Please check your email configuration." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "OTP sent successfully" }, { status: 200 });
  } catch (error) {
    console.error("Failed to send OTP:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}