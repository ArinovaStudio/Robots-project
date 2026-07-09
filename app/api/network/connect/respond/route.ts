import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const respondSchema = z.object({
  connectionId: z.string().min(1, "Connection ID is required"),
  action: z.enum(["ACCEPTED", "REJECTED"]),
});

export async function POST(req: NextRequest) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user){
        return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = respondSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, message: validation.error.issues[0].message }, { status: 400 });
    }

    const { connectionId, action } = validation.data;

    const connection = await prisma.connection.findUnique({ where: { id: connectionId } });
    if (!connection) {
      return NextResponse.json({ success: false, message: "Connection request not found" }, { status: 404 });
    }

    if (connection.receiverId !== user.id) {
      return NextResponse.json({ success: false, message: "Unauthorized to respond to this request" }, { status: 403 });
    }

    if (connection.status !== "PENDING") {
      return NextResponse.json({ success: false, message: `Request is already ${connection.status.toLowerCase()}` }, { status: 400 });
    }

    await prisma.connection.update({
      where: { id: connectionId },
      data: { status: action }
    });

    return NextResponse.json({ success: true, message: `Connection request ${action.toLowerCase()} successfully` }, { status: 200 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}