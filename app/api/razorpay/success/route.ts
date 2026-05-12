import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user){
        return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ success: false, message: "Missing payment details" }, { status: 400 });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body.toString()).digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ success: false, message: "Invalid payment signature" }, { status: 400 });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { razorpayOrderId: razorpay_order_id },
      include: { plan: true }
    });

    if (!transaction || transaction.status !== "PENDING") {
      return NextResponse.json({ success: false, message: "Transaction not found or already processed" }, { status: 400 });
    }

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + transaction.plan.duration);

    await prisma.$transaction([

      prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: "SUCCESS",
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
        }
      }),

      prisma.subscription.create({
        data: {
          userId: user.id,
          planId: transaction.planId,
          status: "ACTIVE",
          endDate: endDate,
        }
      }),

      ...(transaction.plan.givesBoost ? [
        prisma.companyProfile.update({
          where: { userId: user.id },
          data: { isBoosted: true }
        })
      ] : [])
    ]);

    return NextResponse.json({ success: true, message: "Payment verified and plan activated" });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}