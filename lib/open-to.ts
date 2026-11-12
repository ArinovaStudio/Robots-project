export const OPEN_TO_OPTIONS = [
  { label: "Open to Projects", short: "#PROJECTS", description: "Accepting new client projects." },
  { label: "Open to Investment", short: "#FUNDING", description: "Seeking investors or funding." },
  { label: "Open to Partnerships", short: "#PARTNERS", description: "Looking for business or technology partners." },
  { label: "Open to Hiring", short: "#HIRING", description: "Recruiting employees or interns." },
  { label: "Open to Collaborations", short: "#COLLAB", description: "Interested in B2B collaborations." },
] as const;

export const OPEN_TO_LABELS = new Set<string>(OPEN_TO_OPTIONS.map((opt) => opt.label));

export function getActiveOpenTo(items: unknown): string | null {
  if (!Array.isArray(items)) return null;
  return (items.find((i) => typeof i === "string" && OPEN_TO_LABELS.has(i)) as string) ?? null;
}