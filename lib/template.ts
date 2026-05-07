import { OtpType } from "@prisma/client";

export const getOtpEmailTemplate = (otp: string, type: OtpType): string => {
  const isVerify = type === "VERIFY_EMAIL";
  
  const title = isVerify ? "Verify your email address" : "Reset your password";
  const message = isVerify 
    ? "Thank you for starting your journey with Arinova Studio. Please use the following OTP to verify your email address. This OTP is valid for 10 minutes."
    : "We received a request to reset your password. Use the OTP below to proceed. This OTP is valid for 10 minutes.";

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
      <h2 style="color: #333; text-align: center;">${title}</h2>
      <p style="color: #555; font-size: 16px; line-height: 1.5;">${message}</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="display: inline-block; padding: 15px 30px; font-size: 24px; font-weight: bold; color: #fff; background-color: #0f172a; border-radius: 5px; letter-spacing: 5px;">
          ${otp}
        </span>
      </div>
      <p style="color: #999; font-size: 12px; text-align: center;">If you didn't request this, please ignore this email.</p>
    </div>
  `;
};