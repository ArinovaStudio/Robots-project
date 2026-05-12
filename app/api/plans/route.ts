import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { user } = await getUser();
    const isAdmin = user?.role === "ADMIN";

    const whereClause = isAdmin ? {} : { isActive: true };

    const plans = await prisma.plan.findMany({
      where: whereClause,
      orderBy: { price: 'asc' } 
    });

    return NextResponse.json({ success: true, data: plans }, { status: 200 });

  } catch {
    return NextResponse.json( { success: false, message: "Internal server error" }, { status: 500 } );
  }
}