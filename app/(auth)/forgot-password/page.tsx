"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Eye, EyeOff, Check, X } from "lucide-react";
import { toast } from "sonner";
import RightSection from "@/components/auth/RightSection";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const passwordCriteria = {
    hasMinLength: newPassword.length >= 8,
    hasUpper: /[A-Z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return setError("Please enter an email");
    setError("");
    setMessage("");
    setOtpLoading(true);

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
      setOtpLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !newPassword) return setError("Please fill all fields");
    if (!passwordCriteria.hasMinLength || !passwordCriteria.hasNumber || !passwordCriteria.hasUpper || !passwordCriteria.hasSpecial) {
      return setError("Please meet all password criteria");
    }
    setError("");
    setResetLoading(true);

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
        toast.success("Password reset successfully!");
        router.push("/login");
      }
    } catch {
      setError("Reset failed");
    } finally {
      setResetLoading(false);
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
                    disabled={otpLoading || !email}
                    className="h-12 w-full rounded-xl bg-blue-600 text-base font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {otpLoading ? "Sending..." : "Send OTP"}
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
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        className="h-12 rounded-xl border-slate-200 bg-slate-50 pr-10"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {/* Password Criteria */}
                    {newPassword && (
                      <div className="pt-2 pb-1 grid grid-cols-2 gap-2 text-xs">
                        <div className={`flex items-center gap-1.5 ${passwordCriteria.hasMinLength ? 'text-green-600' : 'text-slate-500'}`}>
                          {passwordCriteria.hasMinLength ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} 8+ characters
                        </div>
                        <div className={`flex items-center gap-1.5 ${passwordCriteria.hasUpper ? 'text-green-600' : 'text-slate-500'}`}>
                          {passwordCriteria.hasUpper ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Uppercase letter
                        </div>
                        <div className={`flex items-center gap-1.5 ${passwordCriteria.hasNumber ? 'text-green-600' : 'text-slate-500'}`}>
                          {passwordCriteria.hasNumber ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Number
                        </div>
                        <div className={`flex items-center gap-1.5 ${passwordCriteria.hasSpecial ? 'text-green-600' : 'text-slate-500'}`}>
                          {passwordCriteria.hasSpecial ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Special character
                        </div>
                      </div>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    disabled={resetLoading || !otp || !newPassword}
                    className="h-12 w-full rounded-xl bg-blue-600 text-base font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resetLoading ? "Resetting..." : "Reset Password"}
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
