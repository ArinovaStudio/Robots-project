"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Eye, EyeOff, ArrowLeft, Lock, AlertCircle } from "lucide-react";
import { FaFacebook as Facebook } from "react-icons/fa";
import RightSection from "@/components/auth/RightSection";

export default function LoginPage() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated") router.push("/explore");
  }, [status, router]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) {
      setError("Invalid email or password. Please try again.");
      setLoading(false);
    } else {
      router.refresh();
      router.push("/explore");
    }
  };

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

              {/* Brand + heading */}
              <div className="mb-10">
                <div className="mb-7 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-600/20">
                    <span className="text-lg font-extrabold text-white">C</span>
                  </div>
                  <span className="text-xl font-extrabold tracking-tight text-gray-900">Connecto</span>
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2.5">
                  Welcome back 👋
                </h1>
                <p className="text-base text-gray-500 font-medium">
                  Sign in to continue building your network.
                </p>
              </div>

              {/* Social login */}
              <div className="mb-7 grid grid-cols-2 gap-3">
                <button
                  onClick={() => signIn("google", { callbackUrl: "/explore" })}
                  className="flex h-11 items-center justify-center gap-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-[0.98]">
                  <Image src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width={16} height={16} />
                  Google
                </button>
                <button
                  onClick={() => signIn("facebook", { callbackUrl: "/explore" })}
                  className="flex h-11 items-center justify-center gap-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-[0.98]">
                  <Facebook className="h-4 w-4 text-[#1877F2]" />
                  Facebook
                </button>
              </div>

              {/* Divider */}
              <div className="relative mb-7">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-4 text-xs font-bold uppercase tracking-widest text-gray-400">
                    or sign in with email
                  </span>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Credentials form */}
              <form onSubmit={handleCredentialsLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-gray-700">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <Input
                      type="email" required
                      value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="h-12 rounded-xl border-gray-200 bg-gray-50 pl-10 text-gray-900 font-medium placeholder:text-gray-400 placeholder:font-normal focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-bold text-gray-700">Password</label>
                    <Link href="/forgot-password" className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <Input
                      type={showPassword ? "text" : "password"} required
                      value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-12 rounded-xl border-gray-200 bg-gray-50 pl-10 pr-11 text-gray-900 font-medium placeholder:text-gray-400 placeholder:font-normal focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:border-blue-500 transition-all"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" disabled={loading || !email || !password}
                  className="h-12 w-full rounded-xl bg-blue-600 text-sm font-bold text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 hover:shadow-blue-600/35 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] mt-2">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Signing in…
                    </span>
                  ) : "Sign in to Connecto"}
                </Button>
              </form>

              <p className="mt-8 text-center text-sm font-medium text-gray-500">
                Don't have an account?{" "}
                <Link href="/signup" className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors">
                  Create one for free
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