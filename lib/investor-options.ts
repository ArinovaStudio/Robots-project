export const INVESTOR_TYPES = [
  "Individual / Angel Investor",
  "Startup Founder who also invests",
  "Venture Capital (VC) Firm",
  "Private Equity (PE) Firm",
  "Family Office",
  "Corporate Investor / CVC",
  "Investment Fund",
  "Other institutional investor",
] as const;

export const ORGANIZATION_INVESTOR_TYPES = INVESTOR_TYPES.slice(2);

export const INVESTMENT_STAGES = [
  "Pre-seed",
  "Seed",
  "Series A",
  "Series B+",
] as const;

export const INVESTMENT_RANGES = [
  "Under 25k",
  "25k–100k",
  "100k–500k",
  "500k–1m",
  "1m+",
] as const;

export const CAPITAL_RANGES = [
  "Under 100k",
  "100k–500k",
  "500k–1m",
  "1m–5m",
  "5m–25m",
  "25m+",
] as const;

export const ENTITY_TYPES = [
  "Company",
  "Limited liability company",
  "Partnership",
  "Limited partnership",
  "Trust",
  "Other",
] as const;

export const INVESTMENT_FREQUENCIES = [
  "Occasional",
  "Quarterly",
  "Monthly",
] as const;

export const INVESTMENT_STRUCTURES = [
  "Equity",
  "Convertible instruments",
  "SAFE",
  "Debt",
  "Other",
] as const;


export const COLLABORATION_TYPES = [
  "Co-Investment Opportunities",
  "Investment Deal Sharing",
  "Portfolio Diversification",
  "Joint Due Diligence",
  "Market Research & Analysis",
  "Knowledge & Expertise Exchange",
  "Strategic Investor Networking",
] as const;

export const DEAL_STAGES = ["Pre-seed", "Seed", "Series A", "Series B+"] as const;

// Optional document slots on the investor collaboration form (keep sizes in sync with the API route)
export const COLLABORATION_DOCUMENTS = [
  { key: "pitchDeck", label: "Pitch Deck", hint: "PDF · ≤ 120 MB", maxMb: 120, exts: [".pdf"] },
  { key: "businessPlan", label: "Business Plan", hint: "PDF · ≤ 50 MB", maxMb: 50, exts: [".pdf"] },
  { key: "financials", label: "Financials", hint: "PDF/XLSX · ≤ 50 MB", maxMb: 50, exts: [".pdf", ".xlsx"] },
  { key: "otherDocuments", label: "Other Documents", hint: "PDF/ZIP · ≤ 50 MB", maxMb: 50, exts: [".pdf", ".zip"] },
] as const;
