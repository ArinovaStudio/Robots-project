import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://connecto.com";

  const content = `# Connecto
> Connecto is a B2B network where verified businesses discover, offer, and exchange services through AI-powered matching.

## Key Pages
- [Home](${baseUrl}/): Overview of Connecto B2B network platform.
- [B2B Directory](${baseUrl}/directory): Browse verified companies, suppliers, and service providers.
- [B2B Marketplace](${baseUrl}/marketplace): Find AI-matched service buyers and suppliers.
- [Business Collaboration](${baseUrl}/collaborate): Discover synergistic business partners.
- [Investor Matchmaking](${baseUrl}/investors): Pitch angel investors and VC funding networks.

## Core Capabilities
- AI Vector Matching: Match business needs with verified service offerings.
- Verification Workflow: ID and document verification for trusted B2B operations.
- Direct Messaging & Collaboration: In-platform secure communication and networking.
`;

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
