import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scoreInvestors } from "@/lib/investor-match-score";

export async function GET(req: NextRequest) {
  try {
    const { user: viewer } = await getUser().catch(() => ({ user: null }));
    const sp = new URL(req.url).searchParams;
    const q = (sp.get("q") || "").trim();
    const stage = sp.get("stage"); // pre-seed | seed | series a | series b+
    const type = sp.get("type");
    const sector = sp.get("sector");
    const range = sp.get("range");

    // Per-viewer state: who they're connected to, and who they've hidden/blocked (or been blocked by)
    type ConnState = "CONNECTED" | "PENDING" | "INCOMING";
    const connectionMap = new Map<string, { status: ConnState; connectionId: string }>();
    const excludedIds = new Set<string>();
    if (viewer?.id) {
      try {
        const [hidden, blocks, connections] = await Promise.all([
          prisma.hiddenInvestor.findMany({ where: { userId: viewer.id }, select: { investorUserId: true } }),
          prisma.userBlock.findMany({
            where: { OR: [{ blockerId: viewer.id }, { blockedId: viewer.id }] },
            select: { blockerId: true, blockedId: true },
          }),
          prisma.connection.findMany({
            where: { OR: [{ senderId: viewer.id }, { receiverId: viewer.id }], status: { in: ["PENDING", "ACCEPTED"] } },
            select: { id: true, senderId: true, receiverId: true, status: true },
          }),
        ]);
        hidden.forEach((h) => excludedIds.add(h.investorUserId));
        blocks.forEach((b) => excludedIds.add(b.blockerId === viewer.id ? b.blockedId : b.blockerId));
        connections.forEach((c) => {
          const otherId = c.senderId === viewer.id ? c.receiverId : c.senderId;
          const status: ConnState =
            c.status === "ACCEPTED" ? "CONNECTED" : c.senderId === viewer.id ? "PENDING" : "INCOMING";
          connectionMap.set(otherId, { status, connectionId: c.id });
        });
      } catch (err) {
        console.warn("Viewer relationship lookup skipped:", (err as Error)?.message);
      }
    }

    const investorFilter: any = { AND: [] as any[] };
    if (stage) investorFilter.AND.push({ stages: { has: stage } });
    if (type) investorFilter.AND.push({ investorType: { equals: type, mode: "insensitive" } });
    if (sector) investorFilter.AND.push({ sectors: { has: sector } });
    if (range) investorFilter.AND.push({ investmentRange: range });

    const rows = await prisma.user.findMany({
      where: {
        accountType: "INVESTOR",
        status: "ACTIVE",
        ...(viewer?.id ? { id: { notIn: [viewer.id, ...excludedIds] } } : {}),
        investor: { is: investorFilter },
        ...(q
          ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { investor: { is: { firmName: { contains: q, mode: "insensitive" } } } }] }
          : {}),
      },
      take: 30,
      orderBy: [{ verificationStatus: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        image: true,
        verificationStatus: true,
        investor: true,
        _count: { select: { sentConnections: { where: { status: "ACCEPTED" } }, receivedConnections: { where: { status: "ACCEPTED" } } } },
      },
    });

    // Portfolio records live in the raw "InvestorInvestment" table (not in the Prisma schema)
    const portfolioCounts = new Map<string, number>();
    if (rows.length > 0) {
      try {
        const ids = rows.map((r) => r.id);
        const counts = await prisma.$queryRaw<{ investorId: string; count: bigint }[]>`
          SELECT "investorId", COUNT(*) AS count
          FROM "InvestorInvestment"
          WHERE "investorId" = ANY(${ids})
          GROUP BY "investorId"
        `;
        counts.forEach((c) => portfolioCounts.set(c.investorId, Number(c.count)));
      } catch (err) {
        // table is created lazily by /api/investor/investments; no table means no records yet
        console.warn("Portfolio count lookup skipped:", (err as Error)?.message);
      }
    }

    // Investor viewers are scored against other investors (i2i collaboration);
    // business viewers are scored on how well they fit each investor.
    const viewerInvestor = viewer?.id
      ? await prisma.investorProfile.findUnique({ where: { userId: viewer.id } })
      : null;
    const business = viewer?.id && !viewerInvestor
      ? await prisma.companyProfile.findUnique({ where: { userId: viewer.id } })
      : null;

    const viewerSignals =
      viewerInvestor
        ? ({
            kind: "investor",
            userId: viewerInvestor.userId,
            updatedAt: viewerInvestor.updatedAt,
            investorType: viewerInvestor.investorType,
            sectors: viewerInvestor.sectors,
            stages: viewerInvestor.stages,
            investmentRange: viewerInvestor.investmentRange,
            investmentThesis: viewerInvestor.investmentThesis || "",
            industriesInvested: viewerInvestor.industriesInvested,
          } as const)
        : business
        ? ({
            kind: "business",
            userId: business.userId,
            updatedAt: business.updatedAt,
            description: business.description,
            type: business.type,
            dealIn: business.dealIn,
            lookingFor: business.lookingFor,
          } as const)
        : null;

    const scores = await scoreInvestors(
      viewerSignals,
      rows
        .filter((r) => r.investor)
        .map((r) => ({
          userId: r.id,
          updatedAt: r.investor!.updatedAt,
          sectors: r.investor!.sectors,
          stages: r.investor!.stages,
          investmentRange: r.investor!.investmentRange,
          investmentThesis: r.investor!.investmentThesis || "",
          industriesInvested: r.investor!.industriesInvested,
        }))
    );

    const data = rows
      .filter((r) => r.investor)
      .map((r) => {
        const inv = r.investor!;
        return {
          id: r.id,
          name: inv.firmName || r.name || "Investor",
          image: r.image,
          verified: r.verificationStatus === "VERIFIED",
          investorType: inv.investorType,
          location: inv.city ? `${inv.city}${inv.country ? `, ${inv.country}` : ""}` : inv.location || null,
          sectors: inv.sectors,
          stages: inv.stages,
          investmentRange: inv.investmentRange,
          bio: inv.investmentThesis || null,
          portfolioCount: portfolioCounts.get(r.id) ?? inv.previousInvestmentCount ?? inv.previousStartups.length,
          connections: r._count.sentConnections + r._count.receivedConnections,
          matchScore: scores.get(r.id) ?? null,
          connectionStatus: connectionMap.get(r.id)?.status ?? "NONE",
          connectionId: connectionMap.get(r.id)?.connectionId ?? null,
        };
      })
      .sort((a, b) => (b.matchScore ?? -1) - (a.matchScore ?? -1));

    return NextResponse.json({
      success: true,
      data,
      meta: {
        scored: !!viewerSignals,
        reason: !viewer ? "not-logged-in" : !viewerSignals ? "no-profile" : null,
      },
    });
  } catch (error) {
    console.error("Failed to fetch investor directory:", error);
    return NextResponse.json({ success: false, data: [] }, { status: 500 });
  }
}