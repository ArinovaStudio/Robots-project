"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Mail, ChevronRight, Eye, EyeOff, Check, X } from "lucide-react";
import { FaFacebook as Facebook } from "react-icons/fa";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export default function CredentialsForm({ onNext }: { onNext: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOtp = async () => {
    if (!email) return setError("Please enter an email first");
    setError("");
    setOtpLoading(true);
    
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: "VERIFY_EMAIL" }),
      });
      const data = await res.json();
      if (!data.success) setError(data.message);
      else toast.success("OTP Sent! Check your email.");
    } catch {
      setError("Failed to send OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleRegister = async () => {
    if (password !== confirmPassword) return setError("Passwords do not match");
    if (!passwordCriteria.hasMinLength || !passwordCriteria.hasNumber || !passwordCriteria.hasUpper || !passwordCriteria.hasSpecial) {
      return setError("Please meet all password criteria");
    }
    
    setError("");
    setRegisterLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, otp }),
      });
      const data = await res.json();
      
      if (!data.success) {
        setError(data.message);
      } else {
        await signIn("credentials", { email, password, redirect: false });
        onNext();
      }
    } catch {
      setError("Registration failed");
    } finally {
      setRegisterLoading(false);
    }
  };

  const passwordCriteria = {
    hasMinLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  return (
    <div className="space-y-3 mt-1 pb-4">
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input type="email" placeholder="Example@email.com" className="h-10 rounded-xl border-slate-200 bg-slate-50 pl-10" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">Password</label>
        <div className="relative">
          <Input type={showPassword ? "text" : "password"} placeholder="At least 8 characters" className="h-10 rounded-xl border-slate-200 bg-slate-50 pr-10" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        
        {/* Password Criteria */}
        {password && (
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

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">Confirm Password</label>
        <div className="relative">
          <Input type={showConfirmPassword ? "text" : "password"} placeholder="Re-enter Password" className="h-10 rounded-xl border-slate-200 bg-slate-50 pr-10" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">OTP</label>
        <div className="relative">
          <Input type="text" placeholder="******" className="h-10 rounded-xl border-slate-200 bg-slate-50 pr-20" value={otp} onChange={(e) => setOtp(e.target.value)} />
          <button type="button" onClick={handleSendOtp} disabled={otpLoading || !email} className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-[#3F6FFF] hover:underline disabled:opacity-50 disabled:no-underline">
            {otpLoading ? "Sending..." : "Send"}
          </button>
        </div>
      </div>

      <Button type="button" onClick={handleRegister} disabled={registerLoading || !email || !password || !confirmPassword || !otp} className="h-10 w-full rounded-xl bg-blue-600 text-base font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
        {registerLoading ? "Processing..." : "Continue"}
        <ChevronRight className="ml-2 h-4 w-4" />
      </Button>

      {error && <p className="text-red-500 text-sm text-center pt-1">{error}</p>}

      {/* Divider */}
      <div className="my-4 flex items-center gap-4">
        <Separator className="flex-1" />
        <span className="text-sm text-slate-400">Or</span>
        <Separator className="flex-1" />
      </div>

      {/* Social Buttons */}
      <div className="space-y-3">
        <Button onClick={() => signIn("google", { callbackUrl: "/signup" })} variant="outline" type="button" className="h-10 w-full justify-center gap-3 rounded-xl border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100">
          <Image src="https://www.svgrepo.com/show/475656/google-color.svg" alt="google" width={18} height={18} />
          Sign in with Google
        </Button>

        <Button onClick={() => signIn("facebook", { callbackUrl: "/signup" })} variant="outline" type="button" className="h-10 w-full justify-center gap-3 rounded-xl border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100">
          <Facebook className="h-5 w-5 fill-[#1877F2] text-[#1877F2]" />
          Sign in with Facebook
        </Button>
      </div>
    </div>
  );
}