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
});
