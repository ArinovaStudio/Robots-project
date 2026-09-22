"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import RightSection from "@/components/auth/RightSection";
import CredentialsForm from "@/components/auth/CredentialsForm";
import CompanyDetailsForm from "@/components/auth/CompanyDetailsForm";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      if (session?.user?.isOnboarded === false && step !== 2) {
        setStep(2);
      } else if (session?.user?.isOnboarded) {
        router.push("/explore");
      }
    }
  }, [status, session, router, step]);

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

  const steps = [
    { n: 1, label: "Account" },
    { n: 2, label: "Company" },
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
                  {step === 1 ? "Create your account" : "Set up your company"}
                </h1>
                <p className="text-base text-gray-500 font-medium">
                  {step === 1
                    ? "Join thousands of businesses growing their network."
                    : "Tell us about your company to complete your profile."}
                </p>
              </div>

              {/* Stepper */}
              <div className="mb-8">
                <div className="flex items-center gap-3">
                  {steps.map((s, i) => (
                    <div key={s.n} className="flex items-center gap-3 flex-1">
                      <div className="flex flex-col items-center gap-1.5">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-extrabold transition-all duration-300 ${
                          step > s.n
                            ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                            : step === s.n
                            ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 ring-4 ring-blue-100"
                            : "bg-gray-100 text-gray-400"
                        }`}>
                          {step > s.n ? <CheckCircle2 className="h-4 w-4" /> : s.n}
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
                          step >= s.n ? "text-blue-600" : "text-gray-400"
                        }`}>
                          {s.label}
                        </span>
                      </div>
                      {i < steps.length - 1 && (
                        <div className="flex-1 mb-5">
                          <div className="h-0.5 w-full rounded-full bg-gray-100 overflow-hidden">
                            <div className={`h-full rounded-full bg-blue-600 transition-all duration-500 ${step > 1 ? "w-full" : "w-0"}`} />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Form */}
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {step === 1 ? (
                  <CredentialsForm onNext={() => setStep(2)} />
                ) : (
                  <CompanyDetailsForm />
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