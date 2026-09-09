/**
 * Tests for lib/email.ts
 * 
 * Email sending functionality via Nodemailer.
 */

// Mock nodemailer before importing
jest.mock("nodemailer", () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn(),
  }),
}));

import { transporter, sendEmail } from "@/lib/email";
import nodemailer from "nodemailer";

describe("Email Transport", () => {
  it("should create a transport with gmail service", () => {
    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  });

  it("should export a transporter instance", () => {
    expect(transporter).toBeDefined();
    expect(transporter.sendMail).toBeDefined();
  });
});

describe("sendEmail", () => {
  const mockSendMail = transporter.sendMail as jest.Mock;

  afterEach(() => {
    mockSendMail.mockReset();
  });

  it("should return true on successful send", async () => {
    mockSendMail.mockResolvedValueOnce({ messageId: "test-id" });

    const result = await sendEmail({
      to: "user@example.com",
      subject: "Test Subject",
      html: "<p>Test</p>",
    });

    expect(result).toBe(true);
    expect(mockSendMail).toHaveBeenCalledWith({
      from: process.env.EMAIL_USER,
      to: "user@example.com",
      subject: "Test Subject",
      html: "<p>Test</p>",
    });
  });

  it("should return false when sendMail throws", async () => {
    mockSendMail.mockRejectedValueOnce(new Error("SMTP Error"));

    const result = await sendEmail({
      to: "user@example.com",
      subject: "Test",
      html: "<p>fail</p>",
    });

    expect(result).toBe(false);
  });

  it("should pass correct parameters to sendMail", async () => {
    mockSendMail.mockResolvedValueOnce({});

    await sendEmail({
      to: "recipient@test.com",
      subject: "OTP Code",
      html: "<h1>123456</h1>",
    });

    const call = mockSendMail.mock.calls[0][0];
    expect(call.to).toBe("recipient@test.com");
    expect(call.subject).toBe("OTP Code");
    expect(call.html).toBe("<h1>123456</h1>");
  });
});
