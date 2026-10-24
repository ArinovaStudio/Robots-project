"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Eye, EyeOff, Check, X, ArrowLeft, Lock, AlertCircle, RefreshCw, Clock } from "lucide-react";
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
  const [resendTimer, setResendTimer] = useState(0);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const passwordCriteria = {
    hasMinLength: newPassword.length >= 8,
    hasUpper: /[A-Z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setError("");
    setMessage("");
    setOtpLoading(true);

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), type: "RESET_PASSWORD" }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || "Failed to send verification code. Please try again.");
        toast.error(data.message || "Failed to send verification code.");
      } else {
        setMessage(data.message || "Verification code sent! Please check your email.");
        toast.success(data.message || "Verification code sent! Please check your email.");
        setStep(2);
        setResendTimer(30);
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
      toast.error("Network error. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || !newPassword) {
      setError("Please fill in both the OTP and your new password.");
      return;
    }
    if (
      !passwordCriteria.hasMinLength ||
      !passwordCriteria.hasNumber ||
      !passwordCriteria.hasUpper ||
      !passwordCriteria.hasSpecial
    ) {
      setError("Please meet all password security requirements.");
      return;
    }
    setError("");
    setMessage("");
    setResetLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim(), newPassword }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message || "Failed to reset password. Please verify your OTP.");
        toast.error(data.message || "Failed to reset password.");
      } else {
        toast.success("Password reset successfully! You can now sign in.");
        router.push("/login");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
      toast.error("Network error. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="h-screen w-full overflow-hidden flex bg-white">
      <div className="grid h-full w-full grid-cols-1 lg:grid-cols-2">
        {/* ── LEFT PANEL ── */}
        <div className="relative flex flex-col bg-white overflow-y-auto no-scrollbar">
          {/* Back to login */}
          <div className="p-6 sm:p-8">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-400 hover:text-gray-700 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              Back to login
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
                  Reset Password
                </h1>
                <p className="text-base text-gray-500 font-medium">
                  {step === 1
                    ? "Enter your email to receive a one-time verification password."
                    : `Enter the 6-digit code sent to ${email} to set a new password.`}
                </p>
              </div>

              {/* Status alerts */}
              {error && (
                <div
                  role="alert"
                  className="mb-5 flex items-center gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
              {message && (
                <div
                  role="status"
                  className="mb-5 flex items-center gap-2.5 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-medium text-green-700"
                >
                  <Check className="h-4 w-4 shrink-0" />
                  {message}
                </div>
              )}

              {step === 1 ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-gray-700">Email address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <Input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@company.com"
                        className="h-12 rounded-xl border-gray-200 bg-gray-50 pl-10 text-gray-900 font-medium placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={otpLoading || !email.trim()}
                    className="h-12 w-full rounded-xl bg-blue-600 text-sm font-bold text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 hover:shadow-blue-600/35 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] mt-2"
                  >
                    {otpLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Sending code…
                      </span>
                    ) : (
                      "Send verification code"
                    )}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-bold text-gray-700">Verification Code (OTP)</label>
                      <button
                        type="button"
                        onClick={() => {
                          setStep(1);
                          setError("");
                          setMessage("");
                        }}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
                      >
                        <RefreshCw className="h-3 w-3" /> Change email
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <Input
                        type="text"
                        required
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="6-digit code"
                        className="h-12 rounded-xl border-gray-200 bg-gray-50 pl-10 text-gray-900 font-medium placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:border-blue-500 transition-all tracking-wider font-mono"
                      />
                    </div>

                    {/* Resend OTP Row with 30s countdown */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-gray-500 font-medium">Didn't receive the code?</span>
                      {resendTimer > 0 ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg">
                          <Clock className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                          Resend in 0:{resendTimer < 10 ? `0${resendTimer}` : resendTimer}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSendOtp()}
                          disabled={otpLoading}
                          className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-800 hover:underline disabled:opacity-50 transition-colors"
                        >
                          <RefreshCw className={`w-3 h-3 ${otpLoading ? "animate-spin" : ""}`} />
                          {otpLoading ? "Sending..." : "Resend code"}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-gray-700">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-12 rounded-xl border-gray-200 bg-gray-50 pl-10 pr-11 text-gray-900 font-medium placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:border-blue-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {newPassword && (
                      <div className="pt-2 pb-1 grid grid-cols-2 gap-2 text-xs">
                        <div
                          className={`flex items-center gap-1.5 ${passwordCriteria.hasMinLength ? "text-green-600 font-medium" : "text-gray-400"}`}
                        >
                          {passwordCriteria.hasMinLength ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />} 8+ characters
                        </div>
                        <div
                          className={`flex items-center gap-1.5 ${passwordCriteria.hasUpper ? "text-green-600 font-medium" : "text-gray-400"}`}
                        >
                          {passwordCriteria.hasUpper ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />} Uppercase letter
                        </div>
                        <div
                          className={`flex items-center gap-1.5 ${passwordCriteria.hasNumber ? "text-green-600 font-medium" : "text-gray-400"}`}
                        >
                          {passwordCriteria.hasNumber ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />} Number
                        </div>
                        <div
                          className={`flex items-center gap-1.5 ${passwordCriteria.hasSpecial ? "text-green-600 font-medium" : "text-gray-400"}`}
                        >
                          {passwordCriteria.hasSpecial ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />} Special character
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={resetLoading || !otp.trim() || !newPassword}
                    className="h-12 w-full rounded-xl bg-blue-600 text-sm font-bold text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 hover:shadow-blue-600/35 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] mt-2"
                  >
                    {resetLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Resetting password…
                      </span>
                    ) : (
                      "Save new password"
                    )}
                  </Button>
                </form>
              )}

              <p className="mt-8 text-center text-sm font-medium text-gray-500">
                Remember your password?{" "}
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
