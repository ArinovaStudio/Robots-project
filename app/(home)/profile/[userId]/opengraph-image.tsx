import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const alt = "Connecto Business Profile";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  let companyName = "Connecto Member";
  let description = "Verified B2B Business Profile";

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });
    if (user) {
      companyName = user.company?.companyName || user.name || "Connecto Member";
      description = user.company?.type || "Verified Business Network Member";
    }
  } catch {
    // fallback defaults
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: 80,
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              backgroundColor: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: "extrabold",
              fontSize: 32,
            }}
          >
            C
          </div>
          <span style={{ fontSize: 32, fontWeight: "bold", color: "#f8fafc" }}>
            Connecto
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1.1,
            }}
          >
            {companyName}
          </div>
          <div
            style={{
              fontSize: 30,
              fontWeight: 500,
              color: "#93c5fd",
            }}
          >
            {description}
          </div>
        </div>

        <div
          style={{
            fontSize: 20,
            color: "#94a3b8",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>Find and offer B2B services on connecto.com</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
