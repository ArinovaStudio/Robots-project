import { NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
const changePasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().length(6, "Verification code must be 6 digits"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
});

export async function POST(req: Request) {
  try {
    const { user, error } = await getUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    if (!user.password) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your account uses social login (Google/Facebook). You can't set a password here.",
        },
        { status: 400 }
      );
    }

    const body = await req.json();
    const validation = changePasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email: rawEmail, otp, newPassword, confirmPassword } = validation.data;
    const email = rawEmail.trim().toLowerCase();
    if (email !== user.email.trim().toLowerCase()) {
      return NextResponse.json(
        { success: false, message: "Please enter the email address of your account" },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: "New passwords do not match" },
        { status: 400 }
      );
    }

    const otpRecord = await prisma.otp.findUnique({
      where: { email_type: { email, type: "RESET_PASSWORD" } },
    });

    if (!otpRecord || otpRecord.otp !== otp) {
      return NextResponse.json(
        { success: false, message: "Invalid verification code" },
        { status: 400 }
      );
    }

    if (new Date() > otpRecord.expiresAt) {
      return NextResponse.json(
        { success: false, message: "Verification code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    if (await bcrypt.compare(newPassword, user.password)) {
      return NextResponse.json(
        { success: false, message: "New password must be different from current password" },
        { status: 400 }
      );
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { password: hashedNewPassword } }),
      prisma.otp.delete({ where: { email_type: { email, type: "RESET_PASSWORD" } } }),
    ]);

    return NextResponse.json({ success: true, message: "Password changed successfully" });
  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}