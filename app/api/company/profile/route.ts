import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import { uploadImage, deleteFile } from "@/lib/uploads";
import { syncVectors } from "@/lib/embeddings";
import { startOfMonth } from "date-fns";

export async function GET() {
  try {
    const { user, error } = await getUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const monthStart = startOfMonth(new Date());

    const company = await prisma.companyProfile.findUnique({
      where: { userId: user.id },
      include: {
        user: {
          select: {
            _count: {
              select: {
                followers: true,
                receivedConnections: { where: { status: "ACCEPTED" } },
                sentConnections: { where: { status: "ACCEPTED" } }
              }
            }
          }
        }
      }
    });

    if (!company) {
      return NextResponse.json({ success: false, message: "Profile not found" }, { status: 404 });
    }

    const [viewsData, impressionsData] = await Promise.all([
      prisma.profileViewStat.aggregate({
        where: { companyId: company.id, date: { gte: monthStart } },
        _sum: { count: true }
      }),
      prisma.searchImpressionStat.aggregate({
        where: { companyId: company.id, date: { gte: monthStart } },
        _sum: { count: true }
      })
    ]);

    const profileViewers = viewsData._sum.count || 0;
    const impressions = impressionsData._sum.count || 0;
    const connectionsCount = company.user._count.receivedConnections + company.user._count.sentConnections;
    const followersCount = company.user._count.followers;

    return NextResponse.json({
      success: true,
      data: {
        ...company,
        profileViewers,
        impressions,
        connectionsCount,
        followersCount
      }
    }, { status: 200 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}

const profileSchema = z.object({
  companyName: z.string().min(2),
  description: z.string().min(10),
  size: z.coerce.number().int().positive(),
  type: z.string().min(2),
  yearOfEstablishment: z.coerce.number().int(),
  dealIn: z.array(z.string()),
  website: z.string().url().optional().or(z.literal("")),
  location: z.string().optional(),
  lookingFor: z.array(z.string()).optional().default([]),
});

export async function POST(req: NextRequest) {
  try {
    const { user, error } = await getUser();
    if (error || !user){
        return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    
    const dealIn = formData.getAll("dealIn").map(String);
    const lookingFor = formData.getAll("lookingFor").map(String);

    const validation = profileSchema.safeParse({
      ...Object.fromEntries(formData.entries()),
      dealIn,
      lookingFor
    });

    if (!validation.success) {
      return NextResponse.json({ success: false, message: validation.error.issues[0].message }, { status: 400 });
    }

    const logoFile = formData.get("logo") as File;
    let logoUrl = null;
    if (logoFile && logoFile.size > 0) {
      logoUrl = await uploadImage(logoFile, "logos");
    }

    await prisma.companyProfile.create({
        data: { ...validation.data, userId: user.id, logoUrl }
    });

    await prisma.user.update({ where: { id: user.id }, data: { isOnboarded: true } });

    syncVectors(user.id, validation.data.description, validation.data.dealIn, validation.data.lookingFor);

    return NextResponse.json({ success: true, message: "Profile created successfully" }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { user, error } = await getUser();
    if (error || !user){
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const dealIn = formData.getAll("dealIn").map(String);
    const lookingFor = formData.getAll("lookingFor").map(String);

    const validation = profileSchema.safeParse({
      ...Object.fromEntries(formData.entries()),
      dealIn,
      lookingFor
    });

    if (!validation.success) {
      return NextResponse.json({ success: false, message: validation.error.issues[0].message }, { status: 400 });
    }

    const existing = await prisma.companyProfile.findUnique({ where: { userId: user.id } });
    if (!existing){
      return NextResponse.json({ success: false, message: "Company profile Not found" }, { status: 404 });
    }

    let logoUrl = existing.logoUrl;
    const newLogo = formData.get("logo") as File;

    if (newLogo && newLogo.size > 0) {
      if (existing.logoUrl) await deleteFile(existing.logoUrl);
      logoUrl = await uploadImage(newLogo, "logos");
    }

    await prisma.companyProfile.update({
      where: { userId: user.id },
      data: { ...validation.data, logoUrl }
    });

    syncVectors(user.id, validation.data.description, validation.data.dealIn, validation.data.lookingFor);

    return NextResponse.json({ success: true, message: "Profile updated successfully" }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}