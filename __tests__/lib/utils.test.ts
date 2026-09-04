/**
 * Tests for lib/utils.ts
 *
 * The `cn` utility function for merging Tailwind classes.
 */

import { cn } from "@/lib/utils";

describe("cn (classname merge utility)", () => {
  it("should merge simple class names", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("should handle conditional classes with clsx", () => {
    const isActive = true;
    const result = cn("base", isActive && "active", !isActive && "inactive");
    expect(result).toBe("base active");
  });

  it("should resolve Tailwind conflicts (last wins)", () => {
    // twMerge should resolve px-4 vs px-2 -> px-2 wins
    const result = cn("px-4", "px-2");
    expect(result).toBe("px-2");
  });

  it("should handle empty inputs", () => {
    expect(cn()).toBe("");
    expect(cn("")).toBe("");
  });

  it("should handle undefined and null values", () => {
    expect(cn("base", undefined, null, "end")).toBe("base end");
  });

  it("should handle array inputs", () => {
    expect(cn(["px-4", "py-2"])).toBe("px-4 py-2");
  });

  it("should handle object inputs", () => {
    const result = cn({ "bg-blue-500": true, "text-white": true, hidden: false });
    expect(result).toBe("bg-blue-500 text-white");
  });

  it("should resolve complex Tailwind conflicts", () => {
    const result = cn(
      "text-red-500 bg-blue-500 p-4",
      "text-green-600 p-8"
    );
    expect(result).toBe("bg-blue-500 text-green-600 p-8");
  });
});
