import { NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const followSchema = z.object({
  targetUserId: z.string().min(1, "Target User ID is required"),
});

export async function POST(req: Request) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = followSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, message: validation.error.issues[0].message }, { status: 400 });
    }

    const { targetUserId } = validation.data;

    if (user.id === targetUserId) {
      return NextResponse.json({ success: false, message: "You cannot follow yourself" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      return NextResponse.json({ success: false, message: "Target user not found" }, { status: 404 });
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId: user.id, followingId: targetUserId }
      }
    });

    if (existingFollow) {
      // unfollow
      await prisma.follow.delete({ where: { id: existingFollow.id } });
      return NextResponse.json({ success: true, message: "Unfollowed successfully", isFollowing: false });

    } else {
      // follow
      await prisma.follow.create({
        data: {
          followerId: user.id,
          followingId: targetUserId,
        }
      });

      return NextResponse.json({ success: true, message: "Followed successfully", isFollowing: true });
    }

  } catch {
    return NextResponse.json( { success: false, message: "Internal server error" }, { status: 500 } );
  }
}