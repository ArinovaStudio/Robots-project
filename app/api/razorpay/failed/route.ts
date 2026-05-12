import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user){
        return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { razorpay_order_id } = await req.json();

    if (!razorpay_order_id) {
      return NextResponse.json({ success: false, message: "Order ID required" }, { status: 400 });
    }

    await prisma.transaction.update({
      where: { razorpayOrderId: razorpay_order_id },
      data: { status: "FAILED" }
    });

    return NextResponse.json({ success: true, message: "Payment failure" }, { status: 200 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}