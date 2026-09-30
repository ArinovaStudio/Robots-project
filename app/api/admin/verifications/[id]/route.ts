import { NextRequest, NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user: admin, error } = await getAdmin();
    if (error || !admin) {
      return NextResponse.json({ success: false, message: error || "Unauthorized access" }, { status: 403 });
    }

    const { id } = await params;

    const application = await prisma.verificationApplication.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true,
            verificationStatus: true,
            company: {
              select: {
                companyName: true,
                logoUrl: true,
                type: true,
                location: true,
                website: true,
              },
            },
          },
        },
        history: {
          orderBy: { createdAt: "desc" },
        },
        adminNotes: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!application) {
      return NextResponse.json({ success: false, message: "Verification application not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: application,
    });
  } catch (err: any) {
    console.error("Error fetching verification application detail:", err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user: admin, error } = await getAdmin();
    if (error || !admin) {
      return NextResponse.json({ success: false, message: error || "Unauthorized access" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const note = body.note?.trim();

    if (!note) {
      return NextResponse.json({ success: false, message: "Note content cannot be empty" }, { status: 400 });
    }

    const application = await prisma.verificationApplication.findUnique({
      where: { id },
    });

    if (!application) {
      return NextResponse.json({ success: false, message: "Verification application not found" }, { status: 404 });
    }

    const newNote = await prisma.verificationAdminNote.create({
      data: {
        applicationId: id,
        note,
        authorId: admin.id,
        authorName: admin.name || "Admin",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Internal admin note added successfully",
      data: newNote,
    });
  } catch (err: any) {
    console.error("Error adding internal admin note:", err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
