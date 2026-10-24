"use client";

import { useEffect, useState } from "react";
import { useUserStore } from "@/store/AuthStore";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import ErrorScreen from "./FullPageErrorScreen";

export function SessionSync({ children }: { children: React.ReactNode }) {
  const { setUser, clearUser } = useUserStore();
  const { data: session, status, update } = useSession();
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
          // Fetch real user data from DB to get the true onboarding status
          const req = await fetch("/api/auth/me");
          const res = await req.json();
          if (!res.success) {
            if (req.status === 401 || res.message === "Unauthorized") {
              clearUser();
              const callback = pathname && pathname !== "/" ? `?callbackUrl=${encodeURIComponent(pathname)}` : "";
              router.replace(`/login${callback}`);
              return;
            }
            throw Error(res.message);
          }
          const user = res.data || {};
          const isReallyOnboarded = Boolean(user.isOnboarded || user.company || user.investor);

          const onboardingPaths = ["/signup", "/signup/investor", "/register/company"];

          // If DB says the user genuinely hasn't completed onboarding, route them to step 2
          if (!isReallyOnboarded && !onboardingPaths.includes(pathname)) {
            router.replace(user.accountType === "INVESTOR" ? "/signup/investor" : "/register/company");
            return;
          }

          if (isReallyOnboarded) {
            // If NextAuth session was still lagging behind, update the token
            if (session?.user?.isOnboarded === false && update) {
              update();
            }

            const displayName = user.name || user.email?.split("@")[0] || "User";

            setUser({
              email: user.email,
              id: user.id,
              name: displayName,
              image: user.image,
              role: user.role,
              accountType: user.accountType,
              company: user.company,
              investor: user.investor,
            });
          }
        }
      } catch (error: any) {
        setError(error.message);
      } finally {
        setTimeout(() => {
          setLoaded(true);
        }, 400);
      }
    };
    fetchData();
  }, [status, pathname, router, setUser, clearUser, update]);

  if (error) {
    return <ErrorScreen message={error} onRetry={() => { setError(""); router.refresh(); }} />
  }
  return <>{children}</>;
}
