import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadFile } from "@/lib/uploads";

export async function GET() {
  try {
    const { user, error } = await getUser();

    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        verificationStatus: true,
        company: {
          select: {
            companyName: true,
            location: true,
            type: true,
            website: true,
          }
        },
        verificationApplication: true,
      }
    });

    return NextResponse.json({
      success: true,
      data: fullUser
    });
  } catch (err) {
    console.error("Error fetching verification details:", err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, error } = await getUser();

    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();

    const fullName = formData.get("fullName")?.toString().trim();
    const username = formData.get("username")?.toString().trim();
    const email = formData.get("email")?.toString().trim();
    const phone = formData.get("phone")?.toString().trim() || null;
    const dob = formData.get("dob")?.toString().trim() || null;
    const location = formData.get("location")?.toString().trim() || null;

    const reason = formData.get("reason")?.toString().trim();
    const accountUsage = formData.get("accountUsage")?.toString().trim();
    const accountType = formData.get("accountType")?.toString().trim();
    const additionalInfo = formData.get("additionalInfo")?.toString().trim() || null;

    const socialLinksRaw = formData.get("socialLinks")?.toString();
    let socialLinks: string[] = [];
    if (socialLinksRaw) {
      try {
        socialLinks = JSON.parse(socialLinksRaw);
      } catch {
        socialLinks = [];
      }
    }

    const declarationConfirmed = formData.get("declaration")?.toString() === "true";

    if (!fullName || !username || !email || !reason || !accountUsage || !accountType) {
      return NextResponse.json({ success: false, message: "Please fill in all required fields." }, { status: 400 });
    }

    if (!declarationConfirmed) {
      return NextResponse.json({ success: false, message: "You must confirm the accuracy declaration before submitting." }, { status: 400 });
    }

    // Handle Identity Document upload
    const idDocument = formData.get("idDocument") as File | null;
    let idDocumentUrl = "";
    let idDocumentName = "";

    if (idDocument && idDocument.size > 0) {
      if (idDocument.size > 10 * 1024 * 1024) {
        return NextResponse.json({ success: false, message: "ID Document file size exceeds 10MB limit." }, { status: 400 });
      }
      idDocumentUrl = await uploadFile(idDocument, "verification/documents");
      idDocumentName = idDocument.name;
    } else {
      // Check if updating an existing application with existing doc
      const existingApp = await prisma.verificationApplication.findUnique({
        where: { userId: user.id }
      });
      if (existingApp?.idDocumentUrl) {
        idDocumentUrl = existingApp.idDocumentUrl;
        idDocumentName = existingApp.idDocumentName;
      } else {
        return NextResponse.json({ success: false, message: "Identity verification document is required." }, { status: 400 });
      }
    }

    // Handle optional Supporting Document upload
    const supportingDoc = formData.get("supportingDoc") as File | null;
    let supportingDocUrl: string | null = null;
    let supportingDocName: string | null = null;

    if (supportingDoc && supportingDoc.size > 0) {
      if (supportingDoc.size > 10 * 1024 * 1024) {
        return NextResponse.json({ success: false, message: "Supporting Document file size exceeds 10MB limit." }, { status: 400 });
      }
      supportingDocUrl = await uploadFile(supportingDoc, "verification/supporting");
      supportingDocName = supportingDoc.name;
    } else {
      const existingApp = await prisma.verificationApplication.findUnique({
        where: { userId: user.id }
      });
      if (existingApp?.supportingDocUrl) {
        supportingDocUrl = existingApp.supportingDocUrl;
        supportingDocName = existingApp.supportingDocName;
      }
    }

    // Upsert verification application record
    const application = await prisma.verificationApplication.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        fullName,
        username,
        email,
        phone,
        dob,
        location,
        reason,
        accountUsage,
        accountType,
        additionalInfo,
        socialLinks,
        idDocumentUrl,
        idDocumentName,
        supportingDocUrl,
        supportingDocName,
        status: "PENDING",
      },
      update: {
        fullName,
        username,
        email,
        phone,
        dob,
        location,
        reason,
        accountUsage,
        accountType,
        additionalInfo,
        socialLinks,
        idDocumentUrl,
        idDocumentName,
        supportingDocUrl,
        supportingDocName,
        status: "PENDING",
        rejectionReason: null,
      },
    });

    // Update User verificationStatus to PENDING
    await prisma.user.update({
      where: { id: user.id },
      data: { verificationStatus: "PENDING" },
    });

    return NextResponse.json({
      success: true,
      message: "Verification application submitted successfully! Our team will review your application shortly.",
      data: application,
    });
  } catch (err: any) {
    console.error("Verification application submit error:", err);
    return NextResponse.json({ success: false, message: err.message || "Failed to submit verification application" }, { status: 500 });
  }
}
