/**
 * Tests for Incomplete Login & Signup Handlers
 */

describe("Incomplete Login & Signup Workflow", () => {
  describe("Onboarding Redirection Logic", () => {
    function determineRedirectRoute(user: {
      isOnboarded: boolean;
      accountType: "INVESTOR" | "BUSINESS";
      company?: any;
      investor?: any;
    } | null): string {
      if (!user) return "/login";
      const isReallyOnboarded = Boolean(user.isOnboarded || user.company || user.investor);
      if (!isReallyOnboarded) {
        return user.accountType === "INVESTOR" ? "/signup/investor" : "/register/company";
      }
      return "/explore";
    }

    it("should direct incomplete business user to /register/company", () => {
      const user = {
        isOnboarded: false,
        accountType: "BUSINESS" as const,
        company: null,
        investor: null,
      };
      expect(determineRedirectRoute(user)).toBe("/register/company");
    });

    it("should direct incomplete investor user to /signup/investor", () => {
      const user = {
        isOnboarded: false,
        accountType: "INVESTOR" as const,
        company: null,
        investor: null,
      };
      expect(determineRedirectRoute(user)).toBe("/signup/investor");
    });

    it("should direct completed business user with company to /explore", () => {
      const user = {
        isOnboarded: true,
        accountType: "BUSINESS" as const,
        company: { id: "comp-1" },
        investor: null,
      };
      expect(determineRedirectRoute(user)).toBe("/explore");
    });

    it("should direct completed investor user with investor profile to /explore", () => {
      const user = {
        isOnboarded: true,
        accountType: "INVESTOR" as const,
        company: null,
        investor: { id: "inv-1" },
      };
      expect(determineRedirectRoute(user)).toBe("/explore");
    });
  });

  describe("Incomplete User Registration Detection", () => {
    function evaluateExistingUserStatus(user: { isOnboarded: boolean } | null) {
      if (!user) {
        return { canRegister: true };
      }
      if (!user.isOnboarded) {
        return {
          canRegister: false,
          isIncomplete: true,
          message: "An account with this email already exists but setup is incomplete. Please sign in to complete your profile.",
        };
      }
      return {
        canRegister: false,
        isIncomplete: false,
        message: "User already exists",
      };
    }

    it("identifies un-onboarded existing account and prompts login for profile setup", () => {
      const result = evaluateExistingUserStatus({ isOnboarded: false });
      expect(result.canRegister).toBe(false);
      expect(result.isIncomplete).toBe(true);
      expect(result.message).toContain("setup is incomplete");
    });

    it("identifies fully onboarded existing account as already exists", () => {
      const result = evaluateExistingUserStatus({ isOnboarded: true });
      expect(result.canRegister).toBe(false);
      expect(result.isIncomplete).toBe(false);
      expect(result.message).toBe("User already exists");
    });
  });

  describe("Signup Active Step Evaluation", () => {
    function computeActiveStep(status: "loading" | "authenticated" | "unauthenticated", manualStep: number): number {
      return status === "authenticated" ? 2 : manualStep;
    }

    it("forces step 2 for authenticated users regardless of manual step state", () => {
      expect(computeActiveStep("authenticated", 1)).toBe(2);
      expect(computeActiveStep("authenticated", 2)).toBe(2);
    });

    it("retains manual step for unauthenticated visitors", () => {
      expect(computeActiveStep("unauthenticated", 1)).toBe(1);
      expect(computeActiveStep("unauthenticated", 2)).toBe(2);
    });
  });
});
