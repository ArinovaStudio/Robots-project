import { prisma } from "@/lib/prisma";

/**
 * Automatically connects two users (ACCEPTED status) and creates mutual follows.
 * Used when a collaboration or investment request is accepted between two users.
 */
export async function autoConnectUsers(userA: string, userB: string) {
  if (!userA || !userB || userA === userB) return;

  try {
    const existing = await prisma.connection.findFirst({
      where: {
        OR: [
          { senderId: userA, receiverId: userB },
          { senderId: userB, receiverId: userA },
        ],
      },
    });

    if (!existing) {
      await prisma.connection.create({
        data: {
          senderId: userA,
          receiverId: userB,
          status: "ACCEPTED",
        },
      });
    } else if (existing.status !== "ACCEPTED") {
      await prisma.connection.update({
        where: { id: existing.id },
        data: { status: "ACCEPTED" },
      });
    }

    // Ensure mutual follow as connected profiles are automatically followed
    await prisma.follow.createMany({
      data: [
        { followerId: userA, followingId: userB },
        { followerId: userB, followingId: userA },
      ],
      skipDuplicates: true,
    });
  } catch (err) {
    console.error("autoConnectUsers error:", err);
  }
}
