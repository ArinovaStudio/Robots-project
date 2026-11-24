import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ pitchId: string }> }
) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json(
        { success: false, message: error || "Unauthorized" },
        { status: 401 }
      );
    }

    const { pitchId } = await params;

    const result = await prisma.$transaction(async (tx) => {
      const pitch = await tx.companyPitch.findFirst({
        where: { id: pitchId, userId: user.id },
      });

      if (!pitch) {
        return { kind: "not_found" as const };
      }

      if (pitch.isSharedWithCompanies) {
        return { kind: "already_shared" as const };
      }

      const sector = pitch.sector?.trim() || "Tech";
      const cleanSectorTag = sector.replace(/[^a-zA-Z0-9]/g, "") || "Tech";

      const postContent = [
        "🚀 Looking for Building Partners & Collaboration!",
        "",
        `💡 Project Idea: ${pitch.title}`,
        pitch.tagline ? `"${pitch.tagline}"` : "",
        "",
        pitch.summary,
        "",
        "🤝 We are seeking passionate companies, founders, and teams to help build and co-develop this project. If your business can provide technical, operational, or design support, let's connect and build together!",
        "",
        `#Collaboration #BuildingTogether #${cleanSectorTag}`,
      ]
        .filter((line, idx, arr) => !(line === "" && arr[idx - 1] === ""))
        .join("\n");

      const newPost = await tx.post.create({
        data: {
          authorId: user.id,
          content: postContent,
        },
      });

      const newCollab = await tx.collaborationRequest.create({
        data: {
          authorId: user.id,
          title: `Looking for partners: ${pitch.title}`,
          description: pitch.summary,
          tags: [sector, "Co-building", "Partnership"],
          status: "OPEN",
        },
      });

      await tx.companyPitch.update({
        where: { id: pitch.id },
        data: {
          isSharedWithCompanies: true,
          feedPostId: newPost.id,
          collabRequestId: newCollab.id,
        },
      });

      return {
        kind: "created" as const,
        feedPostId: newPost.id,
        collabRequestId: newCollab.id,
      };
    });

    if (result.kind === "not_found") {
      return NextResponse.json(
        { success: false, message: "Pitch not found." },
        { status: 404 }
      );
    }

    if (result.kind === "already_shared") {
      return NextResponse.json({
        success: true,
        message: "Pitch is already published.",
      });
    }

    return NextResponse.json({
      success: true,
      message:
        "Pitch successfully published to community feed for company collaboration!",
      data: {
        feedPostId: result.feedPostId,
        collabRequestId: result.collabRequestId,
      },
    });
  } catch (err) {
    console.error("Failed to share pitch for collaboration:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ pitchId: string }> }
) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json(
        { success: false, message: error || "Unauthorized" },
        { status: 401 }
      );
    }

    const { pitchId } = await params;

    const status = await prisma.$transaction(async (tx) => {
      const pitch = await tx.companyPitch.findFirst({
        where: { id: pitchId, userId: user.id },
        select: {
          id: true,
          isSharedWithCompanies: true,
          feedPostId: true,
          collabRequestId: true,
        },
      });

      if (!pitch) {
        return "not_found" as const;
      }

      if (!pitch.isSharedWithCompanies) {
        return "already_unpublished" as const;
      }

      if (pitch.feedPostId) {
        await tx.post.updateMany({
          where: { id: pitch.feedPostId, authorId: user.id },
          data: { status: "SUSPENDED" },
        });
      }

      if (pitch.collabRequestId) {
        await tx.collaborationRequest.updateMany({
          where: { id: pitch.collabRequestId, authorId: user.id },
          data: { status: "CLOSED" },
        });
      }

      await tx.companyPitch.update({
        where: { id: pitch.id },
        data: {
          isSharedWithCompanies: false,
          feedPostId: null,
          collabRequestId: null,
        },
      });

      return "unpublished" as const;
    });

    if (status === "not_found") {
      return NextResponse.json(
        { success: false, message: "Pitch not found." },
        { status: 404 }
      );
    }

    if (status === "already_unpublished") {
      return NextResponse.json({
        success: true,
        message: "Pitch is already unpublished.",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Pitch unpublished successfully.",
    });
  } catch (err) {
    console.error("Failed to unpublish pitch:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}