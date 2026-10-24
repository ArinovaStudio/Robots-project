"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Mail, ChevronRight, Eye, EyeOff, Check, X, KeyRound, RefreshCw, Clock, ArrowRight, Edit2 } from "lucide-react";
import { FaFacebook as Facebook } from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CredentialsForm({
  onNext,
  accountType = "BUSINESS",
}: {
  onNext: () => void;
  accountType?: "BUSINESS" | "INVESTOR";
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState("");

  // 30-second countdown timer effect
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const passwordCriteria = {
    hasMinLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const validateCredentials = () => {
    if (!email.trim()) {
      setError("Please enter your email address.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.");
      return false;
    }
    if (!passwordCriteria.hasMinLength || !passwordCriteria.hasNumber || !passwordCriteria.hasUpper || !passwordCriteria.hasSpecial) {
      setError("Please meet all password requirements before continuing.");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }
    setError("");
    return true;
  };

  // Sends the OTP and starts the 30s timer
  const handleSendOtp = async (isResend = false) => {
    if (!validateCredentials()) return;

    if (isResend) {
      setResendLoading(true);
    } else {
      setLoading(true);
    }
    setError("");

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), type: "VERIFY_EMAIL" }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message || "Failed to send verification code.");
        toast.error(data.message || "Failed to send verification code.");
      } else {
        setOtpSent(true);
        setTimer(30);
        toast.success(data.message || "Verification code sent to your email!");
      }
    } catch {
      setError("Failed to send verification code. Please check your network.");
      toast.error("Network error while sending code.");
    } finally {
      setLoading(false);
      setResendLoading(false);
    }
  };

  // Main Continue button handler (Integrated send-code + verify-and-register)
  const handleContinue = async () => {
    // If OTP has not been sent yet, validate fields, send OTP, and start 30s timer
    if (!otpSent) {
      await handleSendOtp(false);
      return;
    }

    // If OTP has been sent, validate OTP and register user
    if (!validateCredentials()) return;

    const trimmedOtp = otp.trim();
    if (!trimmedOtp || trimmedOtp.length !== 6) {
      setError("Please enter the 6-digit verification code sent to your email.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          otp: trimmedOtp,
          accountType,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message || "Registration failed. Please check your verification code.");
        toast.error(data.message || "Registration failed.");
      } else {
        toast.success("Account created successfully!");
        await signIn("credentials", { email: email.trim(), password, redirect: false });
        onNext();
      }
    } catch {
      setError("Registration failed. Please check your connection and try again.");
      toast.error("Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 mt-1 pb-4">
      {/* Social login (at top like login page) */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() =>
            signIn("google", {
              callbackUrl: accountType === "INVESTOR" ? "/signup/investor" : "/register/company",
            })
          }
          className="flex h-11 items-center justify-center gap-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-[0.98]"
        >
          <Image src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width={16} height={16} />
          Google
        </button>
        <button
          type="button"
          onClick={() =>
            signIn("facebook", {
              callbackUrl: accountType === "INVESTOR" ? "/signup/investor" : "/register/company",
            })
          }
          className="flex h-11 items-center justify-center gap-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-[0.98]"
        >
          <Facebook className="h-4 w-4 text-[#1877F2]" />
          Facebook
        </button>
      </div>

      {/* Divider */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs font-bold uppercase tracking-widest text-gray-400">
            or sign up with email
          </span>
        </div>
      </div>

      {/* Email input */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700">Email</label>
          {otpSent && (
            <button
              type="button"
              onClick={() => {
                setOtpSent(false);
                setOtp("");
                setError("");
              }}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 hover:underline"
            >
              <Edit2 className="w-3 h-3" /> Edit email
            </button>
          )}
        </div>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="email"
            placeholder="name@company.com"
            disabled={otpSent}
            className="h-10 rounded-xl border-slate-200 bg-slate-50 pl-10 disabled:opacity-75 disabled:bg-slate-100"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      {/* Password input */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">Password</label>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="At least 8 characters"
            disabled={otpSent}
            className="h-10 rounded-xl border-slate-200 bg-slate-50 pr-10 disabled:opacity-75 disabled:bg-slate-100"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            disabled={otpSent}
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Password Criteria */}
        {password && !otpSent && (
          <div className="pt-2 pb-1 grid grid-cols-2 gap-2 text-xs">
            <div className={`flex items-center gap-1.5 ${passwordCriteria.hasMinLength ? "text-green-600 font-medium" : "text-slate-500"}`}>
              {passwordCriteria.hasMinLength ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} 8+ characters
            </div>
            <div className={`flex items-center gap-1.5 ${passwordCriteria.hasUpper ? "text-green-600 font-medium" : "text-slate-500"}`}>
              {passwordCriteria.hasUpper ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Uppercase letter
            </div>
            <div className={`flex items-center gap-1.5 ${passwordCriteria.hasNumber ? "text-green-600 font-medium" : "text-slate-500"}`}>
              {passwordCriteria.hasNumber ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Number
            </div>
            <div className={`flex items-center gap-1.5 ${passwordCriteria.hasSpecial ? "text-green-600 font-medium" : "text-slate-500"}`}>
              {passwordCriteria.hasSpecial ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Special character
            </div>
          </div>
        )}
      </div>

      {/* Confirm Password input */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">Confirm Password</label>
        <div className="relative">
          <Input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Re-enter Password"
            disabled={otpSent}
            className="h-10 rounded-xl border-slate-200 bg-slate-50 pr-10 disabled:opacity-75 disabled:bg-slate-100"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button
            type="button"
            disabled={otpSent}
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* OTP Verification Section (Revealed once Continue is clicked, or toggled) */}
      {otpSent ? (
        <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 space-y-3 transition-all animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-blue-600" />
              Verification Code
            </label>
            <span className="text-xs text-blue-700 font-medium bg-blue-100 px-2 py-0.5 rounded-full">
              Sent to email
            </span>
          </div>

          <div className="relative">
            <Input
              type="text"
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="••••••"
              className="h-12 rounded-xl border-blue-200 bg-white font-mono text-center text-xl tracking-[0.4em] font-bold text-blue-950 focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:border-blue-500 shadow-sm"
              value={otp}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                setOtp(val);
              }}
            />
          </div>

          {/* Resend OTP Row with 30-Second Countdown Timer */}
          <div className="flex items-center justify-between text-xs pt-0.5">
            <span className="text-slate-500 font-medium">Didn't receive the code?</span>
            {timer > 0 ? (
              <span className="inline-flex items-center gap-1 font-semibold text-slate-500 bg-white/80 border border-slate-200/60 px-2.5 py-1 rounded-lg">
                <Clock className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                Resend in 0:{timer < 10 ? `0${timer}` : timer}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => handleSendOtp(true)}
                disabled={resendLoading}
                className="inline-flex items-center gap-1.5 font-bold text-blue-600 hover:text-blue-800 hover:underline disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resendLoading ? "animate-spin" : ""}`} />
                {resendLoading ? "Sending..." : "Resend code"}
              </button>
            )}
          </div>
        </div>
      ) : null}

      {/* Integrated Continue Button with progressive dynamic text */}
      <Button
        type="button"
        onClick={handleContinue}
        disabled={
          loading ||
          !email ||
          !password ||
          !confirmPassword ||
          (otpSent && otp.trim().length !== 6)
        }
        className="h-11 w-full rounded-xl bg-blue-600 text-base font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 hover:shadow-blue-600/35 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] mt-2"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            {!otpSent ? "Sending verification code…" : "Creating account…"}
          </span>
        ) : !otpSent ? (
          <span className="flex items-center justify-center gap-1.5">
            Continue
            <ChevronRight className="h-4 w-4" />
          </span>
        ) : otp.trim().length === 6 ? (
          <span className="flex items-center justify-center gap-1.5">
            Verify & Continue
            <ArrowRight className="h-4 w-4" />
          </span>
        ) : (
          <span className="flex items-center justify-center gap-1.5">
            Enter Verification Code
            <KeyRound className="h-4 w-4" />
          </span>
        )}
      </Button>

      {/* Error notification banner */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-600 space-y-2 animate-in fade-in duration-200">
          <p className="font-semibold text-center">{error}</p>
          {(error.toLowerCase().includes("already exists") || error.toLowerCase().includes("incomplete")) && (
            <div className="pt-2 border-t border-red-100 text-center text-xs text-gray-700">
              <span>Account already created? </span>
              <Link
                href={`/login?email=${encodeURIComponent(email)}`}
                className="font-bold text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
              >
                Sign in to complete setup <ChevronRight className="w-3 h-3 inline" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}