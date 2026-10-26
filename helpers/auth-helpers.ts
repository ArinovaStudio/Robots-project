import { signOut } from "next-auth/react";
import { useUserStore } from "@/store/AuthStore";

export function useLogout() {
  const clearUser = useUserStore((s) => s.clearUser);

  const handleLogout = async () => {
    try {
      clearUser();
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("user-store");
          sessionStorage.clear();
        } catch {
          // ignore storage errors
        }
      }
      await signOut({ redirect: false });
    } catch (err) {
      console.error("Signout error:", err);
    } finally {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  };

  return { handleLogout };
}