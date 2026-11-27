"use client";

import Link from "next/link";
import { ShieldCheck, LockKeyhole } from "lucide-react";
import { useUserStore } from "@/store/AuthStore";

type AccountType = "INVESTOR" | "BUSINESS";

export default function VerificationAccessGate({
  accountType,
  mode,
  children,
}: {
  accountType: AccountType;
  mode: "blur" | "block";
  children: React.ReactNode;
}) {
  const user = useUserStore((state) => state.user);

  // SessionSync hydrates the current database user after authentication.
  if (!user) {
    return (
      <div className="flex min-h-[45vh] items-center justify-center text-sm text-gray-500">
        Checking verification status...
      </div>
    );
  }

  if (user.accountType !== accountType || user.isVerified) return <>{children}</>;

  const notice = (
    <div className="mx-auto flex max-w-lg flex-col items-center rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-sm">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-700">
        {mode === "blur" ? <ShieldCheck className="h-7 w-7" /> : <LockKeyhole className="h-7 w-7" />}
      </div>
      <h2 className="text-xl font-bold text-gray-900">Verification required</h2>
      <p className="mt-2 text-sm leading-6 text-gray-600">
        {mode === "blur"
          ? "This section is blurred until your account is verified. Complete verification to view and use these features."
          : "This section is locked until your account is verified. Complete verification to unlock it."}
      </p>
      <Link
        href="/verification"
        className="mt-5 inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        Go to verification
      </Link>
    </div>
  );

  if (mode === "block") {
    return <div className="mx-auto max-w-6xl px-4 py-16">{notice}</div>;
  }

  return (
    <div className="relative min-h-[60vh] overflow-hidden rounded-xl">
      <div className="pointer-events-none select-none space-y-5 p-4 blur-[7px] opacity-65" aria-hidden="true">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="h-11 flex-1 rounded-lg bg-gray-200" />
          <div className="h-11 w-44 rounded-lg bg-gray-200" />
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gray-300" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/3 rounded bg-gray-300" />
                  <div className="h-3 w-1/3 rounded bg-gray-200" />
                </div>
              </div>
              <div className="mb-2 h-4 w-4/5 rounded bg-gray-300" />
              <div className="mb-2 h-3 w-full rounded bg-gray-200" />
              <div className="mb-5 h-3 w-3/4 rounded bg-gray-200" />
              <div className="h-9 w-32 rounded-lg bg-gray-300" />
            </div>
          ))}
        </div>
      </div>
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40 p-4">
        {notice}
      </div>
    </div>
  );
}
