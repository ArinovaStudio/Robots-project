"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Mail, ChevronRight } from "lucide-react";
import { FaFacebook as Facebook } from "react-icons/fa";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export default function CredentialsForm({ onNext }: { onNext: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

  return (
    <div className="space-y-3 mt-1">
      {error && <p className="text-red-500 text-sm">{error}</p>}
      
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input type="email" placeholder="Example@email.com" className="h-10 rounded-xl border-slate-200 bg-slate-50 pl-10" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">Password</label>
        <Input type="password" placeholder="At least 8 characters" className="h-10 rounded-xl border-slate-200 bg-slate-50" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">Confirm Password</label>
        <Input type="password" placeholder="Re-enter Password" className="h-10 rounded-xl border-slate-200 bg-slate-50" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">OTP</label>
        <div className="relative">
          <Input type="text" placeholder="******" className="h-10 rounded-xl border-slate-200 bg-slate-50 pr-20" value={otp} onChange={(e) => setOtp(e.target.value)} />
          <button type="button" onClick={handleSendOtp} disabled={otpLoading} className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-[#3F6FFF] hover:underline disabled:opacity-50">
            {otpLoading ? "Sending..." : "Send"}
          </button>
        </div>
      </div>

      <Button type="button" onClick={handleRegister} disabled={registerLoading} className="h-10 w-full rounded-xl bg-blue-600 text-base font-medium hover:bg-blue-700">
        {registerLoading ? "Processing..." : "Continue"}
        <ChevronRight className="ml-2 h-4 w-4" />
      </Button>

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