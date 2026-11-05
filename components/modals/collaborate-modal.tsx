"use client";

import { useState } from "react";
import { X, Loader2, Send, CheckCircle2, ChevronDown, Plus, Search } from "lucide-react";
import { toast } from "sonner";

export const COLLABORATION_EXPECTATIONS = [
  "Access to new customers",
  "Expand into new markets",
  "Increase revenue and sales",
  "Technology or software integration",
  "Product development",
  "Marketing and brand promotion",
  "Share industry expertise",
  "Access to infrastructure or resources",
  "Reduce operational costs",
  "Research and innovation",
  "Distribution and supply chain support",
  "Long-term strategic partnership",
  "Other",
] as const;

export const BUSINESS_OFFERINGS = [
  "Financial resources",
  "Technical expertise",
  "Software / Technology",
  "Marketing and advertising",
  "Customer base",
  "Distribution network",
  "Infrastructure",
  "Skilled workforce",
  "Industry connections",
  "Research capabilities",
  "Products or services",
  "Other",
] as const;

interface CollaborateModalProps {
  recipientId: string;
  companyName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CollaborateModal({
  recipientId,
  companyName,
  onClose,
  onSuccess,
}: CollaborateModalProps) {
  // Section 1: Expectations
  const [selectedExpectations, setSelectedExpectations] = useState<string[]>([]);
  const [expectationSearch, setExpectationSearch] = useState("");
  const [showExpectationDropdown, setShowExpectationDropdown] = useState(false);

  // Section 2: Offerings
  const [selectedOfferings, setSelectedOfferings] = useState<string[]>([]);
  const [offeringSearch, setOfferingSearch] = useState("");
  const [showOfferingDropdown, setShowOfferingDropdown] = useState(false);

  // Section 3: Additional Details
  const [contributionDesc, setContributionDesc] = useState("");
  const [resourcesAvailable, setResourcesAvailable] = useState("");
  const [expertiseCapabilities, setExpertiseCapabilities] = useState("");
  const [existingAssets, setExistingAssets] = useState("");

  // Section 4: Collaboration Overview
  const [overview, setOverview] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const toggleExpectation = (item: string) => {
    if (selectedExpectations.includes(item)) {
      setSelectedExpectations((prev) => prev.filter((i) => i !== item));
    } else {
      setSelectedExpectations((prev) => [...prev, item]);
    }
  };

  const toggleOffering = (item: string) => {
    if (selectedOfferings.includes(item)) {
      setSelectedOfferings((prev) => prev.filter((i) => i !== item));
    } else {
      setSelectedOfferings((prev) => [...prev, item]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (selectedExpectations.length === 0) {
      setError("Please select at least one collaboration expectation.");
      return;
    }

    if (selectedOfferings.length === 0) {
      setError("Please select at least one item your business can offer.");
      return;
    }

    if (!overview.trim() || overview.trim().length < 10) {
      setError("Please write a detailed collaboration overview (at least 10 characters).");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/marketplace/collaborate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId,
          expectations: selectedExpectations,
          offerings: selectedOfferings,
          contributionDesc: contributionDesc.trim() || undefined,
          resourcesAvailable: resourcesAvailable.trim() || undefined,
          expertiseCapabilities: expertiseCapabilities.trim() || undefined,
          existingAssets: existingAssets.trim() || undefined,
          overview: overview.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to submit collaboration request");
      }

      setSubmitted(true);
      toast.success("Collaboration request submitted successfully!");
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || "An error occurred while submitting your request.");
    } finally {
      setLoading(false);
    }
  };

  const filteredExpectations = COLLABORATION_EXPECTATIONS.filter((item) =>
    item.toLowerCase().includes(expectationSearch.toLowerCase().trim())
  );

  const filteredOfferings = BUSINESS_OFFERINGS.filter((item) =>
    item.toLowerCase().includes(offeringSearch.toLowerCase().trim())
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-white border border-[#E5E7EB] shadow-2xl my-8 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="border-b border-gray-100 bg-[#EFF6FF] px-6 py-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] bg-white border border-blue-200 px-2.5 py-0.5 rounded-full">
              B2B Collaboration Proposal
            </span>
            <h2 className="text-xl font-bold text-[#172033] mt-1">
              Collaborate with {companyName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-blue-100 text-[#64748B] hover:text-[#172033] transition"
          >
            <X size={20} />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-[#2563EB]">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-[#172033]">Proposal Sent!</h3>
            <p className="text-sm text-[#64748B] max-w-md mx-auto leading-relaxed">
              Your collaboration proposal has been securely delivered to{" "}
              <strong className="text-[#172033]">{companyName}</strong>. They will be notified to review your
              expectations, offerings, and overview.
            </p>
            <div className="pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-[#2563EB] px-6 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(85vh-90px)] overflow-y-auto">
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3.5 text-xs font-semibold text-red-700">
                {error}
              </div>
            )}

            {/* SECTION 1: Collaboration Expectations */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wide text-[#172033]">
                  1. Collaboration Expectations <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-[#64748B]">What do you expect from this partnership?</span>
              </div>

              {/* Selected Chips */}
              <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 rounded-xl border border-[#E5E7EB] bg-gray-50/60">
                {selectedExpectations.length === 0 ? (
                  <span className="text-xs text-gray-400 self-center px-1">
                    Select options below (e.g. Access to new customers, Technology integration...)
                  </span>
                ) : (
                  selectedExpectations.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-medium text-[#2563EB]"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => toggleExpectation(item)}
                        className="hover:text-blue-900 rounded-full"
                      >
                        <X size={13} />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Expandable Dropdown / Selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowExpectationDropdown((prev) => !prev)}
                  className="w-full flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-white px-3.5 py-2 text-xs font-medium text-[#172033] hover:bg-gray-50"
                >
                  <span className="flex items-center gap-1.5 text-[#64748B]">
                    <Plus size={14} className="text-[#2563EB]" /> Choose Expectations (
                    {selectedExpectations.length} selected)
                  </span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-150 text-[#64748B] ${
                      showExpectationDropdown ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showExpectationDropdown && (
                  <div className="mt-1 rounded-xl border border-[#E5E7EB] bg-white p-2.5 shadow-lg space-y-2 z-10 relative">
                    <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-2.5 py-1.5 bg-gray-50 text-xs">
                      <Search size={14} className="text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search expectations..."
                        value={expectationSearch}
                        onChange={(e) => setExpectationSearch(e.target.value)}
                        className="w-full bg-transparent outline-hidden text-xs text-gray-800"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                      {filteredExpectations.map((option) => {
                        const isSelected = selectedExpectations.includes(option);
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => toggleExpectation(option)}
                            className={`w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-left transition ${
                              isSelected
                                ? "bg-blue-50 text-[#2563EB] font-bold"
                                : "text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            <span>{option}</span>
                            {isSelected && <CheckCircle2 size={14} className="text-[#2563EB]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 2: What Can Our Business Offer? */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wide text-[#172033]">
                  2. What Can Our Business Offer? <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-[#64748B]">What assets or skills do you bring?</span>
              </div>

              {/* Selected Chips */}
              <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 rounded-xl border border-[#E5E7EB] bg-gray-50/60">
                {selectedOfferings.length === 0 ? (
                  <span className="text-xs text-gray-400 self-center px-1">
                    Select options below (e.g. Technical expertise, Customer base, Software...)
                  </span>
                ) : (
                  selectedOfferings.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-medium text-emerald-700"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => toggleOffering(item)}
                        className="hover:text-emerald-900 rounded-full"
                      >
                        <X size={13} />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Expandable Dropdown / Selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowOfferingDropdown((prev) => !prev)}
                  className="w-full flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-white px-3.5 py-2 text-xs font-medium text-[#172033] hover:bg-gray-50"
                >
                  <span className="flex items-center gap-1.5 text-[#64748B]">
                    <Plus size={14} className="text-[#2563EB]" /> Choose What You Offer (
                    {selectedOfferings.length} selected)
                  </span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-150 text-[#64748B] ${
                      showOfferingDropdown ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showOfferingDropdown && (
                  <div className="mt-1 rounded-xl border border-[#E5E7EB] bg-white p-2.5 shadow-lg space-y-2 z-10 relative">
                    <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-2.5 py-1.5 bg-gray-50 text-xs">
                      <Search size={14} className="text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search offerings..."
                        value={offeringSearch}
                        onChange={(e) => setOfferingSearch(e.target.value)}
                        className="w-full bg-transparent outline-hidden text-xs text-gray-800"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                      {filteredOfferings.map((option) => {
                        const isSelected = selectedOfferings.includes(option);
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => toggleOffering(option)}
                            className={`w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-left transition ${
                              isSelected
                                ? "bg-emerald-50 text-emerald-700 font-bold"
                                : "text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            <span>{option}</span>
                            {isSelected && <CheckCircle2 size={14} className="text-emerald-600" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 3: Additional Details (4 Text Input Areas) */}
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <label className="text-xs font-bold uppercase tracking-wide text-[#172033] block">
                3. Additional Details
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Field 1: Describe your contribution */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                    Describe your contribution
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Specific deliverables, time commitment, or responsibilities..."
                    value={contributionDesc}
                    onChange={(e) => setContributionDesc(e.target.value)}
                    className="w-full rounded-xl border border-[#E5E7EB] p-2.5 text-xs text-gray-900 outline-hidden focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                  />
                </div>

                {/* Field 2: Resources available for collaboration */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                    Resources available for collaboration
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Team members, budget, software licenses, or facilities..."
                    value={resourcesAvailable}
                    onChange={(e) => setResourcesAvailable(e.target.value)}
                    className="w-full rounded-xl border border-[#E5E7EB] p-2.5 text-xs text-gray-900 outline-hidden focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                  />
                </div>

                {/* Field 3: Expertise and capabilities */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                    Expertise and capabilities
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Domain knowledge, certifications, patents, or specialized skill sets..."
                    value={expertiseCapabilities}
                    onChange={(e) => setExpertiseCapabilities(e.target.value)}
                    className="w-full rounded-xl border border-[#E5E7EB] p-2.5 text-xs text-gray-900 outline-hidden focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                  />
                </div>

                {/* Field 4: Existing assets or infrastructure */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                    Existing assets or infrastructure
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Existing platforms, APIs, warehouses, distribution channels..."
                    value={existingAssets}
                    onChange={(e) => setExistingAssets(e.target.value)}
                    className="w-full rounded-xl border border-[#E5E7EB] p-2.5 text-xs text-gray-900 outline-hidden focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 4: Collaboration Overview */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wide text-[#172033]">
                  4. Collaboration Overview <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-gray-400">Written by you</span>
              </div>
              <textarea
                required
                rows={4}
                placeholder="Describe your collaboration proposal, what you hope to achieve, and how both businesses can benefit from working together."
                value={overview}
                onChange={(e) => setOverview(e.target.value)}
                className="w-full rounded-xl border border-[#E5E7EB] p-3 text-xs text-gray-900 outline-hidden focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] leading-relaxed"
              />
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Sending Proposal...</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Send Collaboration Request</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

