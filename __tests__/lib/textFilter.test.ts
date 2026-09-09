/**
 * Tests for lib/textFilter.ts
 * 
 * Validates the profanity filter and text sanitization logic.
 * We mock the bad-words module since it uses ESM internally.
 */

jest.mock("bad-words", () => {
  const profaneWords = ["damn", "shit", "hell", "ass"];
  return {
    Filter: jest.fn().mockImplementation(() => ({
      isProfane: (text: string) => {
        return profaneWords.some((w) => text.toLowerCase().includes(w));
      },
      clean: (text: string) => {
        let cleaned = text;
        profaneWords.forEach((w) => {
          cleaned = cleaned.replace(new RegExp(w, "gi"), "*".repeat(w.length));
        });
        return cleaned;
      },
    })),
  };
});

import { validateTextContent } from "@/lib/textFilter";

describe("validateTextContent", () => {
  it("should return isValid: true for null input", () => {
    const result = validateTextContent(null);
    expect(result.isValid).toBe(true);
    expect(result.sanitizedText).toBeNull();
  });

  it("should return isValid: true for clean text", () => {
    const result = validateTextContent("This is a perfectly normal business post");
    expect(result.isValid).toBe(true);
    expect(result.sanitizedText).toBe("This is a perfectly normal business post");
  });

  it("should return isValid: false for profane text", () => {
    const result = validateTextContent("This is a damn post");
    expect(result.isValid).toBe(false);
  });

  it("should return sanitized text when profanity is detected", () => {
    const result = validateTextContent("What the hell is going on");
    expect(result.isValid).toBe(false);
    expect(result.sanitizedText).toBeDefined();
    expect(result.sanitizedText).toContain("****");
  });

  it("should handle empty string", () => {
    const result = validateTextContent("");
    expect(result.isValid).toBe(true);
  });

  it("should handle normal business terms", () => {
    const terms = [
      "B2B Marketplace for Manufacturing",
      "Cloud Server Hosting Solutions",
      "SEO Marketing Agency",
      "Corporate Tax Accounting Services",
    ];
    terms.forEach((term) => {
      const result = validateTextContent(term);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedText).toBe(term);
    });
  });

  it("should detect profanity regardless of case", () => {
    const result = validateTextContent("DAMN this is bad");
    expect(result.isValid).toBe(false);
  });

  it("should sanitize multiple profane words", () => {
    const result = validateTextContent("damn and shit");
    expect(result.isValid).toBe(false);
    expect(result.sanitizedText).not.toContain("damn");
    expect(result.sanitizedText).not.toContain("shit");
  });
});
