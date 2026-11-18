import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Block a user. Also drops any connection / pending request between the two. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { userId: blockedId } = await params;
    if (blockedId === user.id) {
      return NextResponse.json({ success: false, message: "You can't block yourself" }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { id: blockedId }, select: { id: true } });
    if (!target) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.userBlock.upsert({
        where: { blockerId_blockedId: { blockerId: user.id, blockedId } },
        create: { blockerId: user.id, blockedId },
        update: {},
      }),
      prisma.notification.deleteMany({
        where: {
          type: "CONNECTION_REQUEST",
          OR: [
            { userId: user.id, actorId: blockedId },
            { userId: blockedId, actorId: user.id },
          ],
        },
      }),
      prisma.connection.deleteMany({
        where: {
          OR: [
            { senderId: user.id, receiverId: blockedId },
            { senderId: blockedId, receiverId: user.id },
          ],
        },
      }),
    ]);

    return NextResponse.json({ success: true, message: "Investor blocked" }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

/** Unblock. */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { userId: blockedId } = await params;
    await prisma.userBlock.deleteMany({ where: { blockerId: user.id, blockedId } });

    return NextResponse.json({ success: true, message: "Investor unblocked" });
  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
