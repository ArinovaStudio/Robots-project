"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CompanyDetailsForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    companyName: "",
    description: "",
    size: "",
    type: "",
    yearOfEstablishment: "",
    dealIn: "",
  });
  const [logo, setLogo] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const data = new FormData();
    data.append("companyName", formData.companyName);
    data.append("description", formData.description);
    data.append("size", formData.size);
    data.append("type", formData.type);
    data.append("yearOfEstablishment", formData.yearOfEstablishment);
    data.append("dealIn", formData.dealIn);
    
    if (logo) {
      data.append("logo", logo);
    }

    try {
      const res = await fetch("/api/company/profile", {
        method: "POST",
        body: data,
      });
      const result = await res.json();

      if (!result.success) {
        setError(result.message);
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Failed to create company profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 mt-3">
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Company Name <span className="text-red-500">*</span></label>
        <Input placeholder="Arinova Studio" required className="h-12 rounded-xl border-slate-200 bg-slate-50" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Company Description <span className="text-red-500">*</span></label>
        <Input placeholder="Lorem ispem" required className="h-12 rounded-xl border-slate-200 bg-slate-50" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Company Logo</label>
        <div className="relative">
          <input id="company-logo" type="file" accept="image/*" className="hidden" onChange={(e) => setLogo(e.target.files?.[0] || null)} />
          <div className="flex h-12 items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4">
            <span className="text-sm text-slate-400">{logo ? logo.name : "Upload"}</span>
            <label htmlFor="company-logo" className="cursor-pointer text-sm font-medium text-[#3F6FFF] hover:underline">Choose File</label>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Company Size (Total Employees) <span className="text-red-500">*</span></label>
        <Input type="number" placeholder="100" required className="h-12 rounded-xl border-slate-200 bg-slate-50" value={formData.size} onChange={(e) => setFormData({ ...formData, size: e.target.value })} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Company Type <span className="text-red-500">*</span></label>
        <div className="relative">
          <select required className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-500 outline-none" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
            <option value="">Select</option>
            <option value="Startup">Startup</option>
            <option value="Agency">Agency</option>
            <option value="Enterprise">Enterprise</option>
            <option value="SaaS">SaaS</option>
          </select>
          <ChevronRight className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Year of establishment</label>
        <Input type="number" placeholder="2025" required className="h-12 rounded-xl border-slate-200 bg-slate-50" value={formData.yearOfEstablishment} onChange={(e) => setFormData({ ...formData, yearOfEstablishment: e.target.value })} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Deal In</label>
        <div className="relative">
          <select required className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-500 outline-none" value={formData.dealIn} onChange={(e) => setFormData({ ...formData, dealIn: e.target.value })}>
            <option value="">Select Primary Service</option>
            <option value="Web Development">Web Development</option>
            <option value="Mobile Apps">Mobile Apps</option>
            <option value="UI/UX Design">UI/UX Design</option>
            <option value="AI Solutions">AI Solutions</option>
          </select>
          <ChevronRight className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={loading} className="h-12 flex-1 rounded-xl bg-[#0f2230] text-base font-medium hover:bg-[#132c3d]">
          {loading ? "Saving..." : "Sign in"}
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}