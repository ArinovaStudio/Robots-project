"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  INVESTOR_TYPES,
  INVESTMENT_RANGES,
  INVESTMENT_STAGES,
} from "@/lib/investor-options";

function normalizeUrl(url: string): string {
  const trimmed = (url || "").trim();
  if (!trimmed) return "";
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

export default function EditProfileModal({ profile, onClose, onSuccess }: any) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  const isInvestor =
    profile?.accountType === "INVESTOR" ||
    Boolean(profile?.investorType) ||
    (!profile?.companyName && profile?.firmName !== undefined);

  // Images
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    profile?.logoUrl || profile?.image || null
  );
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string | null>(
    profile?.bannerUrl || null
  );

  // Tag inputs
  const [dealInInput, setDealInInput] = useState("");
  const [lookingForInput, setLookingForInput] = useState("");
  const [sectorInput, setSectorInput] = useState("");

  // Company Form state
  const [companyForm, setCompanyForm] = useState({
    companyName: profile?.companyName || "",
    description: profile?.description || "",
    size: profile?.size ?? 1,
    type: profile?.type || "Startup",
    yearOfEstablishment:
      profile?.yearOfEstablishment ?? new Date().getFullYear(),
    website: profile?.website || "",
    location: profile?.location || "",
    dealIn: Array.isArray(profile?.dealIn) ? profile.dealIn : [],
    lookingFor: Array.isArray(profile?.lookingFor) ? profile.lookingFor : [],
  });

  // Investor Form state
  const [investorForm, setInvestorForm] = useState({
    name: profile?.name || "",
    investorType: profile?.investorType || INVESTOR_TYPES[0],
    firmName: profile?.firmName || "",
    sectors: Array.isArray(profile?.sectors)
      ? profile.sectors
      : ["Technology", "Healthcare"],
    stages: Array.isArray(profile?.stages) ? profile.stages : ["Seed"],
    investmentRange: profile?.investmentRange || INVESTMENT_RANGES[0],
    location: profile?.location || "",
    website: profile?.website || "",
    linkedInUrl: profile?.linkedInUrl || "",
    investmentThesis: profile?.investmentThesis || "",
    phone: profile?.phone || "",
  });

  useEffect(() => {
    setMounted(true);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [onClose]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      setBannerPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Tag helper for Company
  const handleAddCompanyTag = (
    field: "dealIn" | "lookingFor",
    inputVal: string,
    setInputVal: (v: string) => void
  ) => {
    const tag = inputVal.trim().replace(/,$/, "");
    if (tag && !companyForm[field].includes(tag)) {
      setCompanyForm((prev) => ({
        ...prev,
        [field]: [...prev[field], tag],
      }));
    }
    setInputVal("");
  };

  const handleRemoveCompanyTag = (
    field: "dealIn" | "lookingFor",
    tagToRemove: string
  ) => {
    setCompanyForm((prev) => ({
      ...prev,
      [field]: prev[field].filter((t: string) => t !== tagToRemove),
    }));
  };

  // Tag helper for Investor sectors
  const handleAddSector = () => {
    const tag = sectorInput.trim().replace(/,$/, "");
    if (tag && !investorForm.sectors.includes(tag)) {
      setInvestorForm((prev) => ({
        ...prev,
        sectors: [...prev.sectors, tag],
      }));
    }
    setSectorInput("");
  };

  const handleRemoveSector = (tagToRemove: string) => {
    setInvestorForm((prev) => ({
      ...prev,
      sectors: prev.sectors.filter((t: string) => t !== tagToRemove),
    }));
  };

  const toggleStage = (stage: (typeof INVESTMENT_STAGES)[number]) => {
    setInvestorForm((prev) => {
      const exists = prev.stages.includes(stage);
      if (exists) {
        if (prev.stages.length === 1) return prev; // keep at least 1
        return { ...prev, stages: prev.stages.filter((s: string) => s !== stage) };
      }
      return { ...prev, stages: [...prev.stages, stage] };
    });
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isInvestor) {
        // Prepare Investor payload
        const finalSectors = [...investorForm.sectors];
        if (sectorInput.trim()) {
          const s = sectorInput.trim().replace(/,$/, "");
          if (s && !finalSectors.includes(s)) finalSectors.push(s);
        }

        if (finalSectors.length === 0) {
          toast.error("Please add at least one sector.");
          setLoading(false);
          return;
        }

        const payload = new FormData();
        payload.append("name", investorForm.name.trim());
        payload.append("investorType", investorForm.investorType);
        payload.append("firmName", investorForm.firmName.trim());
        payload.append("investmentRange", investorForm.investmentRange);
        payload.append("location", investorForm.location.trim());
        payload.append("website", normalizeUrl(investorForm.website));
        payload.append("linkedInUrl", normalizeUrl(investorForm.linkedInUrl));
        payload.append("investmentThesis", investorForm.investmentThesis.trim());
        payload.append("phone", investorForm.phone.trim());

        finalSectors.forEach((sec: string) => payload.append("sectors", sec));
        investorForm.stages.forEach((stg: string) => payload.append("stages", stg));

        if (logoFile) {
          payload.append("photo", logoFile);
        }

        const res = await fetch("/api/investor/profile", {
          method: "PUT",
          body: payload,
        });
        const data = await res.json();

        if (data.success) {
          toast.success("Investor profile updated successfully");
          if (previewUrl && logoFile) URL.revokeObjectURL(previewUrl);
          onSuccess();
        } else {
          toast.error(data.message || "Failed to update profile");
        }
      } else {
        // Prepare Company payload
        const finalDealIn = [...companyForm.dealIn];
        if (dealInInput.trim()) {
          const d = dealInInput.trim().replace(/,$/, "");
          if (d && !finalDealIn.includes(d)) finalDealIn.push(d);
        }

        const finalLookingFor = [...companyForm.lookingFor];
        if (lookingForInput.trim()) {
          const l = lookingForInput.trim().replace(/,$/, "");
          if (l && !finalLookingFor.includes(l)) finalLookingFor.push(l);
        }

        if (finalDealIn.length === 0) {
          toast.error("Please add at least one service you deal in.");
          setLoading(false);
          return;
        }

        const payload = new FormData();
        payload.append("companyName", companyForm.companyName.trim());
        payload.append("type", companyForm.type.trim());
        payload.append("size", String(companyForm.size || 1));
        payload.append(
          "yearOfEstablishment",
          String(companyForm.yearOfEstablishment || new Date().getFullYear())
        );
        payload.append("website", normalizeUrl(companyForm.website));
        payload.append("location", companyForm.location.trim());
        payload.append("description", companyForm.description.trim());

        finalDealIn.forEach((item) => payload.append("dealIn", item));
        finalLookingFor.forEach((item) => payload.append("lookingFor", item));

        if (logoFile) {
          payload.append("logo", logoFile);
        }
        if (bannerFile) {
          payload.append("banner", bannerFile);
        }

        const res = await fetch("/api/company/profile", {
          method: "PUT",
          body: payload,
        });
        const data = await res.json();

        if (data.success) {
          toast.success("Company profile updated successfully");
          if (previewUrl && logoFile) URL.revokeObjectURL(previewUrl);
          if (bannerPreviewUrl && bannerFile)
            URL.revokeObjectURL(bannerPreviewUrl);
          onSuccess();
        } else {
          toast.error(data.message || "Failed to update profile");
        }
      }
    } catch {
      toast.error("An error occurred while saving. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6">
      <div className="w-full max-w-2xl bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {isInvestor ? "Edit Investor Profile" : "Edit Company Profile"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">
              Changes will be reflected across your public profile and discovery
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form */}
        <form
          id="edit-profile-form"
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6"
        >
          {/* Images Section */}
          <div className="relative mb-10">
            {/* Banner Area (company banner or investor cover) */}
            <div className="h-28 sm:h-32 w-full bg-[#1E3A5F] rounded-xl relative group overflow-hidden">
              {bannerPreviewUrl ? (
                <img
                  src={bannerPreviewUrl}
                  alt="Banner"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-[#1E3A5F]" />
              )}
              {!isInvestor && (
                <>
                  <label
                    htmlFor="banner-upload"
                    className="absolute top-3 right-3 cursor-pointer bg-black/60 text-white p-2 rounded-full border border-white/20 transition hover:bg-black/80"
                    title="Change Banner Image"
                  >
                    <Pencil size={14} />
                  </label>
                  <input
                    type="file"
                    id="banner-upload"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBannerChange}
                  />
                </>
              )}
            </div>

            {/* Avatar / Logo Area */}
            <div className="absolute -bottom-8 left-6">
              <input
                type="file"
                id="logo-upload"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
              <label
                htmlFor="logo-upload"
                className="relative cursor-pointer group block"
                title="Change Photo"
              >
                <div className="h-20 w-20 rounded-full border-4 border-white bg-slate-100 overflow-hidden flex items-center justify-center transition group-hover:opacity-90">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-blue-600">
                      {isInvestor
                        ? investorForm.name.charAt(0) || "I"
                        : companyForm.companyName.charAt(0) || "C"}
                    </span>
                  )}
                </div>
                <div className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full border-2 border-white transition group-hover:bg-blue-700">
                  <Pencil size={12} />
                </div>
              </label>
            </div>
          </div>

          {/* Form Fields: INVESTOR MODE */}
          {isInvestor ? (
            <div className="space-y-5 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    value={investorForm.name}
                    onChange={(e) =>
                      setInvestorForm({ ...investorForm, name: e.target.value })
                    }
                    placeholder="e.g. Alex Morgan"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Firm / Organization Name
                  </label>
                  <input
                    value={investorForm.firmName}
                    onChange={(e) =>
                      setInvestorForm({
                        ...investorForm,
                        firmName: e.target.value,
                      })
                    }
                    placeholder="e.g. Blue River Capital"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Investor Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={investorForm.investorType}
                    onChange={(e) =>
                      setInvestorForm({
                        ...investorForm,
                        investorType: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white"
                  >
                    {INVESTOR_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Typical Investment Range
                  </label>
                  <select
                    value={investorForm.investmentRange}
                    onChange={(e) =>
                      setInvestorForm({
                        ...investorForm,
                        investmentRange: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white"
                  >
                    {INVESTMENT_RANGES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Location
                  </label>
                  <input
                    value={investorForm.location}
                    onChange={(e) =>
                      setInvestorForm({
                        ...investorForm,
                        location: e.target.value,
                      })
                    }
                    placeholder="e.g. San Francisco, CA"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Website
                  </label>
                  <input
                    value={investorForm.website}
                    onChange={(e) =>
                      setInvestorForm({
                        ...investorForm,
                        website: e.target.value,
                      })
                    }
                    placeholder="https://..."
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    LinkedIn URL
                  </label>
                  <input
                    value={investorForm.linkedInUrl}
                    onChange={(e) =>
                      setInvestorForm({
                        ...investorForm,
                        linkedInUrl: e.target.value,
                      })
                    }
                    placeholder="https://linkedin.com/in/..."
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Preferred Stages */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">
                  Investment Stages <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {INVESTMENT_STAGES.map((stg) => {
                    const active = investorForm.stages.includes(stg);
                    return (
                      <button
                        type="button"
                        key={stg}
                        onClick={() => toggleStage(stg)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                          active
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        {stg}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sectors Tags */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">
                  Sectors of Interest <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    value={sectorInput}
                    onChange={(e) => setSectorInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        handleAddSector();
                      }
                    }}
                    placeholder="Type sector and press Enter (e.g. AI, SaaS, Fintech)..."
                    className="flex-1 rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddSector}
                    className="px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 font-semibold text-xs transition"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                {investorForm.sectors.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {investorForm.sectors.map((sec: string) => (
                      <span
                        key={sec}
                        className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1 rounded-lg text-xs font-semibold"
                      >
                        {sec}
                        <button
                          type="button"
                          onClick={() => handleRemoveSector(sec)}
                          className="text-blue-400 hover:text-red-600 transition"
                        >
                          <X size={13} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Investment Thesis */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Investment Thesis / Bio
                </label>
                <textarea
                  rows={3}
                  value={investorForm.investmentThesis}
                  onChange={(e) =>
                    setInvestorForm({
                      ...investorForm,
                      investmentThesis: e.target.value,
                    })
                  }
                  placeholder="What founders and opportunities do you look for?"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white resize-none"
                />
              </div>
            </div>
          ) : (
            /* Form Fields: COMPANY MODE */
            <div className="space-y-5 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    name="companyName"
                    value={companyForm.companyName}
                    onChange={(e) =>
                      setCompanyForm({
                        ...companyForm,
                        companyName: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Company Type <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    name="type"
                    value={companyForm.type}
                    onChange={(e) =>
                      setCompanyForm({ ...companyForm, type: e.target.value })
                    }
                    placeholder="e.g. Startup, Agency, Enterprise"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Team Size
                  </label>
                  <input
                    type="number"
                    min="1"
                    name="size"
                    value={companyForm.size}
                    onChange={(e) =>
                      setCompanyForm({
                        ...companyForm,
                        size: Number(e.target.value) || 1,
                      })
                    }
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Year Established
                  </label>
                  <input
                    type="number"
                    name="yearOfEstablishment"
                    value={companyForm.yearOfEstablishment}
                    onChange={(e) =>
                      setCompanyForm({
                        ...companyForm,
                        yearOfEstablishment:
                          Number(e.target.value) || new Date().getFullYear(),
                      })
                    }
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Location
                  </label>
                  <input
                    name="location"
                    value={companyForm.location}
                    onChange={(e) =>
                      setCompanyForm({
                        ...companyForm,
                        location: e.target.value,
                      })
                    }
                    placeholder="City, Country"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Website
                  </label>
                  <input
                    name="website"
                    value={companyForm.website}
                    onChange={(e) =>
                      setCompanyForm({
                        ...companyForm,
                        website: e.target.value,
                      })
                    }
                    placeholder="https://..."
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Deal In (Services Offered) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">
                  Services (Deal In) <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    value={dealInInput}
                    onChange={(e) => setDealInInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        handleAddCompanyTag(
                          "dealIn",
                          dealInInput,
                          setDealInInput
                        );
                      }
                    }}
                    placeholder="Type service and press Enter..."
                    className="flex-1 rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      handleAddCompanyTag("dealIn", dealInInput, setDealInInput)
                    }
                    className="px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 font-semibold text-xs transition"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                {companyForm.dealIn.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {companyForm.dealIn.map((tag: string) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1 rounded-lg text-xs font-semibold"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveCompanyTag("dealIn", tag)}
                          className="text-blue-400 hover:text-red-600 transition"
                        >
                          <X size={13} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Looking For */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">
                  Looking For (Partnerships, Capital, Skills)
                </label>
                <div className="flex gap-2">
                  <input
                    value={lookingForInput}
                    onChange={(e) => setLookingForInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        handleAddCompanyTag(
                          "lookingFor",
                          lookingForInput,
                          setLookingForInput
                        );
                      }
                    }}
                    placeholder="Type what you need and press Enter..."
                    className="flex-1 rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      handleAddCompanyTag(
                        "lookingFor",
                        lookingForInput,
                        setLookingForInput
                      )
                    }
                    className="px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 font-semibold text-xs transition"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                {companyForm.lookingFor.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {companyForm.lookingFor.map((tag: string) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1 rounded-lg text-xs font-semibold"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveCompanyTag("lookingFor", tag)
                          }
                          className="text-emerald-400 hover:text-red-600 transition"
                        >
                          <X size={13} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  name="description"
                  value={companyForm.description}
                  onChange={(e) =>
                    setCompanyForm({
                      ...companyForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Overview of your business, mission, and products..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white resize-none"
                />
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-white border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-profile-form"
            disabled={loading}
            className="flex-1 flex justify-center items-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
}
