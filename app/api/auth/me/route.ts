import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { user, error } = await getUser();

    if (error || !user) {
      return NextResponse.json( { success: false, message: error || "Unauthorized" }, { status: 401 } );
    }

    const existingUser = await prisma.user.findUnique({ where: { id: user.id }, include: { company: true} });
    if (!existingUser) {
      return NextResponse.json( { success: false, message: "User not found" }, { status: 404 } );
    }

    const { password, ...safeUserData } = existingUser;

    return NextResponse.json({ success: true, data: safeUserData }, { status: 200 });

  } catch {
    return NextResponse.json( { success: false, message: "Internal server error" }, { status: 500 } );
  }
}