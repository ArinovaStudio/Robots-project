"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Mail } from "lucide-react";
import { FaFacebook as Facebook } from "react-icons/fa";
import RightSection from "@/components/auth/RightSection";

export default function LoginPage() {
  const router = useRouter();
  const { status } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      setLoading(false);
      router.refresh();
      router.push("/explore"); 
    }
  };

  if (status === "loading") {
    return <div className="flex h-screen w-full items-center justify-center bg-white">Loading...</div>;
  }

  return (
    <div className="h-screen w-full overflow-hidden flex items-center justify-center p-4 md:p-6 bg-white">
      <div className="mx-auto flex h-full w-full max-w-7xl py-0 rounded-[32px] border-none shadow-none">
        <div className="grid h-full w-full grid-cols-1 p-0 lg:grid-cols-2 overflow-hidden">
          {/* LEFT SIDE */}
          <div className="flex flex-col px-6 py-10 sm:px-10 lg:px-16 overflow-y-auto no-scrollbar">
            <div className="mx-auto flex w-full max-w-md flex-col">
              
              {/* Heading */}
              <div className="mb-8">
                <h1 className="text-4xl font-bold tracking-tight text-[#0f172a]">
                  Welcome to Connecto 👋
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Today is a new day. It&apos;s your day. You shape it.
                  <br />
                  Sign in to start connection with other business.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleCredentialsLogin} className="space-y-4">
                {error && <p className="text-sm text-red-500">{error}</p>}

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Example@email.com"
                      className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-10 focus-visible:ring-1"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <Input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="h-11 rounded-xl border-slate-200 bg-slate-50"
                  />
                  <div className="flex justify-end pt-1">
                    <Link
                      href="/forgot-password"
                      className="text-sm font-medium text-[#3F6FFF] hover:underline"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="h-11 w-full rounded-xl bg-blue-600 text-base font-medium hover:bg-blue-700 mt-2"
                >
                  {loading ? "Signing in..." : "Sign in"}
                </Button>
              </form>

              {/* Divider */}
              <div className="my-6 flex items-center gap-4">
                <Separator className="flex-1" />
                <span className="text-sm text-slate-400">Or</span>
                <Separator className="flex-1" />
              </div>

              {/* Social Buttons */}
              <div className="space-y-3">
                <Button
                  type="button"
                  onClick={() => signIn("google", { callbackUrl: "/feed" })}
                  variant="outline"
                  className="h-11 w-full justify-center gap-3 rounded-xl border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
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
                  type="button"
                  onClick={() => signIn("facebook", { callbackUrl: "/feed" })}
                  variant="outline"
                  className="h-11 w-full justify-center gap-3 rounded-xl border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                >
                  <Facebook className="h-5 w-5 fill-[#1877F2] text-[#1877F2]" />
                  Sign in with Facebook
                </Button>
              </div>

              {/* Footer */}
              <p className="mt-8 text-center text-sm text-slate-500">
                Don&apos;t you have an account?{" "}
                <Link
                  href="/signup"
                  className="font-semibold text-[#3F6FFF] hover:underline"
                >
                  Sign up
                </Link>
              </p>
            </div>

            <div className="mt-6 text-center text-sm text-slate-400 mb-4">
              © {new Date().getFullYear()} Connecto
            </div>
          </div>

          {/* RIGHT SIDE */}
          <RightSection />
        </div>
      </div>
    </div>
  );
}