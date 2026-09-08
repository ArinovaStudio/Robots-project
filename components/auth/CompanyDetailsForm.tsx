"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEAL_IN_OPTIONS, LOOKING_FOR_OPTIONS } from "@/lib/constants";

export default function CompanyDetailsForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    companyName: "",
    description: "",
    size: "",
    type: "",
    yearOfEstablishment: "",
    website: "",
    location: "",
  });

  const [dealIn, setDealIn] = useState<string[]>([]);
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [logo, setLogo] = useState<File | null>(null);

  const addTag = (val: string, type: "dealIn" | "lookingFor") => {
    if (!val) return;
    if (type === "dealIn" && !dealIn.includes(val)) setDealIn([...dealIn, val]);
    if (type === "lookingFor" && !lookingFor.includes(val)) setLookingFor([...lookingFor, val]);
  };

  const removeTag = (val: string, type: "dealIn" | "lookingFor") => {
    if (type === "dealIn") setDealIn(dealIn.filter((item) => item !== val));
    if (type === "lookingFor") setLookingFor(lookingFor.filter((item) => item !== val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    const validationErrors: string[] = [];
    if (!formData.companyName.trim()) validationErrors.push("Company name is required.");
    if (!formData.description.trim() || formData.description.trim().length < 10) validationErrors.push("Description must be at least 10 characters.");
    if (!formData.size || Number(formData.size) <= 0) validationErrors.push("Company size must be a positive number.");
    if (!formData.yearOfEstablishment) validationErrors.push("Founded year is required.");
    if (!formData.type) validationErrors.push("Please select a company type.");
    if (dealIn.length === 0) validationErrors.push("Please select at least one service you deal in.");
    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) validationErrors.push("Website must be a valid URL (e.g. https://example.com).");

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      toast.error("Please fix the errors before submitting.");
      return;
    }

    setLoading(true);
    setErrors([]);

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => data.append(key, value));
    
    dealIn.forEach((item) => data.append("dealIn", item));
    lookingFor.forEach((item) => data.append("lookingFor", item));
    
    if (logo) data.append("logo", logo);

    try {
      const res = await fetch("/api/company/profile", { method: "POST", body: data });
      const result = await res.json();
      if (!result.success) {
        setErrors([result.message || "Something went wrong."]);
        toast.error(result.message || "Failed to create profile.");
      } else {
        toast.success("Company profile created successfully!");
        router.push("/feed");
      }
    } catch {
      setErrors(["Failed to create company profile. Please try again."]);
      toast.error("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 mt-3 pb-10">
      {errors.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 space-y-1">
          <div className="flex items-center gap-2 text-red-600 font-medium text-sm">
            <AlertCircle className="h-4 w-4" />
            Please fix the following:
          </div>
          <ul className="list-disc list-inside text-red-500 text-sm space-y-0.5 pl-1">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Basic Info */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Company Name <span className="text-red-500">*</span></label>
        <Input placeholder="Arinova Studio" required className="h-12 rounded-xl border-slate-200 bg-slate-50" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Company Description <span className="text-red-500">*</span></label>
        <Input placeholder="Brief overview of your business..." required className="h-12 rounded-xl border-slate-200 bg-slate-50" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Size <span className="text-red-500">*</span></label>
          <Input type="number" placeholder="100" required className="h-12 rounded-xl border-slate-200 bg-slate-50" value={formData.size} onChange={(e) => setFormData({ ...formData, size: e.target.value })} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Founded Year <span className="text-red-500">*</span></label>
          <Input type="number" placeholder="2024" required className="h-12 rounded-xl border-slate-200 bg-slate-50" value={formData.yearOfEstablishment} onChange={(e) => setFormData({ ...formData, yearOfEstablishment: e.target.value })} />
        </div>
      </div>

      {/* Optional Fields: Website & Location */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Website URL (Optional)</label>
        <Input placeholder="https://arinova.com" className="h-12 rounded-xl border-slate-200 bg-slate-50" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Location (Optional)</label>
        <Input placeholder="Faridabad, Haryana" className="h-12 rounded-xl border-slate-200 bg-slate-50" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
      </div>

      {/* Multi-Select: Deal In */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Services You Deal In <span className="text-red-500">*</span></label>
        <div className="flex flex-wrap gap-2 mb-2">
          {dealIn.map((item) => (
            <span key={item} className="flex items-center gap-1 bg-[#3F6FFF]/10 text-[#3F6FFF] px-3 py-1 rounded-full text-xs font-semibold">
              {item}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(item, "dealIn")} />
            </span>
          ))}
        </div>
        <div className="relative">
          <select className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-500 outline-none" value="" onChange={(e) => addTag(e.target.value, "dealIn")}>
            <option value="">Add Service...</option>
            {DEAL_IN_OPTIONS.filter(opt => !dealIn.includes(opt)).map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <ChevronRight className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 rotate-90" />
        </div>
      </div>

      {/* Multi-Select: Looking For */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">What are you Looking For?</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {lookingFor.map((item) => (
            <span key={item} className="flex items-center gap-1 bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold">
              {item}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(item, "lookingFor")} />
            </span>
          ))}
        </div>
        <div className="relative">
          <select className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-500 outline-none" value="" onChange={(e) => addTag(e.target.value, "lookingFor")}>
            <option value="">Add Preference...</option>
            {LOOKING_FOR_OPTIONS.filter(opt => !lookingFor.includes(opt)).map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <ChevronRight className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 rotate-90" />
        </div>
      </div>

      {/* Company Type & Logo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <label className="text-sm font-medium text-slate-700">Company Logo</label>
          <div className="relative">
            <input id="company-logo" type="file" accept="image/*" className="hidden" onChange={(e) => setLogo(e.target.files?.[0] || null)} />
            <div className="flex h-12 items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4">
              <span className="text-sm text-slate-400 truncate max-w-[120px]">{logo ? logo.name : "Upload"}</span>
              <label htmlFor="company-logo" className="cursor-pointer text-sm font-medium text-[#3F6FFF] hover:underline">Choose File</label>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={loading} className="h-12 flex-1 rounded-xl bg-blue-600 text-base font-medium hover:bg-blue-700">
          {loading ? "Saving..." : "Complete Setup"}
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}