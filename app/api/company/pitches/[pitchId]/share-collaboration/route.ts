import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ pitchId: string }> }
) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { pitchId } = await params;

    const pitches = await prisma.$queryRaw<any[]>`
      SELECT * FROM "CompanyPitch" WHERE id = ${pitchId} AND "userId" = ${user.id} LIMIT 1
    `;

    if (!pitches || pitches.length === 0) {
      return NextResponse.json({ success: false, message: "Pitch not found." }, { status: 404 });
    }

    const pitch = pitches[0];

    // Create a public feed post for community collaboration
    const cleanSectorTag = (pitch.sector || "Tech").replace(/[^a-zA-Z0-9]/g, "");
    const postContent = `🚀 Looking for Building Partners & Collaboration!\n\n💡 Project Idea: ${pitch.title}\n${pitch.tagline ? `"${pitch.tagline}"\n` : ""}\n${pitch.summary}\n\n🤝 We are seeking passionate companies, founders, and teams to help build and co-develop this project. If your business can provide technical, operational, or design support, let's connect and build together!\n\n#Collaboration #BuildingTogether #${cleanSectorTag}`;

    const [post, collab] = await prisma.$transaction(async (tx) => {
      const newPost = await tx.post.create({
        data: {
          authorId: user.id,
          content: postContent,
        }
      });

      const newCollab = await tx.collaborationRequest.create({
        data: {
          authorId: user.id,
          title: `Looking for partners: ${pitch.title}`,
          description: pitch.summary,
          tags: [pitch.sector, "Co-building", "Partnership"],
          status: "OPEN"
        }
      });

      await tx.$executeRawUnsafe(
        `UPDATE "CompanyPitch"
         SET "isSharedWithCompanies" = true,
             "feedPostId" = $1,
             "collabRequestId" = $2
         WHERE id = $3`,
        newPost.id,
        newCollab.id,
        pitch.id
      );

      return [newPost, newCollab];
    });

    return NextResponse.json({
      success: true,
      message: "Pitch successfully published to community feed for company collaboration!",
      data: {
        feedPostId: post.id,
        collabRequestId: collab.id
      }
    });

  } catch (error) {
    console.error("Failed to share pitch for collaboration:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
