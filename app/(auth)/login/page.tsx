"use client";

import Image from "next/image";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Mail } from "lucide-react";
import { FaFacebook as Facebook } from "react-icons/fa";
import RightSection from "@/components/auth/RightSection";
export default function LoginPage() {
  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto py-0 flex w-full max-w-7xl rounded-[32px] border-none shadow-none">
        <div className="grid w-full grid-cols-1 p-0 lg:grid-cols-2">
          {/* LEFT SIDE */}
          <div className="flex flex-col justify-between px-6 py-8 sm:px-10 lg:px-16 lg:py-12">
            <div className="mx-auto flex w-full max-w-md flex-col">
              {/* Heading */}
              <div className="mb-12">
                <h1 className="text-4xl font-bold tracking-tight text-[#0f172a]">
                  Welcome Back 👋
                </h1>

                <p className="mt-4 text-sm leading-6 text-slate-500">
                  Today is a new day. It&apos;s your day. You shape it.
                  <br />
                  Sign in to start connection with other business.
                </p>
              </div>

              {/* Form */}
              <form className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Email
                  </label>

                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <Input
                      type="email"
                      placeholder="Example@email.com"
                      className="h-12 rounded-xl border-slate-200 bg-slate-50 pl-10 focus-visible:ring-1"
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

                  <div className="flex justify-end">
                    <Link
                      href="#"
                      className="text-sm font-medium text-[#4f46e5] hover:underline"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                </div>

                <Button className="h-12 w-full rounded-xl bg-[#0f2230] text-base font-medium hover:bg-[#132c3d]">
                  Sign in
                </Button>
              </form>

              {/* Divider */}
              <div className="my-10 flex items-center gap-4">
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

              {/* Footer */}
              <p className="mt-14 text-center text-sm text-slate-500">
                Don&apos;t you have an account?{" "}
                <Link
                  href="#"
                  className="font-semibold text-[#4f46e5] hover:underline"
                >
                  Sign up
                </Link>
              </p>
            </div>

            <div className="mt-10 text-center text-sm text-slate-400">
              © 2026 Arinova Studio
            </div>
          </div>

          {/* RIGHT SIDE */}
          <RightSection/>
        </div>
      </div>
    </div>
  );
}
