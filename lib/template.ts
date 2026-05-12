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

export const getPostModerationEmail = (userName: string, action: "SUSPENDED" | "DELETED", postSnippet: string | null) => `
  <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
    <h2 style="color: #333;">Notice Regarding Your Recent Post</h2>
    <p>Hello ${userName},</p>
    <p>This is an automated notification from the moderation team. A post you recently published has been <strong>${action.toLowerCase()}</strong> for violating our community guidelines.</p>
    ${postSnippet ? `<div style="background: #f9f9f9; padding: 12px; border-left: 4px solid #ccc; color: #555; margin: 15px 0;"><i>"${postSnippet.substring(0, 80)}..."</i></div>` : ''}
    <p>Please review our platform guidelines to ensure future posts comply with our standards. If you believe this was an error, please contact support.</p>
    <br/>
    <p>Regards,<br/><strong>The Moderation Team</strong></p>
  </div>
`;

export const getUserStatusEmail = (userName: string, status: "SUSPENDED" | "ACTIVE") => {
  const isSuspended = status === "SUSPENDED";
  const titleColor = isSuspended ? "#d9534f" : "#5cb85c";
  const titleText = isSuspended ? "Account Suspended" : "Account Reactivated";
  const bodyText = isSuspended 
    ? "Your account has been suspended by an administrator due to violations of our community terms. You will temporarily lose access to the platform's features."
    : "Good news! Your account has been reviewed and successfully reactivated. You may now log in and resume using the platform.";

  return `
  <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
    <h2 style="color: ${titleColor};">${titleText}</h2>
    <p>Hello ${userName},</p>
    <p>${bodyText}</p>
    <p>If you have any questions, please reach out to our support desk.</p>
    <br/>
    <p>Regards,<br/><strong>The Moderation Team</strong></p>
  </div>
  `;
};