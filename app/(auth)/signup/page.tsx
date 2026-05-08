"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

import { Mail, ChevronRight, User, Building2, Globe } from "lucide-react";
import { FaFacebook as Facebook } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import RightSection from "@/components/auth/RightSection";

export default function AuthPage() {
  const [step, setStep] = useState(1);

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
                  {/* Step 1 */}
                  <div className="flex absolute left-0 top-[-10px] flex-col items-start">
                    <div
                      className={`
                        flex h-6 w-6 items-center justify-center rounded-full
                        text-xs font-bold text-white
                        ${step >= 1 ? "bg-[#3F6FFF]" : "bg-slate-300"}
                      `}
                    >
                      1
                    </div>

                    <p className="mt-2 text-[10px] font-medium text-[#3F6FFF]">
                      Basic Credentials
                    </p>
                  </div>

                  {/* Line */}
                  <div className="mx-2 h-[2px] flex-1 bg-slate-200">
                    <div
                      className={`
                        h-full bg-[#3F6FFF] transition-all duration-500
                        ${step < 2 ? "w-1/2" : "w-full"}
                      `}
                    />
                  </div>

                  {/* Step 2 */}
                  <div className="flex absolute right-0 top-[-10px] flex-col items-end">
                    <div
                      className={`
                        flex h-6 w-6 items-center justify-center rounded-full
                        text-xs font-bold text-white
                        ${step >= 2 ? "bg-[#3F6FFF]" : "bg-slate-300"}
                      `}
                    >
                      2
                    </div>

                    <p
                      className={`
                        mt-2 text-[10px] font-medium
                        ${step >= 2 ? "text-[#3F6FFF]" : "text-slate-400"}
                      `}
                    >
                      Company Details
                    </p>
                  </div>
                </div>
              </div>

              {/* FORM */}
              <form className="space-y-5">
                {/* STEP 1 */}
                {step === 1 && (
                  <>
                    <div className="space-y-2 mt-3">
                      <label className="text-sm font-medium text-slate-700">
                        Email
                      </label>

                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                        <Input
                          type="email"
                          placeholder="Example@email.com"
                          className="h-12 rounded-xl border-slate-200 bg-slate-50 pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Password
                      </label>

                      <Input
                        type="password"
                        placeholder="At least 8 characters"
                        className="h-12 rounded-xl border-slate-200 bg-slate-50"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Confirm Password
                      </label>

                      <Input
                        type="password"
                        placeholder="Re-enter Password"
                        className="h-12 rounded-xl border-slate-200 bg-slate-50"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        OTP
                      </label>

                      <Input
                        type="text"
                        placeholder="******"
                        className="h-12 rounded-xl border-slate-200 bg-slate-50"
                      />
                    </div>

                    <Button
                      type="button"
                      onClick={() => setStep(2)}
                      className="h-12 w-full rounded-xl bg-[#0f2230] text-base font-medium hover:bg-[#132c3d]"
                    >
                      Continue
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>

                    {/* Divider */}
                    <div className="my-8 flex items-center gap-4">
                      <Separator className="flex-1" />
                      <span className="text-sm text-slate-400">Or</span>
                      <Separator className="flex-1" />
                    </div>

                    {/* Social Buttons */}
                    <div className="space-y-4">
                      <Button
                        variant="outline"
                        className="h-12 w-full justify-center gap-3 rounded-xl border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                      >
                        <Image
                          src="https://www.svgrepo.com/show/475656/google-color.svg"
                          alt="google"
                          width={18}
                          height={18}
                        />
                        Sign in with Google
                      </Button>

                      <Button
                        variant="outline"
                        className="h-12 w-full justify-center gap-3 rounded-xl border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                      >
                        <Facebook className="h-5 w-5 fill-[#1877F2] text-[#1877F2]" />
                        Sign in with Facebook
                      </Button>
                    </div>
                  </>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                  <>
                    {/* Company Name */}
                    <div className="space-y-2 mt-3">
                      <label className="text-sm font-medium text-slate-700">
                        Company Name <span className="text-red-500">*</span>
                      </label>

                      <Input
                        placeholder="Arinova Studio"
                        className="h-12 rounded-xl border-slate-200 bg-slate-50"
                      />
                    </div>

                    {/* Company Description */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Company Description{" "}
                        <span className="text-red-500">*</span>
                      </label>

                      <Input
                        placeholder="Lorem ispem"
                        className="h-12 rounded-xl border-slate-200 bg-slate-50"
                      />
                    </div>

                    {/* Company Logo */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Company Logo
                      </label>

                      <div className="relative">
                        {/* Hidden File Input */}
                        <input
                          id="company-logo"
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            console.log(file);
                          }}
                        />

                        {/* Fake Input */}
                        <div
                          className="
        flex h-12 items-center justify-between rounded-xl
        border border-slate-200 bg-slate-50 px-4
      "
                        >
                          <span className="text-sm text-slate-400">Upload</span>

                          {/* Upload Trigger */}
                          <label
                            htmlFor="company-logo"
                            className="
          cursor-pointer text-sm font-medium
          text-[#3F6FFF] hover:underline
        "
                          >
                            Choose File
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Company Size */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Company Size <span className="text-red-500">*</span>
                      </label>

                      <Input
                        placeholder="1-100 Employees"
                        className="h-12 rounded-xl border-slate-200 bg-slate-50"
                      />
                    </div>

                    {/* Company Type */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Company Type <span className="text-red-500">*</span>
                      </label>

                      <div className="relative">
                        <select
                          className="
            h-12 w-full appearance-none rounded-xl border
            border-slate-200 bg-slate-50 px-4 text-sm
            text-slate-500 outline-none
          "
                        >
                          <option>Select</option>
                          <option>Startup</option>
                          <option>Agency</option>
                          <option>Enterprise</option>
                          <option>SaaS</option>
                        </select>

                        <ChevronRight className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>

                    {/* Year */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Year of establishment
                      </label>

                      <Input
                        placeholder="2025"
                        className="h-12 rounded-xl border-slate-200 bg-slate-50"
                      />
                    </div>

                    {/* Deal In */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Deal In
                      </label>

                      <div className="relative">
                        <select
                          className="
            h-12 w-full appearance-none rounded-xl border
            border-slate-200 bg-slate-50 px-4 text-sm
            text-slate-500 outline-none
          "
                        >
                          <option>Choose at least 3</option>
                          <option>Web Development</option>
                          <option>Mobile Apps</option>
                          <option>UI/UX Design</option>
                          <option>AI Solutions</option>
                        </select>

                        <ChevronRight className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                      <Button
                        type="submit"
                        className="h-12 flex-1 rounded-xl bg-[#0f2230] text-base font-medium hover:bg-[#132c3d]"
                      >
                        Sign in
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </form>

              {/* Footer */}
              <p className="mt-14 text-center text-sm text-slate-500">
                Already have an account?{" "}
                <Link
                  href="#"
                  className="font-semibold text-[#3F6FFF] hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>

            <div className="mt-10 text-center text-sm text-slate-400">
              © 2026 Arinova Studio
            </div>
          </div>

          {/* RIGHT SIDE */}
          <RightSection />
        </div>
      </div>
    </div>
  );
}
