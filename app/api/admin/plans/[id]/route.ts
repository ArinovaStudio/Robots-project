import { NextRequest, NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updatePlanSchema = z.object({
  name: z.string().min(1, "Plan name cannot be empty").optional(),
  description: z.string().optional(),
  price: z.number().min(0, "Price cannot be negative").optional(),
  duration: z.number().min(1, "Duration must be at least 1 day").optional(),
  isActive: z.boolean().optional(),
  givesBoost: z.boolean().optional(),
});

export async function PUT( req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await getAdmin();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const validation = updatePlanSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json( { success: false, message: validation.error.issues[0].message }, { status: 400 });
    }

    const existingPlan = await prisma.plan.findUnique({ where: { id } });
    if (!existingPlan) {
      return NextResponse.json({ success: false, message: "Plan not found" }, { status: 404 });
    }

    await prisma.plan.update({
      where: { id },
      data: validation.data,
    });

    return NextResponse.json({ success: true, message: "Plan updated successfully" }, { status: 200 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE( req: NextRequest, { params }: { params: Promise<{ id: string }> } ) {
  try {
    const { user, error } = await getAdmin();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

    const existingPlan = await prisma.plan.findUnique({
      where: { id },
      include: { _count: { select: { subscriptions: true } } }
    });

    if (!existingPlan) {
      return NextResponse.json({ success: false, message: "Plan not found" }, { status: 404 });
    }

    if (existingPlan._count.subscriptions > 0) {
      await prisma.plan.update({ where: { id }, data: { isActive: false } });

      return NextResponse.json({
        success: true,
        message: "Plan has active users. It was successfully deactivated (hidden) instead of deleted",
        wasSoftDeleted: true
      });
      
    } else {
      await prisma.plan.delete({ where: { id } });

      return NextResponse.json({ success: true, message: "Plan permanently deleted.", wasSoftDeleted: false });
    }

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}