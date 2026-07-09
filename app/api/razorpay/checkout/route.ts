import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { razorpay } from "@/lib/razorpay";
import { z } from "zod";

const checkoutSchema = z.object({
  planId: z.string().min(1, "Plan ID is required"),
});

export async function POST(req: NextRequest) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user){
        return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const validation = checkoutSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ success: false, message: validation.error.issues[0].message }, { status: 400 });
    }

    const { planId } = validation.data;

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive) {
      return NextResponse.json({ success: false, message: "Invalid or inactive plan" }, { status: 400 });
    }

    const shortUserId = user.id.substring(0, 8);
    
    const orderOptions = {
      amount: Math.round(plan.price * 100), 
      currency: "INR",
      receipt: `rcpt_${shortUserId}_${Date.now()}`,
    };

    const order = await razorpay.orders.create(orderOptions);

    await prisma.transaction.create({
      data: {
        userId: user.id,
        planId: plan.id,
        amount: plan.price,
        razorpayOrderId: order.id,
        status: "PENDING",
      }
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    }, { status: 200 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}