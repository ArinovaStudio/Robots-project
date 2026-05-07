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

    return { user, error: null };
  } catch {
    return { user: null, error: "Internal server error" };
  }
}