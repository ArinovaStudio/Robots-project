"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RightSection from "@/components/auth/RightSection";
import CredentialsForm from "@/components/auth/CredentialsForm";
import CompanyDetailsForm from "@/components/auth/CompanyDetailsForm";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function AuthPage() {
  const [step, setStep] = useState(1);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      if (session?.user?.isOnboarded === false && step !== 2) {
        setStep(2);
      }
    }
  }, [status, session, router, step]);

  if (status === "loading") {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto flex h-full w-full max-w-7xl rounded-[32px]">
        <div className="grid h-full w-full grid-cols-1 lg:grid-cols-2">
          {/* LEFT SIDE */}
          <div className="flex h-full flex-col justify-between overflow-y-auto px-6 py-8 sm:px-10 lg:px-16 lg:py-12">
            <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
              
              {/* Heading */}
              <div className="mb-10">
                <h1 className="text-4xl font-bold tracking-tight text-[#0f172a]">
                  Hey, Join us Today! 👀
                </h1>
                <p className="mt-4 text-sm leading-6 text-slate-500">
                  Today is a new day. It&apos;s your day. You shape it.
                  <br />
                  Sign in to start connection with other business.
                </p>
              </div>

              {/* STEPPER */}
              <div className="mb-10">
                <div className="flex relative items-center">
                  <div className="flex absolute left-0 top-[-10px] flex-col items-start">
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${step >= 1 ? "bg-[#3F6FFF]" : "bg-slate-300"}`}>
                      1
                    </div>
                    <p className="mt-2 text-[10px] font-medium text-[#3F6FFF]">Basic Credentials</p>
                  </div>

                  <div className="mx-2 h-[2px] flex-1 bg-slate-200">
                    <div className={`h-full bg-[#3F6FFF] transition-all duration-500 ${step < 2 ? "w-1/2" : "w-full"}`} />
                  </div>

                  <div className="flex absolute right-0 top-[-10px] flex-col items-end">
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${step >= 2 ? "bg-[#3F6FFF]" : "bg-slate-300"}`}>
                      2
                    </div>
                    <p className={`mt-2 text-[10px] font-medium ${step >= 2 ? "text-[#3F6FFF]" : "text-slate-400"}`}>Company Details</p>
                  </div>
                </div>
              </div>

              {/* FORMS */}
              {step === 1 ? (
                <CredentialsForm onNext={() => setStep(2)} />
              ) : (
                <CompanyDetailsForm />
              )}

              {/* Footer */}
              <p className="mt-14 text-center text-sm text-slate-500">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-[#3F6FFF] hover:underline">
                  Sign in
                </Link>
              </p>
            </div>

            <div className="mt-10 text-center text-sm text-slate-400">
              © {new Date().getFullYear()} Arinova Studio
            </div>
          </div>

          {/* RIGHT SIDE */}
          <RightSection />
        </div>
      </div>
    </div>
  );
}