"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { AlertCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { INVESTMENT_RANGES, INVESTMENT_STAGES, INVESTOR_TYPES } from "@/lib/investor-options";

export default function InvestorDetailsForm() {
  const router = useRouter();
  const { update } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [investorType, setInvestorType] = useState("");
  const [firmName, setFirmName] = useState("");
  const [sectors, setSectors] = useState("");
  const [stages, setStages] = useState<string[]>([]);
  const [investmentRange, setInvestmentRange] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [linkedInUrl, setLinkedInUrl] = useState("");

  const toggleStage = (stage: string) => {
    setStages((current) =>
      current.includes(stage)
        ? current.filter((item) => item !== stage)
        : [...current, stage],
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const selectedSectors = sectors.split(",").map((sector) => sector.trim()).filter(Boolean);
    if (selectedSectors.length === 0 || stages.length === 0) {
      setError("Add at least one sector and select an investment stage.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      let formattedWebsite = website.trim();
      if (formattedWebsite && !/^https?:\/\//i.test(formattedWebsite)) {
        formattedWebsite = `https://${formattedWebsite}`;
      }

      let formattedLinkedIn = linkedInUrl.trim();
      if (formattedLinkedIn && !/^https?:\/\//i.test(formattedLinkedIn)) {
        formattedLinkedIn = `https://${formattedLinkedIn}`;
      }

      const response = await fetch("/api/investor/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          investorType,
          firmName: firmName.trim() || undefined,
          sectors: selectedSectors,
          stages,
          investmentRange,
          location: location.trim() || undefined,
          website: formattedWebsite || undefined,
          linkedInUrl: formattedLinkedIn || undefined,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setError(result.message || "Could not save your investor profile.");
        toast.error(result.message || "Could not save your investor profile.");
        return;
      }

      toast.success("Investor profile created successfully!");
      try {
        if (update) {
          await update();
        }
      } catch {
        // ignore
      }
      window.location.href = "/explore";
    } catch {
      setError("Network error. Please check your connection and try again.");
      toast.error("Could not save your investor profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-10">
      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="investor-name" className="text-sm font-medium text-slate-700">Full name *</label>
        <Input id="investor-name" required value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" className="h-11 rounded-xl bg-slate-50" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="investor-type" className="text-sm font-medium text-slate-700">Investor type *</label>
          <select id="investor-type" required value={investorType} onChange={(event) => setInvestorType(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm">
            <option value="">Select type</option>
            {INVESTOR_TYPES.map((type) => <option key={type}>{type}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="investor-firm" className="text-sm font-medium text-slate-700">Firm name <span className="text-slate-400">(optional)</span></label>
          <Input id="investor-firm" value={firmName} onChange={(event) => setFirmName(event.target.value)} placeholder="Fund or organization" className="h-11 rounded-xl bg-slate-50" />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="investor-sectors" className="text-sm font-medium text-slate-700">Sectors of interest *</label>
        <Input id="investor-sectors" required value={sectors} onChange={(event) => setSectors(event.target.value)} placeholder="AI, healthcare, climate (comma separated)" className="h-11 rounded-xl bg-slate-50" />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-slate-700">Investment stages *</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {INVESTMENT_STAGES.map((stage) => (
            <label key={stage} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${stages.includes(stage) ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600"}`}>
              <input type="checkbox" checked={stages.includes(stage)} onChange={() => toggleStage(stage)} className="accent-blue-600" />
              {stage}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-1.5">
        <label htmlFor="investor-range" className="text-sm font-medium text-slate-700">Typical investment range *</label>
        <select id="investor-range" required value={investmentRange} onChange={(event) => setInvestmentRange(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm">
          <option value="">Select a range</option>
          {INVESTMENT_RANGES.map((range) => <option key={range}>{range}</option>)}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="investor-location" className="text-sm font-medium text-slate-700">Location <span className="text-slate-400">(optional)</span></label>
          <Input id="investor-location" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="City, country" className="h-11 rounded-xl bg-slate-50" />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="investor-website" className="text-sm font-medium text-slate-700">Website <span className="text-slate-400">(optional)</span></label>
          <Input id="investor-website" type="text" value={website} onChange={(event) => setWebsite(event.target.value)} placeholder="https://example.com" className="h-11 rounded-xl bg-slate-50" />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="investor-linkedin" className="text-sm font-medium text-slate-700">LinkedIn profile <span className="text-slate-400">(optional)</span></label>
        <Input id="investor-linkedin" type="text" value={linkedInUrl} onChange={(event) => setLinkedInUrl(event.target.value)} placeholder="https://linkedin.com/in/yourname" className="h-11 rounded-xl bg-slate-50" />
      </div>

      <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl bg-blue-600 text-base font-semibold hover:bg-blue-700">
        {loading ? "Saving..." : "Complete investor profile"}
        <ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </form>
  );
}
