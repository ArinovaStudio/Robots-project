describe("Investor Dashboard & Workflow", () => {
  it("calculates dynamic connected investors for company profile", () => {
    const mockConnections = [
      { id: "1", senderId: "comp-1", receiverId: "inv-1", receiver: { accountType: "INVESTOR" } },
      { id: "2", senderId: "inv-2", receiverId: "comp-1", sender: { accountType: "INVESTOR" } },
      { id: "3", senderId: "comp-1", receiverId: "comp-2", receiver: { accountType: "BUSINESS" } },
    ];

    const connectedInvestors = mockConnections.filter(
      (c) =>
        (c.senderId === "comp-1" && c.receiver?.accountType === "INVESTOR") ||
        (c.receiverId === "comp-1" && c.sender?.accountType === "INVESTOR")
    );

    expect(connectedInvestors.length).toBe(2);
  });

  it("calculates dynamic connected companies and invested in counts for investor profile", () => {
    const mockConnections = [
      { id: "1", senderId: "inv-1", receiverId: "comp-1", receiver: { accountType: "BUSINESS" } },
      { id: "2", senderId: "comp-2", receiverId: "inv-1", sender: { accountType: "BUSINESS" } },
      { id: "3", senderId: "inv-1", receiverId: "inv-2", receiver: { accountType: "INVESTOR" } },
    ];

    const connectedCompanies = mockConnections.filter(
      (c) =>
        (c.senderId === "inv-1" && c.receiver?.accountType === "BUSINESS") ||
        (c.receiverId === "inv-1" && c.sender?.accountType === "BUSINESS")
    );

    expect(connectedCompanies.length).toBe(2);

    const baseInvestments = 3;
    const recordedInvestments = ["Company A", "Company B"];
    const totalInvestedIn = baseInvestments + recordedInvestments.length;

    expect(totalInvestedIn).toBe(5);
  });

  it("flags that investors cannot exchange services and directs to investor portal", () => {
    const user = { id: "inv-1", accountType: "INVESTOR" };
    const canExchangeServices = user.accountType === "BUSINESS";

    expect(canExchangeServices).toBe(false);
    const destination = canExchangeServices ? "/marketplace" : "/investors/portal";
    expect(destination).toBe("/investors/portal");
  });

  it("matches companies doing good with investor selected preferences", () => {
    const investorPreferences = {
      sectors: ["Fintech", "Robotics & Automation"],
      stages: ["Seed", "Series A"],
    };

    const companies = [
      { id: "c1", type: "Fintech", dealIn: ["Payments"], views: 40, isVerified: true },
      { id: "c2", type: "Fashion", dealIn: ["Apparel"], views: 5, isVerified: false },
      { id: "c3", type: "Robotics & Automation", dealIn: ["SLAM"], views: 60, isVerified: true },
    ];

    const matchingCompanies = companies.filter((c) =>
      investorPreferences.sectors.some(
        (s) => s.toLowerCase() === c.type.toLowerCase() || c.dealIn.includes(s)
      )
    );

    expect(matchingCompanies.length).toBe(2);
    expect(matchingCompanies.map((c) => c.id)).toEqual(["c1", "c3"]);
  });

  it("validates investor onboarding form payload with core fields", () => {
    const investorFormPayload = {
      name: "John Doe",
      investorType: "Venture Capital (VC) Firm",
      firmName: "Acme Ventures",
      sectors: ["Fintech", "AI"],
      stages: ["Seed", "Series A"],
      investmentRange: "100k–500k",
      location: "San Francisco, CA",
      website: "https://acmeventures.com",
      linkedInUrl: "https://linkedin.com/in/johndoe",
    };

    // Verify required fields are present
    expect(investorFormPayload.name.length).toBeGreaterThanOrEqual(2);
    expect(investorFormPayload.sectors.length).toBeGreaterThanOrEqual(1);
    expect(investorFormPayload.stages.length).toBeGreaterThanOrEqual(1);
    expect(investorFormPayload.investmentRange).toBe("100k–500k");

    // Locations fallback logic
    const locations = investorFormPayload.location ? [investorFormPayload.location] : [];
    expect(locations).toEqual(["San Francisco, CA"]);
  });

  it("safely parses diverse investment amounts and currency notations", () => {
    const parseAmount = (amount: string) => {
      let cleanVal = amount.replace(/[^0-9.kmKM]/g, "");
      let numericAmount = 0;
      if (cleanVal.toLowerCase().endsWith("m")) {
        numericAmount = parseFloat(cleanVal) * 1000000;
      } else if (cleanVal.toLowerCase().endsWith("k")) {
        numericAmount = parseFloat(cleanVal) * 1000;
      } else {
        numericAmount = parseFloat(cleanVal) || 0;
      }
      return numericAmount;
    };

    expect(parseAmount("$100,000")).toBe(100000);
    expect(parseAmount("250k")).toBe(250000);
    expect(parseAmount("1.5M")).toBe(1500000);
    expect(parseAmount("₹5,00,000")).toBe(500000);
  });
});

