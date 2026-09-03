"use client";

import { useEffect, useState } from "react";
import { useUserStore } from "@/store/AuthStore";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import ErrorScreen from "./FullPageErrorScreen";

export function SessionSync({ children }: { children: React.ReactNode }) {
  const { setUser, clearUser } = useUserStore();
  const { data: session, status } = useSession();
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {

    const fetchData = async () => {
      try {

        if (status === "unauthenticated") {
          clearUser();
        } else if (status === "authenticated") {
          // If user hasn't completed onboarding, redirect to signup to finish step 2
          if (session?.user?.isOnboarded === false && pathname !== "/signup") {
            router.replace("/signup");
            return;
          }

          const req = await fetch("/api/auth/me");
          const res = await req.json();
          if (!res.success) {
            throw Error(res.message);
          }
          const user = res.data || {};
          const displayName = user.name || user.email?.split('@')[0] || "User";

          setUser({
            email: user.email,
            id: user.id,
            name: displayName,
            image: user.image,
            role: user.role,
            company: user.company
          });
        }
      } catch (error: any) {
        setError(error.message);
      } finally {
        setTimeout(() => {
          setLoaded(true);
        }, 2000);
      }
    }
    fetchData();
  }, [status]);

  if (error) {
    return <ErrorScreen message={error} />
  }
  return <>{children}</>;
}
