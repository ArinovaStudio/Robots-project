"use client";

import { useEffect, useState } from "react";
import {
  Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, Mail, ShieldCheck, ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { useUserStore } from "@/store/AuthStore";

type Step = "email" | "otp" | "password";

const inputClass =
  "w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";
const primaryBtn =
  "w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed";

const STEPS: { id: Step; label: string }[] = [
  { id: "email", label: "Email" },
  { id: "otp", label: "Verify" },
  { id: "password", label: "New password" },
];

export default function ChangePasswordSection() {
  const accountEmail = useUserStore((state) => state.user?.email) || "";

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [show, setShow] = useState({ new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Prefill with the account email once it's available
  useEffect(() => {
    if (accountEmail && !email) setEmail(accountEmail);
  }, [accountEmail, email]);

  // Resend cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const requirements = [
    { label: "At least 8 characters", met: newPassword.length >= 8 },
    { label: "At least one uppercase letter", met: /[A-Z]/.test(newPassword) },
    { label: "At least one number", met: /[0-9]/.test(newPassword) },
    {
      label: "Passwords match",
      met: newPassword === confirmPassword && confirmPassword.length > 0,
    },
  ];
  const allRequirementsMet = requirements.every((r) => r.met);

  const reset = () => {
    setStep("email");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setCooldown(0);
  };

  const sendOtp = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    if (accountEmail && trimmed !== accountEmail.trim().toLowerCase()) {
      toast.error("Please enter the email address of your account");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, type: "RESET_PASSWORD" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Verification code sent to your email");
        setSuccess(false);
        setOtp("");
        setStep("otp");
        setCooldown(30);
      } else {
        toast.error(data.message || "Failed to send verification code");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp, type: "RESET_PASSWORD" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Email verified");
        setStep("password");
      } else {
        toast.error(data.message || "Invalid verification code");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allRequirementsMet) return;

    setLoading(true);
    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp,
          newPassword,
          confirmPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Password changed successfully!");
        reset();
        setSuccess(true);
      } else {
        toast.error(data.message || "Failed to change password");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const currentIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <div id="change-password" className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm scroll-mt-24">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl">
          <Lock className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
          <p className="text-sm text-gray-500">Verify your email with a one-time code to update your password.</p>
        </div>
      </div>

      {/* Step indicator */}
      <ol className="flex items-center gap-2 mb-6 text-xs font-medium">
        {STEPS.map((s, i) => (
          <li key={s.id} className="flex items-center gap-2">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                i <= currentIndex ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-500"
              }`}
            >
              {i + 1}
            </span>
            <span className={i <= currentIndex ? "text-gray-900" : "text-gray-400"}>{s.label}</span>
            {i < STEPS.length - 1 && <span className="w-6 h-px bg-gray-300" />}
          </li>
        ))}
      </ol>

      {success && (
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg px-4 py-3 mb-6 text-sm font-medium">
          <CheckCircle className="w-4 h-4 shrink-0" />
          Password changed successfully!
        </div>
      )}

      {/* Step 1: email */}
      {step === "email" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendOtp();
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="cp-email" className="block text-sm font-medium text-gray-700 mb-1.5">
              Email address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="cp-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your account email"
                className={`${inputClass} pl-9`}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1.5">We&apos;ll send a 6-digit code to this address.</p>
          </div>
          <button type="submit" disabled={loading || !email.trim()} className={primaryBtn}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Sending code…
              </>
            ) : (
              "Send verification code"
            )}
          </button>
        </form>
      )}

      {/* Step 2: OTP */}
      {step === "otp" && (
        <form onSubmit={verifyOtp} className="space-y-4">
          <div>
            <label htmlFor="cp-otp" className="block text-sm font-medium text-gray-700 mb-1.5">
              Verification code
            </label>
            <input
              id="cp-otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              placeholder="000000"
              className={`${inputClass} text-center text-lg tracking-[0.5em] font-semibold`}
            />
            <p className="text-xs text-gray-500 mt-1.5">
              Enter the 6-digit code sent to <span className="font-medium text-gray-700">{email}</span>. It expires in 10 minutes.
            </p>
          </div>

          <button type="submit" disabled={loading || otp.length !== 6} className={primaryBtn}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Verifying…
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" /> Verify code
              </>
            )}
          </button>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Change email
            </button>
            <button
              type="button"
              onClick={sendOtp}
              disabled={loading || cooldown > 0}
              className="font-medium text-emerald-600 hover:text-emerald-700 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
            </button>
          </div>
        </form>
      )}

      {/* Step 3: new password */}
      {step === "password" && (
        <form onSubmit={changePassword} className="space-y-4">
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg px-4 py-2.5 text-sm font-medium">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            Email verified. Choose your new password.
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <input
                id="newPassword"
                type={show.new ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Enter your new password"
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShow((s) => ({ ...s, new: !s.new }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {show.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={show.confirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm your new password"
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShow((s) => ({ ...s, confirm: !s.confirm }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {show.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {newPassword.length > 0 && (
            <ul className="space-y-1.5 pt-1">
              {requirements.map((req) => (
                <li key={req.label} className="flex items-center gap-2 text-xs">
                  {req.met ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                  )}
                  <span className={req.met ? "text-emerald-600" : "text-gray-400"}>{req.label}</span>
                </li>
              ))}
            </ul>
          )}

          <button type="submit" disabled={loading || !allRequirementsMet} className={primaryBtn}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Changing password…
              </>
            ) : (
              "Change Password"
            )}
          </button>
        </form>
      )}
    </div>
  );
}