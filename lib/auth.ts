import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "./prisma";

export async function getUser() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return { user: null, error: "Unauthorized" };
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });

    if (!user) {
      return { user: null, error: "User not found" };
    }

    if (user.status === "SUSPENDED") {
      return { user: null, error: "Your account has been suspended" };
    }

    return { user, error: null };
  } catch {
    return { user: null, error: "Internal server error" };
  }
}

export async function getAdmin(){
  try {
    const user = await getUser();

    if (user.error || !user.user) {
      return { user: null, error: user.error || "Unauthorized" };
    }

    if (user.user.role !== "ADMIN") {
      return { user: null, error: "Unauthorized" };
    }

    return { user, error: null };
  } catch {
    return { user: null, error: "Internal server error" };
  }
}

export async function getOnboardedUser() {
  try {
    const { user, error } = await getUser();

    if (error || !user) {
      return { user: null, error: error || "Unauthorized" };
    }

    if (!user.isOnboarded) {
      return { user: null, error: "company profile not found" };
    }

    return { user, error: null };
  } catch {
    return { user: null, error: "Internal server error" };
  }
}