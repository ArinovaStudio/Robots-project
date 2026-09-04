/**
 * Tests for lib/template.ts
 * 
 * Email template generation functions.
 */

// Mock the OtpType enum since we can't import from @prisma/client in tests easily
jest.mock("@prisma/client", () => ({
  OtpType: {
    VERIFY_EMAIL: "VERIFY_EMAIL",
    RESET_PASSWORD: "RESET_PASSWORD",
  },
}));

import { getOtpEmailTemplate, getPostModerationEmail, getUserStatusEmail } from "@/lib/template";

describe("getOtpEmailTemplate", () => {
  it("should generate verify email template with correct OTP", () => {
    const html = getOtpEmailTemplate("123456", "VERIFY_EMAIL" as any);
    expect(html).toContain("123456");
    expect(html).toContain("Verify your email address");
    expect(html).toContain("10 minutes");
  });

  it("should generate reset password template", () => {
    const html = getOtpEmailTemplate("654321", "RESET_PASSWORD" as any);
    expect(html).toContain("654321");
    expect(html).toContain("Reset your password");
  });

  it("should contain the OTP in a styled block", () => {
    const html = getOtpEmailTemplate("999888", "VERIFY_EMAIL" as any);
    expect(html).toContain("999888");
    expect(html).toContain("letter-spacing");
  });

  it("should include a disclaimer message", () => {
    const html = getOtpEmailTemplate("111222", "VERIFY_EMAIL" as any);
    expect(html).toContain("didn't request this");
  });
});

describe("getPostModerationEmail", () => {
  it("should generate suspended post email", () => {
    const html = getPostModerationEmail("John", "SUSPENDED", "This is a test post content");
    expect(html).toContain("John");
    expect(html).toContain("suspended");
    expect(html).toContain("This is a test post content");
  });

  it("should generate deleted post email", () => {
    const html = getPostModerationEmail("Jane", "DELETED", null);
    expect(html).toContain("Jane");
    expect(html).toContain("deleted");
  });

  it("should truncate long post snippets to 80 chars", () => {
    const longText = "A".repeat(200);
    const html = getPostModerationEmail("User", "SUSPENDED", longText);
    // Should contain truncated version
    expect(html).toContain("...");
  });

  it("should handle null post snippet gracefully", () => {
    const html = getPostModerationEmail("User", "DELETED", null);
    expect(html).not.toContain("undefined");
    expect(html).toContain("User");
  });
});

describe("getUserStatusEmail", () => {
  it("should generate suspended account email", () => {
    const html = getUserStatusEmail("Aryan", "SUSPENDED");
    expect(html).toContain("Account Suspended");
    expect(html).toContain("Aryan");
    expect(html).toContain("suspended");
    expect(html).toContain("#d9534f"); // Red color
  });

  it("should generate reactivated account email", () => {
    const html = getUserStatusEmail("Aryan", "ACTIVE");
    expect(html).toContain("Account Reactivated");
    expect(html).toContain("Aryan");
    expect(html).toContain("reactivated");
    expect(html).toContain("#5cb85c"); // Green color
  });
});
