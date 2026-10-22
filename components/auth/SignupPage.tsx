"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import RightSection from "@/components/auth/RightSection";
import CredentialsForm from "@/components/auth/CredentialsForm";
import CompanyDetailsForm from "@/components/auth/CompanyDetailsForm";
import InvestorDetailsForm from "@/components/auth/InvestorDetailsForm";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function SignupPage({
  defaultAccountType = "BUSINESS",
}: {
  defaultAccountType?: "BUSINESS" | "INVESTOR";
}) {
  const [step, setStep] = useState(1);
  const [accountType, setAccountType] = useState<"BUSINESS" | "INVESTOR">(defaultAccountType);
  const router = useRouter();
  const { data: session, status } = useSession();
  const activeStep =
    status === "authenticated" && session?.user?.isOnboarded === false ? 2 : step;

  useEffect(() => {
    if (session?.user?.accountType) {
      setAccountType(session.user.accountType === "INVESTOR" ? "INVESTOR" : "BUSINESS");
    }
  }, [session?.user?.accountType]);

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
          if (json.success && (json.data?.isOnboarded || json.data?.company || json.data?.investor)) {
            router.push("/explore");
          }
        })
        .catch(() => {});
    }
  }, [status, session?.user?.isOnboarded, router]);

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
                <div className="mb-6 flex items-center justify-between rounded-xl bg-blue-50 px-4 py-3 text-sm">
                  <span className="font-semibold text-blue-800">
                    Signing up as {accountType === "INVESTOR" ? "an investor" : "a business"}
                  </span>
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

              <p className="mt-8 text-center text-sm font-medium text-gray-500">
                Already have an account?{" "}
                <Link href="/login" className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors">
                  Sign in
                </Link>
              </p>
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