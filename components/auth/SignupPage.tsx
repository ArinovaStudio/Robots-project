"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, LogOut, RefreshCw } from "lucide-react";
import RightSection from "@/components/auth/RightSection";
import CredentialsForm from "@/components/auth/CredentialsForm";
import CompanyDetailsForm from "@/components/auth/CompanyDetailsForm";
import InvestorDetailsForm from "@/components/auth/InvestorDetailsForm";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLogout } from "@/helpers/auth-helpers";

export default function SignupPage({
  defaultAccountType = "BUSINESS",
}: {
  defaultAccountType?: "BUSINESS" | "INVESTOR";
}) {
  const [step, setStep] = useState(1);
  const [accountType, setAccountType] = useState<"BUSINESS" | "INVESTOR">(defaultAccountType);
  const [dbUser, setDbUser] = useState<any>(null);
  const router = useRouter();
  const { data: session, status } = useSession();
  const { handleLogout } = useLogout();

  // If user is authenticated, they have completed Step 1 (Account creation) and are on Step 2 (Profile setup).
  const activeStep = status === "authenticated" ? 2 : step;

  useEffect(() => {
    if (session?.user?.accountType) {
      if (defaultAccountType === "INVESTOR" && session?.user?.isOnboarded === false) {
        setAccountType("INVESTOR");
      } else {
        setAccountType(session.user.accountType === "INVESTOR" ? "INVESTOR" : "BUSINESS");
      }
    }
  }, [session?.user?.accountType, session?.user?.isOnboarded, defaultAccountType]);

  useEffect(() => {
    if (status === "authenticated") {
      if (session?.user?.isOnboarded) {
        router.push("/explore");
        return;
      }

      // Check DB via /api/auth/me in case session token is still refreshing
      fetch("/api/auth/me")
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data) {
            setDbUser(json.data);
            const user = json.data;
            if (user.isOnboarded || user.company || user.investor) {
              router.push("/explore");
              return;
            }
            if (user.accountType === "INVESTOR" || defaultAccountType === "INVESTOR") {
              setAccountType("INVESTOR");
            } else {
              setAccountType("BUSINESS");
            }
            setStep(2);
          }
        })
        .catch(() => {});
    }
  }, [status, session?.user?.isOnboarded, defaultAccountType, router]);

  if (status === "loading") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center animate-pulse">
            <span className="text-base font-extrabold text-white">C</span>
          </div>
          <p className="text-sm font-medium text-gray-400">Loading…</p>
        </div>
      </div>
    );
  }

  const profileLabel = accountType === "INVESTOR" ? "Investor" : "Company";
  const steps = [
    { n: 1, label: "Account" },
    { n: 2, label: profileLabel },
  ];

  return (
    <div className="h-screen w-full overflow-hidden flex bg-white">
      <div className="grid h-full w-full grid-cols-1 lg:grid-cols-2">

        {/* ── LEFT PANEL ── */}
        <div className="relative flex flex-col bg-white overflow-y-auto no-scrollbar">
          {/* Back to home */}
          <div className="p-6 sm:p-8">
            <Link href="/"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-400 hover:text-gray-700 transition-colors group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              Back to home
            </Link>
          </div>

          {/* Form area */}
          <div className="flex flex-1 items-center justify-center px-6 pb-10 sm:px-10 lg:px-16">
            <div className="w-full max-w-md">

              {/* Brand */}
              <div className="mb-8">
                <div className="mb-7 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-600/20">
                    <span className="text-lg font-extrabold text-white">C</span>
                  </div>
                  <span className="text-xl font-extrabold tracking-tight text-gray-900">Connecto</span>
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2.5">
                  {activeStep === 1
                    ? `Create your ${accountType === "INVESTOR" ? "investor" : "business"} account`
                    : `Set up your ${accountType === "INVESTOR" ? "investor profile" : "company"}`}
                </h1>
                <p className="text-base text-gray-500 font-medium">
                  {activeStep === 1
                    ? accountType === "INVESTOR"
                      ? "Create your investor profile and connect with growing businesses."
                      : "Join businesses growing their network."
                    : accountType === "INVESTOR"
                      ? "Tell us what you invest in to complete your profile."
                      : "Tell us about your company to complete your profile."}
                </p>
              </div>

              {activeStep === 1 ? (
                <fieldset className="mb-7">
                  <legend className="mb-2 text-sm font-bold text-gray-700">I&apos;m joining as</legend>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { type: "BUSINESS", title: "Business", detail: "Grow your company network" },
                      { type: "INVESTOR", title: "Investor", detail: "Discover businesses to back" },
                    ] as const).map((option) => (
                      <button
                        key={option.type}
                        type="button"
                        aria-pressed={accountType === option.type}
                        onClick={() => {
                          setAccountType(option.type);
                        }}
                        className={`rounded-xl border p-3 text-left transition-colors ${
                          accountType === option.type
                            ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <span className="block text-sm font-bold text-gray-900">{option.title}</span>
                        <span className="mt-1 block text-xs text-gray-500">{option.detail}</span>
                      </button>
                    ))}
                  </div>
                </fieldset>
              ) : (
                <div className="mb-6 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/90 to-indigo-50/70 p-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <span className="inline-flex items-center rounded-md bg-blue-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-blue-700">
                        Step 2 of 2: Profile Setup
                      </span>
                      <p className="mt-1 text-sm text-gray-800 font-medium">
                        Signed in as{" "}
                        <span className="font-bold text-gray-950">
                          {session?.user?.email || dbUser?.email || "User"}
                        </span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 hover:text-gray-900 transition-all active:scale-95"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign out / switch
                    </button>
                  </div>

                  <div className="mt-3 pt-3 border-t border-blue-100/80 flex items-center justify-between text-xs">
                    <span className="text-gray-600 font-medium">
                      Creating <strong className="text-blue-900 font-bold">{accountType === "INVESTOR" ? "Investor Profile" : "Company Profile"}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setAccountType((prev) => (prev === "INVESTOR" ? "BUSINESS" : "INVESTOR"))}
                      className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Switch to {accountType === "INVESTOR" ? "Business" : "Investor"}
                    </button>
                  </div>
                </div>
              )}

              {/* Stepper */}
              <div className="mb-8">
                <div className="flex items-center gap-3">
                  {steps.map((s, i) => (
                    <div key={s.n} className="flex items-center gap-3 flex-1">
                      <div className="flex flex-col items-center gap-1.5">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-extrabold transition-all duration-300 ${
                          activeStep > s.n
                            ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                            : activeStep === s.n
                            ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 ring-4 ring-blue-100"
                            : "bg-gray-100 text-gray-400"
                        }`}>
                          {activeStep > s.n ? <CheckCircle2 className="h-4 w-4" /> : s.n}
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
                          activeStep >= s.n ? "text-blue-600" : "text-gray-400"
                        }`}>
                          {s.label}
                        </span>
                      </div>
                      {i < steps.length - 1 && (
                        <div className="flex-1 mb-5">
                          <div className="h-0.5 w-full rounded-full bg-gray-100 overflow-hidden">
                            <div className={`h-full rounded-full bg-blue-600 transition-all duration-500 ${activeStep > 1 ? "w-full" : "w-0"}`} />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Form */}
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {activeStep === 1 ? (
                  <CredentialsForm accountType={accountType} onNext={() => setStep(2)} />
                ) : (
                  accountType === "INVESTOR" ? <InvestorDetailsForm /> : <CompanyDetailsForm />
                )}
              </div>

              {activeStep === 1 ? (
                <p className="mt-8 text-center text-sm font-medium text-gray-500">
                  Already have an account?{" "}
                  <Link href="/login" className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors">
                    Sign in
                  </Link>
                </p>
              ) : (
                <div className="mt-8 flex items-center justify-center gap-4 text-sm text-gray-500 font-medium">
                  <span>Need help or want to restart?</span>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors inline-flex items-center gap-1"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 text-center text-xs font-medium text-gray-400">
            © {new Date().getFullYear()} Connecto · All rights reserved
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <RightSection />
      </div>
    </div>
  );
}