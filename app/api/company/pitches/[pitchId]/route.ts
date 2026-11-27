import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ pitchId: string }> }
) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json(
        { success: false, message: error || "Unauthorized." },
        { status: 401 }
      );
    }

    if (user.accountType !== "BUSINESS") {
      return NextResponse.json(
        { success: false, message: "Only business accounts can delete company pitches." },
        { status: 403 }
      );
    }

    const { pitchId } = await params;
    if (!pitchId) {
      return NextResponse.json(
        { success: false, message: "Pitch ID is required." },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const pitch = await tx.companyPitch.findFirst({
        where: { id: pitchId, userId: user.id },
        select: {
          id: true,
          feedPostId: true,
          collabRequestId: true,
        },
      });

      if (!pitch) return "not_found" as const;

      // Retire the public collaboration artifacts before deleting the pitch.
      // These IDs are only acted on when they belong to the current user.
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

      // Related views, offers, and ratings are removed by the schema's
      // onDelete: Cascade relations on CompanyPitch.
      await tx.companyPitch.delete({ where: { id: pitch.id } });
      return "deleted" as const;
    });

    if (result === "not_found") {
      return NextResponse.json(
        { success: false, message: "Pitch not found or you do not have permission to delete it." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Pitch deleted successfully.",
    });
  } catch (error) {
    console.error("Failed to delete company pitch:", error);
    return NextResponse.json(
      { success: false, message: "Could not delete this pitch. Please try again." },
      { status: 500 }
    );
  }
}
