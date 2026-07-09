import { signOut } from "next-auth/react";
import { useUserStore } from "@/store/AuthStore";

export function useLogout() {
  const clearUser = useUserStore((s) => s.clearUser);

  const handleLogout = async () => {
    clearUser(); // optional UI cleanup

    await signOut({
      callbackUrl: "/login",
    });
  };

  return { handleLogout };
}