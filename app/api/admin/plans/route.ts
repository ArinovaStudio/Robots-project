import { NextRequest, NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const planSchema = z.object({
  name: z.string().min(1, "Plan name is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price cannot be negative"),
  duration: z.number().min(1, "Duration must be at least 1 day"),
  isActive: z.boolean().optional().default(true),
  givesBoost: z.boolean().optional().default(true),
});

export async function POST(req: NextRequest) {
  try {
    const { user, error } = await getAdmin();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const validation = planSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json( { success: false, message: validation.error.issues[0].message }, { status: 400 });
    }

    const data = validation.data;

    const existingPlan = await prisma.plan.findFirst({ where: { name: data.name } });
    if (existingPlan) {
      return NextResponse.json({ success: false, message: "Plan with this name already exists" }, { status: 400 });
    }

    await prisma.plan.create({
      data: {
        name: data.name,
        description: data.description || "",
        price: data.price,
        duration: data.duration,
        isActive: data.isActive,
        givesBoost: data.givesBoost
      }
    });

    return NextResponse.json({ success: true, message: "Plan created successfully" }, { status: 201 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}