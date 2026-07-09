import { NextRequest, NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { getUserStatusEmail } from "@/lib/template";

const statusSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED"])
});

export async function PATCH( req: NextRequest, { params }: { params: Promise<{ id: string }> } ) {
  try {
    const { user, error } = await getAdmin();
    if (error || !user) { 
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

    if (user.user.id === id) {
      return NextResponse.json({ success: false, message: "You cannot suspend your own account" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const validation = statusSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json( { success: false, message: validation.error.issues[0].message }, { status: 400 } );
    }

    const action = validation.data.status;
    await prisma.user.update({ where: { id }, data: { status: action } });

    if (existingUser.email){
      sendEmail({
        to: existingUser.email, 
        subject: action === "SUSPENDED" ? "Important: Your account has been suspended" : "Update: Your account is now active",
        html: getUserStatusEmail(existingUser.name || "User", action)
      });
    }

    return NextResponse.json({ success: true, message: `User account is ${action.toLowerCase()}` }, { status: 200 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}