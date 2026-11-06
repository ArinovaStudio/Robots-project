import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { getMatches } from "@/lib/match";
import { prisma } from "@/lib/prisma";

const VALID_SLUGS = ["similar", "suggested", "suppliers", "buyers"] as const;
type MatchSlug = (typeof VALID_SLUGS)[number];

export async function GET( req: NextRequest, { params }: { params: Promise<{ slug: string }> } ) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json( { success: false, message: error || "Unauthorized" }, { status: 401 } );
    }

    const { slug } = await params;
    
    if (!VALID_SLUGS.includes(slug as MatchSlug)) {
      return NextResponse.json( { success: false, message: "Invalid match type" }, { status: 400 } );
    }

    const sourceParam = req.nextUrl.searchParams.get("source");
    const source: "overall" | "posts" | "profile" =
      sourceParam === "posts" || sourceParam === "profile" ? sourceParam : "overall";

    const [matches, hiddenRows] = await Promise.all([
      getMatches(user.id, slug as MatchSlug, source),
      prisma.hiddenCompany.findMany({ where: { userId: user.id }, select: { companyUserId: true } }),
    ]);

    // Drop businesses the viewer chose to hide
    const hiddenIds = new Set(hiddenRows.map((h) => h.companyUserId));
    const visible = matches.filter((m: any) => !hiddenIds.has(m.userId));

    return NextResponse.json({ success: true, data: visible }, { status: 200 });

  } catch {
    return NextResponse.json( { success: false, message: "Internal server error" }, { status: 500 } );
  }
}