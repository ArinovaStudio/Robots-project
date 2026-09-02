"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import RightSection from "@/components/auth/RightSection";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return setError("Please enter an email");
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: "RESET_PASSWORD" }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message);
      } else {
        setMessage("OTP Sent! Check your email.");
        setStep(2);
      }
    } catch {
      setError("Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !newPassword) return setError("Please fill all fields");
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json();
      
      if (!data.success) {
        setError(data.message);
      } else {
        alert("Password reset successfully!");
        router.push("/login");
      }
    } catch {
      setError("Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto flex w-full max-w-7xl py-0 rounded-[32px] border-none shadow-none">
        <div className="grid w-full grid-cols-1 p-0 lg:grid-cols-2">
          {/* LEFT SIDE */}
          <div className="flex flex-col justify-between px-6 py-8 sm:px-10 lg:px-16 lg:py-12">
            <div className="mx-auto flex w-full max-w-md flex-col">
              
              <div className="mb-12">
                <h1 className="text-4xl font-bold tracking-tight text-[#0f172a]">
                  Reset Password 🔒
                </h1>
                <p className="mt-4 text-sm leading-6 text-slate-500">
                  Enter your email to receive a one-time password and regain access to your account.
                </p>
              </div>

              {step === 1 ? (
                <form onSubmit={handleSendOtp} className="space-y-5">
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  {message && <p className="text-sm text-green-600">{message}</p>}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Example@email.com"
                        className="h-12 rounded-xl border-slate-200 bg-slate-50 pl-10 focus-visible:ring-1"
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="h-12 w-full rounded-xl bg-blue-600 text-base font-medium hover:bg-blue-700"
                  >
                    {loading ? "Sending..." : "Send OTP"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-5">
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  {message && <p className="text-sm text-green-600">{message}</p>}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">OTP</label>
                    <Input
                      type="text"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="******"
                      className="h-12 rounded-xl border-slate-200 bg-slate-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">New Password</label>
                    <Input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="h-12 rounded-xl border-slate-200 bg-slate-50"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="h-12 w-full rounded-xl bg-blue-600 text-base font-medium hover:bg-blue-700"
                  >
                    {loading ? "Resetting..." : "Reset Password"}
                  </Button>
                </form>
              )}

              <p className="mt-14 text-center text-sm text-slate-500">
                Remembered your password?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-[#3F6FFF] hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>

            <div className="mt-10 text-center text-sm text-slate-400">
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
