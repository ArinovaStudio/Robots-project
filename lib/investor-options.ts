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
