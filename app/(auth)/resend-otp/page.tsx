"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Mail,
  ArrowLeft,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Clock,
  ArrowRight,
  ShieldCheck,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import RightSection from "@/components/auth/RightSection";

export default function ResendOtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [otpType, setOtpType] = useState<"VERIFY_EMAIL" | "RESET_PASSWORD">("VERIFY_EMAIL");
  const [step, setStep] = useState<1 | 2>(1);
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(0);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);

  // Pre-fill email and type from query params if available
  useEffect(() => {
    const qEmail = searchParams.get("email");
    if (qEmail) setEmail(qEmail);

    const qType = searchParams.get("type");
    if (qType === "RESET_PASSWORD" || qType === "VERIFY_EMAIL") {
      setOtpType(qType);
    }
  }, [searchParams]);

  // 30-second countdown timer effect
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleSendOtp = async (isResend = false) => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");
    setSuccessMsg("");
    setSending(true);

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, type: otpType }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message || "Failed to send verification code. Please try again.");
        toast.error(data.message || "Failed to send verification code.");
      } else {
        setSuccessMsg(data.message || "Verification code sent! Please check your email.");
        toast.success(data.message || "Verification code sent! Please check your email.");
        setStep(2);
        setTimer(30);
      }
    } catch {
      setError("Network error. Please check your internet connection.");
      toast.error("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedOtp = otp.trim();
    if (!trimmedOtp || trimmedOtp.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setError("");
    setVerifying(true);

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: trimmedOtp, type: otpType }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message || "Invalid or expired verification code.");
        toast.error(data.message || "Verification failed.");
      } else {
        setVerifiedSuccess(true);
        toast.success("Verification code confirmed!");
      }
    } catch {
      setError("Verification service temporarily unavailable.");
      toast.error("Verification failed.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="h-screen w-full overflow-hidden flex bg-white">
      <div className="grid h-full w-full grid-cols-1 lg:grid-cols-2">
        {/* ── LEFT PANEL ── */}
        <div className="relative flex flex-col bg-white overflow-y-auto no-scrollbar">
          {/* Back button */}
          <div className="p-6 sm:p-8">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-400 hover:text-gray-700 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              Back to sign in
            </Link>
          </div>

          {/* Form container */}
          <div className="flex flex-1 items-center justify-center px-6 pb-10 sm:px-10 lg:px-16">
            <div className="w-full max-w-md">
              {/* Brand and Heading */}
              <div className="mb-8">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-600/20">
                    <span className="text-lg font-extrabold text-white">C</span>
                  </div>
                  <span className="text-xl font-extrabold tracking-tight text-gray-900">Connecto</span>
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-2">
                  Resend Verification Code ✉️
                </h1>
                <p className="text-sm text-gray-500 font-medium">
                  {step === 1
                    ? "Didn't receive your code or has it expired? Request a fresh one-time verification password below."
                    : `Enter the 6-digit code sent to ${email} to verify your request.`}
                </p>
              </div>

              {/* Purpose Selector Tabs */}
              {step === 1 && (
                <div className="mb-6 grid grid-cols-2 gap-2 p-1 rounded-xl bg-gray-100 border border-gray-200/80">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpType("VERIFY_EMAIL");
                      setError("");
                    }}
                    className={`h-9 rounded-lg text-xs font-bold transition-all ${
                      otpType === "VERIFY_EMAIL"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Account Verification
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpType("RESET_PASSWORD");
                      setError("");
                    }}
                    className={`h-9 rounded-lg text-xs font-bold transition-all ${
                      otpType === "RESET_PASSWORD"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Password Reset
                  </button>
                </div>
              )}

              {/* Status Alerts */}
              {error && (
                <div
                  role="alert"
                  className="mb-5 flex items-center gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 animate-in fade-in"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
              {successMsg && (
                <div
                  role="status"
                  className="mb-5 flex items-center gap-2.5 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 animate-in fade-in"
                >
                  <Check className="h-4 w-4 shrink-0" />
                  {successMsg}
                </div>
              )}

              {verifiedSuccess ? (
                /* Verification Success Screen */
                <div className="rounded-2xl border border-green-200 bg-green-50/70 p-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Code Verified Successfully!</h2>
                    <p className="text-xs text-gray-600 mt-1">
                      {otpType === "VERIFY_EMAIL"
                        ? "Your email has been verified. You can now complete your registration or sign in."
                        : "Your one-time code is valid. Proceed to create your new password."}
                    </p>
                  </div>
                  <div className="pt-2">
                    {otpType === "VERIFY_EMAIL" ? (
                      <Link
                        href={`/register?email=${encodeURIComponent(email)}`}
                        className="inline-flex items-center justify-center gap-2 h-11 w-full rounded-xl bg-blue-600 font-bold text-sm text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all"
                      >
                        Continue to Registration
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    ) : (
                      <Link
                        href={`/forgot-password?email=${encodeURIComponent(email)}`}
                        className="inline-flex items-center justify-center gap-2 h-11 w-full rounded-xl bg-blue-600 font-bold text-sm text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all"
                      >
                        Set New Password
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </div>
              ) : step === 1 ? (
                /* Step 1: Request Code */
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendOtp(false);
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-gray-700">Email address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <Input
                        type="email"
                        required
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@company.com"
                        className="h-12 rounded-xl border-gray-200 bg-gray-50 pl-10 text-gray-900 font-medium placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={sending || !email.trim()}
                    className="h-12 w-full rounded-xl bg-blue-600 text-sm font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 hover:shadow-blue-600/35 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] mt-2"
                  >
                    {sending ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Sending verification code…
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        Send Verification Code
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </form>
              ) : (
                /* Step 2: Verification with 30s Countdown */
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-bold text-gray-700">6-Digit Verification Code</label>
                      <button
                        type="button"
                        onClick={() => {
                          setStep(1);
                          setError("");
                          setSuccessMsg("");
                        }}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
                      >
                        Change email
                      </button>
                    </div>

                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <Input
                        type="text"
                        required
                        autoFocus
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                          setOtp(val);
                        }}
                        placeholder="••••••"
                        className="h-12 rounded-xl border-gray-200 bg-gray-50 pl-10 text-gray-900 font-mono tracking-[0.35em] text-center text-lg font-bold placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:border-blue-500 transition-all"
                      />
                    </div>

                    {/* Resend Action with 30s Timer */}
                    <div className="flex items-center justify-between text-xs pt-1.5">
                      <span className="text-gray-500 font-medium">Didn't receive the code?</span>
                      {timer > 0 ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg">
                          <Clock className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                          Resend in 0:{timer < 10 ? `0${timer}` : timer}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSendOtp(true)}
                          disabled={sending}
                          className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-800 hover:underline disabled:opacity-50 transition-colors"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${sending ? "animate-spin" : ""}`} />
                          {sending ? "Sending..." : "Resend code"}
                        </button>
                      )}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={verifying || otp.trim().length !== 6}
                    className="h-12 w-full rounded-xl bg-blue-600 text-sm font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 hover:shadow-blue-600/35 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] mt-2"
                  >
                    {verifying ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Verifying code…
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        Verify Code
                        <ShieldCheck className="h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </form>
              )}

              {/* Navigation links */}
              <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-gray-500">
                <Link href="/login" className="hover:text-blue-600 hover:underline transition-colors">
                  Sign in
                </Link>
                <Link href="/register" className="hover:text-blue-600 hover:underline transition-colors">
                  Create an account
                </Link>
                <Link href="/forgot-password" className="hover:text-blue-600 hover:underline transition-colors">
                  Forgot password?
                </Link>
              </div>
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
