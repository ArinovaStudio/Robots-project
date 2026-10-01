import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import ProfileView from "@/components/profile/profile-view";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ userId: string }>;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://connecto.com";

export async function generateStaticParams() {
  try {
    const users = await prisma.user.findMany({
      where: { isOnboarded: true },
      select: { id: true },
      take: 100,
    });
    return users.map((u) => ({ userId: u.id }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { userId } = await params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    if (!user) {
      return {
        title: "Profile Not Found | Connecto",
        description: "The requested profile could not be found on Connecto.",
        alternates: { canonical: `/profile/${userId}` },
      };
    }

    const companyName = user.company?.companyName;
    const userName = user.name || "Business Profile";
    const title = companyName
      ? `${companyName} (${userName})`
      : `${userName} - Business Profile`;

    const description = user.company?.description
      ? user.company.description.slice(0, 155)
      : `Connect with ${userName} on Connecto business network. Find and offer B2B services.`;

    return {
      title,
      description,
      alternates: {
        canonical: `/profile/${userId}`,
      },
      openGraph: {
        title,
        description,
        url: `/profile/${userId}`,
        siteName: "Connecto",
        type: "profile",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  } catch (error) {
    return {
      title: "User Profile | Connecto",
      description: "Connect with verified businesses on Connecto.",
      alternates: {
        canonical: `/profile/${userId}`,
      },
    };
  }
}

export default async function TargetUserProfilePage({ params }: PageProps) {
  const { userId } = await params;

  let user = null;
  try {
    user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });
  } catch (err) {
    console.error("Error fetching user profile server side:", err);
  }

  if (!user && process.env.NODE_ENV === "production") {
    notFound();
  }

  const companyName = user?.company?.companyName || user?.name || "Business Profile";
  const pageUrl = `${baseUrl}/profile/${userId}`;

  const profileJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: companyName,
        url: pageUrl,
        description: user?.company?.description || `B2B Profile for ${user?.name}`,
        address: user?.company?.location
          ? {
              "@type": "PostalAddress",
              addressLocality: user.company.location,
            }
          : undefined,
        makesOffer:
          user?.company?.dealIn?.map((serviceName: string) => ({
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: serviceName,
            },
          })) || [],
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: baseUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Directory",
            item: `${baseUrl}/directory`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: companyName,
            item: pageUrl,
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(profileJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      {/* SSR fallback markup for crawlers */}
      <div className="sr-only">
        <h1>{companyName}</h1>
        <p>{user?.company?.description || `Business profile of ${user?.name}`}</p>
        {user?.company?.dealIn && user.company.dealIn.length > 0 && (
          <div>
            <h2>Services Offered</h2>
            <ul>
              {user.company.dealIn.map((s, idx) => (
                <li key={idx}>{s}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <ProfileView userId={userId} />
    </>
  );
}