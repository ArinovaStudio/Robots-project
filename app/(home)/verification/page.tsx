"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck, User, Building, Mail, Phone, Calendar, MapPin,
  Link as LinkIcon, Plus, Trash2, UploadCloud, FileText, CheckCircle2,
  AlertCircle, ArrowLeft, Loader2, Info, X
} from "lucide-react";
import { toast } from "sonner";
import VerificationBadge from "@/components/ui/VerificationBadge";

interface SocialLink {
  platform: string;
  url: string;
}

export default function VerificationPage() {
  const router = useRouter();

  // Loading & submission state
  const [initialLoading, setInitialLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userStatus, setUserStatus] = useState<string>("UNVERIFIED");

  // Basic Information Form State
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [location, setLocation] = useState("");

  // About You Form State
  const [reason, setReason] = useState("");
  const [accountUsage, setAccountUsage] = useState("");
  const [accountType, setAccountType] = useState("Business / Company");
  const [additionalInfo, setAdditionalInfo] = useState("");

  // Online Presence Links
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([
    { platform: "Website", url: "" },
    { platform: "LinkedIn", url: "" },
  ]);

  // Identity Document State
  const [idDocument, setIdDocument] = useState<File | null>(null);
  const [idDocumentPreview, setIdDocumentPreview] = useState<string | null>(null);
  const [existingIdDocName, setExistingIdDocName] = useState<string | null>(null);

  // Supporting Document State
  const [supportingDoc, setSupportingDoc] = useState<File | null>(null);
  const [existingSupportingDocName, setExistingSupportingDocName] = useState<string | null>(null);

  // Status message state
  const [infoRequestMsg, setInfoRequestMsg] = useState<string | null>(null);
  const [rejectionMsg, setRejectionMsg] = useState<string | null>(null);

  // Declaration State
  const [declaration, setDeclaration] = useState(false);

  // File Input Refs
  const idFileInputRef = useRef<HTMLInputElement>(null);
  const supportingFileInputRef = useRef<HTMLInputElement>(null);

  // Drag states
  const [idDragActive, setIdDragActive] = useState(false);
  const [supportingDragActive, setSupportingDragActive] = useState(false);

  // Fetch initial profile & application data
  useEffect(() => {
    async function fetchUserData() {
      try {
        const res = await fetch("/api/verification");
        const json = await res.json();
        if (json.success && json.data) {
          const userData = json.data;
          setUserStatus(userData.verificationStatus || "UNVERIFIED");

          setFullName(userData.name || userData.company?.companyName || "");
          setUsername(userData.name ? `@${userData.name.toLowerCase().replace(/\s+/g, "_")}` : "");
          setEmail(userData.email || "");
          setLocation(userData.company?.location || "");

          if (userData.verificationApplication) {
            const app = userData.verificationApplication;
            if (app.fullName) setFullName(app.fullName);
            if (app.username) setUsername(app.username);
            if (app.email) setEmail(app.email);
            if (app.phone) setPhone(app.phone || "");
            if (app.dob) setDob(app.dob || "");
            if (app.location) setLocation(app.location || "");

            if (app.reason) setReason(app.reason);
            if (app.accountUsage) setAccountUsage(app.accountUsage);
            if (app.accountType) setAccountType(app.accountType);
            if (app.additionalInfo) setAdditionalInfo(app.additionalInfo || "");

            if (app.infoRequestMessage) setInfoRequestMsg(app.infoRequestMessage);
            if (app.rejectionReason) setRejectionMsg(app.rejectionReason);

            if (app.socialLinks && Array.isArray(app.socialLinks) && app.socialLinks.length > 0) {
              const parsedLinks = app.socialLinks.map((urlStr: string) => {
                if (urlStr.includes("linkedin")) return { platform: "LinkedIn", url: urlStr };
                if (urlStr.includes("github")) return { platform: "GitHub", url: urlStr };
                if (urlStr.includes("twitter") || urlStr.includes("x.com")) return { platform: "X / Twitter", url: urlStr };
                if (urlStr.includes("instagram")) return { platform: "Instagram", url: urlStr };
                return { platform: "Website", url: urlStr };
              });
              setSocialLinks(parsedLinks);
            }

            if (app.idDocumentName) setExistingIdDocName(app.idDocumentName);
            if (app.supportingDocName) setExistingSupportingDocName(app.supportingDocName);
          }
        }
      } catch (err) {
        console.error("Failed to load user verification data:", err);
      } finally {
        setInitialLoading(false);
      }
    }
    fetchUserData();
  }, []);

  // Handle Online Presence Links
  const addSocialLink = () => {
    setSocialLinks([...socialLinks, { platform: "Website", url: "" }]);
  };

  const removeSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const updateSocialLink = (index: number, field: "platform" | "url", value: string) => {
    const updated = [...socialLinks];
    updated[index][field] = value;
    setSocialLinks(updated);
  };

  // Document File Handlers
  const handleIdFileSelect = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("ID Document size must be less than 10MB");
      return;
    }
    const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      toast.error("Unsupported file type. Please upload a PDF, PNG, JPG, or WEBP.");
      return;
    }
    setIdDocument(file);
    if (file.type.startsWith("image/")) {
      setIdDocumentPreview(URL.createObjectURL(file));
    } else {
      setIdDocumentPreview(null);
    }
  };

  const handleSupportingFileSelect = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Supporting Document size must be less than 10MB");
      return;
    }
    setSupportingDoc(file);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !username.trim() || !email.trim()) {
      toast.error("Please complete all basic information fields.");
      return;
    }

    if (!reason.trim() || !accountUsage.trim()) {
      toast.error("Please explain why you are requesting verification.");
      return;
    }

    if (!idDocument && !existingIdDocName) {
      toast.error("Please upload your identity verification document.");
      return;
    }

    if (!declaration) {
      toast.error("You must confirm the declaration checkbox before submitting.");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("fullName", fullName);
      formData.append("username", username);
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("dob", dob);
      formData.append("location", location);

      formData.append("reason", reason);
      formData.append("accountUsage", accountUsage);
      formData.append("accountType", accountType);
      formData.append("additionalInfo", additionalInfo);

      const filteredLinks = socialLinks.map(l => l.url).filter(url => url.trim() !== "");
      formData.append("socialLinks", JSON.stringify(filteredLinks));

      formData.append("declaration", declaration ? "true" : "false");

      if (idDocument) {
        formData.append("idDocument", idDocument);
      }
      if (supportingDoc) {
        formData.append("supportingDoc", supportingDoc);
      }

      const res = await fetch("/api/verification", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (json.success) {
        toast.success("Verification request submitted successfully!");
        setUserStatus("PENDING");
        router.push("/profile");
      } else {
        toast.error(json.message || "Submission failed. Please try again.");
      }
    } catch (err) {
      console.error("Submission error:", err);
      toast.error("An error occurred while submitting your application.");
    } finally {
      setSubmitting(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8 pb-24">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b pb-5">
        <div>
          <button
            onClick={() => router.push("/profile")}
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition mb-2"
          >
            <ArrowLeft size={16} /> Back to Profile
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Profile Verification Application
            </h1>
            <VerificationBadge status={userStatus} size="md" />
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Submit your identity and account details to receive a verified profile badge.
          </p>
        </div>
      </div>

      {/* Verification Status Banners */}
      {userStatus === "PENDING" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-800">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Application Currently Pending Review</h4>
            <p className="text-xs text-amber-700 mt-0.5">
              Your verification request has been received and is under review by our administration team.
            </p>
          </div>
        </div>
      )}

      {userStatus === "MORE_INFO_REQUIRED" && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3 text-purple-900">
          <AlertCircle className="h-5 w-5 shrink-0 text-purple-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Additional Information Required</h4>
            <p className="text-xs text-purple-800 mt-0.5 font-medium">
              The reviewer requested the following update before approving your verification:
            </p>
            {infoRequestMsg && (
              <p className="text-xs text-purple-900 bg-white/80 border border-purple-200 p-2.5 rounded-lg mt-2 font-normal leading-relaxed">
                "{infoRequestMsg}"
              </p>
            )}
            <p className="text-[11px] text-purple-600 mt-2">
              Please review your details or upload the requested document below and click <strong>Submit Verification Request</strong> to resubmit.
            </p>
          </div>
        </div>
      )}

      {userStatus === "REJECTED" && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 text-rose-900">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Verification Application Declined</h4>
            {rejectionMsg && (
              <p className="text-xs text-rose-900 bg-white/80 border border-rose-200 p-2.5 rounded-lg mt-1 font-normal leading-relaxed">
                Reason: "{rejectionMsg}"
              </p>
            )}
            <p className="text-[11px] text-rose-700 mt-2">
              You can correct your information or upload a valid document below to reapply.
            </p>
          </div>
        </div>
      )}

      {userStatus === "VERIFIED" && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 text-blue-800">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">You are a Verified Member</h4>
            <p className="text-xs text-blue-700 mt-0.5">
              Your profile is verified with an official blue tick badge.
            </p>
          </div>
        </div>
      )}

      {/* Application Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* SECTION 1: Basic Information */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b pb-3 text-slate-900 font-bold text-lg">
            <User className="text-blue-600" size={20} />
            <span>1. Basic Information</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. John Doe / Robotics Inc."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="@username"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                readOnly
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-600 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Date of Birth / Foundation Date
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Country / Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. San Francisco, CA, USA"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: About You */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b pb-3 text-slate-900 font-bold text-lg">
            <Building className="text-blue-600" size={20} />
            <span>2. About You & Your Account</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Account Category / Type <span className="text-red-500">*</span>
              </label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Business / Company">Business / Company</option>
                <option value="Startup / Tech Team">Startup / Tech Team</option>
                <option value="Individual Professional">Individual Professional</option>
                <option value="Researcher / Scientist">Researcher / Scientist</option>
                <option value="Organization / Non-Profit">Organization / Non-Profit</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Why do you want to get verified? <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                rows={3}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Explain why official verification is important for your profile..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                What do you use this account for? <span className="text-red-500">*</span>
              </label>
              <textarea
                value={accountUsage}
                onChange={(e) => setAccountUsage(e.target.value)}
                required
                rows={3}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your primary activities, industry focus, and audience..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Additional Information (Optional)
              </label>
              <textarea
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                rows={2}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any notable achievements, awards, press coverage, or background info..."
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: Online Presence */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-lg">
              <LinkIcon className="text-blue-600" size={20} />
              <span>3. Online Presence</span>
            </div>
            <button
              type="button"
              onClick={addSocialLink}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition"
            >
              <Plus size={14} /> Add Link
            </button>
          </div>

          <p className="text-xs text-slate-500">
            Provide links to your official website and active public profiles to help verify your identity.
          </p>

          <div className="space-y-3">
            {socialLinks.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <select
                  value={item.platform}
                  onChange={(e) => updateSocialLink(idx, "platform", e.target.value)}
                  className="w-36 shrink-0 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
                >
                  <option value="Website">Website</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="GitHub">GitHub</option>
                  <option value="X / Twitter">X / Twitter</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Other">Other Profile</option>
                </select>

                <input
                  type="url"
                  value={item.url}
                  onChange={(e) => updateSocialLink(idx, "url", e.target.value)}
                  className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://..."
                />

                {socialLinks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSocialLink(idx)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                    title="Remove link"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 4: Identity Verification */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b pb-3 text-slate-900 font-bold text-lg">
            <ShieldCheck className="text-blue-600" size={20} />
            <span>4. Identity Verification Document</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-sm">
              <Info size={16} className="text-blue-600" /> Accepted Verification Documents
            </div>
            <ul className="list-disc list-inside space-y-1 pl-1 text-slate-600">
              <li><strong>For Individuals:</strong> Passport, Government-issued National ID, or Driver's License</li>
              <li><strong>For Businesses / Companies:</strong> Business Registration Certificate, Articles of Incorporation, or Tax ID document</li>
            </ul>
            <p className="text-[11px] text-slate-400 pt-1">
              * Max file size: 10MB. Supported formats: PDF, PNG, JPG, WEBP.
            </p>
          </div>

          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIdDragActive(true); }}
            onDragLeave={() => setIdDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIdDragActive(false);
              if (e.dataTransfer.files?.[0]) handleIdFileSelect(e.dataTransfer.files[0]);
            }}
            onClick={() => idFileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center ${
              idDragActive ? "border-blue-500 bg-blue-50/50" : "border-slate-300 hover:border-slate-400 bg-slate-50/50"
            }`}
          >
            <input
              ref={idFileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleIdFileSelect(e.target.files[0]);
              }}
            />

            <UploadCloud className="h-10 w-10 text-slate-400 mb-2" />

            {idDocument ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-blue-600 flex items-center justify-center gap-1.5">
                  <FileText size={16} /> {idDocument.name}
                </p>
                <p className="text-xs text-slate-500">{(idDocument.size / (1024 * 1024)).toFixed(2)} MB</p>

                {idDocumentPreview && (
                  <div className="mt-2 h-28 w-44 relative rounded-lg overflow-hidden border mx-auto">
                    <img src={idDocumentPreview} alt="Preview" className="h-full w-full object-cover" />
                  </div>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIdDocument(null);
                    setIdDocumentPreview(null);
                  }}
                  className="mt-2 inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
                >
                  <X size={14} /> Remove / Replace
                </button>
              </div>
            ) : existingIdDocName ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-emerald-600 flex items-center justify-center gap-1.5">
                  <CheckCircle2 size={16} /> Uploaded: {existingIdDocName}
                </p>
                <p className="text-xs text-slate-400">Click or drag a new file to replace existing document</p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Drag & drop your document here, or <span className="text-blue-600">browse file</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">PDF, PNG, JPG, WEBP up to 10MB</p>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 5: Supporting Information (Optional) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b pb-3 text-slate-900 font-bold text-lg">
            <FileText className="text-blue-600" size={20} />
            <span>5. Supporting Information (Optional)</span>
          </div>

          <p className="text-xs text-slate-500">
            Upload any additional supporting evidence (e.g., press releases, award certifications, trademark registration).
          </p>

          <div
            onDragOver={(e) => { e.preventDefault(); setSupportingDragActive(true); }}
            onDragLeave={() => setSupportingDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setSupportingDragActive(false);
              if (e.dataTransfer.files?.[0]) handleSupportingFileSelect(e.dataTransfer.files[0]);
            }}
            onClick={() => supportingFileInputRef.current?.click()}
            className={`border border-dashed rounded-xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center ${
              supportingDragActive ? "border-blue-500 bg-blue-50/50" : "border-slate-300 hover:border-slate-400 bg-slate-50/50"
            }`}
          >
            <input
              ref={supportingFileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleSupportingFileSelect(e.target.files[0]);
              }}
            />

            {supportingDoc ? (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-blue-600 flex items-center justify-center gap-1.5">
                  <FileText size={16} /> {supportingDoc.name}
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSupportingDoc(null);
                  }}
                  className="text-xs text-red-600 hover:underline"
                >
                  Remove file
                </button>
              </div>
            ) : existingSupportingDocName ? (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-emerald-600 flex items-center justify-center gap-1.5">
                  <CheckCircle2 size={16} /> {existingSupportingDocName}
                </p>
                <p className="text-xs text-slate-400">Click to upload a different supporting document</p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-medium text-slate-600">
                  Upload optional supporting document (PDF, PNG, JPG)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 6: Declaration & Submission */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <input
              type="checkbox"
              id="declaration"
              checked={declaration}
              onChange={(e) => setDeclaration(e.target.checked)}
              className="mt-1 h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="declaration" className="text-xs sm:text-sm text-slate-700 leading-relaxed cursor-pointer select-none">
              I confirm that all information provided in this application is accurate, truthful, and belongs to me or the organization I am authorized to represent.
            </label>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <button
              type="button"
              onClick={() => router.push("/profile")}
              className="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition text-center"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 rounded-xl transition shadow-md shadow-blue-500/20"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Submitting Request...
                </>
              ) : (
                <>
                  <ShieldCheck size={18} /> Submit Verification Request
                </>
              )}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
