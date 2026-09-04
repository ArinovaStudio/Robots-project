/**
 * Tests for lib/constants.ts
 * 
 * Validates that the application constants are properly defined.
 */

import { DEAL_IN_OPTIONS, LOOKING_FOR_OPTIONS } from "@/lib/constants";

describe("DEAL_IN_OPTIONS", () => {
  it("should be an array", () => {
    expect(Array.isArray(DEAL_IN_OPTIONS)).toBe(true);
  });

  it("should contain at least 5 options", () => {
    expect(DEAL_IN_OPTIONS.length).toBeGreaterThanOrEqual(5);
  });

  it("should contain only strings", () => {
    DEAL_IN_OPTIONS.forEach((option) => {
      expect(typeof option).toBe("string");
    });
  });

  it("should contain known business services", () => {
    expect(DEAL_IN_OPTIONS).toContain("Web Development");
    expect(DEAL_IN_OPTIONS).toContain("Digital Marketing");
    expect(DEAL_IN_OPTIONS).toContain("Cloud Services");
  });

  it("should have no duplicates", () => {
    const uniqueSet = new Set(DEAL_IN_OPTIONS);
    expect(uniqueSet.size).toBe(DEAL_IN_OPTIONS.length);
  });
});

describe("LOOKING_FOR_OPTIONS", () => {
  it("should be an array", () => {
    expect(Array.isArray(LOOKING_FOR_OPTIONS)).toBe(true);
  });

  it("should contain at least 5 options", () => {
    expect(LOOKING_FOR_OPTIONS.length).toBeGreaterThanOrEqual(5);
  });

  it("should contain only strings", () => {
    LOOKING_FOR_OPTIONS.forEach((option) => {
      expect(typeof option).toBe("string");
    });
  });

  it("should contain known partnership types", () => {
    expect(LOOKING_FOR_OPTIONS).toContain("Investors");
    expect(LOOKING_FOR_OPTIONS).toContain("Co-founders");
  });

  it("should have no duplicates", () => {
    const uniqueSet = new Set(LOOKING_FOR_OPTIONS);
    expect(uniqueSet.size).toBe(LOOKING_FOR_OPTIONS.length);
  });
});
