import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import ProfileView from "@/components/profile/profile-view";

interface PageProps {
  params: Promise<{ userId: string }>;
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
  return <ProfileView userId={userId} />;
}