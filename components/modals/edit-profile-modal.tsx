"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";

export default function EditProfileModal({ profile, onClose, onSuccess }: any) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(profile.logoUrl || null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string | null>(profile.bannerUrl || null);

  const [dealInInput, setDealInInput] = useState("");
  const [lookingForInput, setLookingForInput] = useState("");

  const [formData, setFormData] = useState({
    companyName: profile.companyName || "",
    description: profile.description || "",
    size: profile.size || "",
    type: profile.type || "",
    yearOfEstablishment: profile.yearOfEstablishment || "",
    website: profile.website || "",
    location: profile.location || "",
    dealIn: profile.dealIn || [],
    lookingFor: profile.lookingFor || [],
  });

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>, field: "dealIn" | "lookingFor", inputState: string, setInputState: any) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault(); 
      const newTag = inputState.trim().replace(/,$/, "");
      
      if (newTag && !formData[field].includes(newTag)) {
        setFormData({ ...formData, [field]: [...formData[field], newTag] });
      }
      setInputState("");
    }
  };

  const handleRemoveTag = (field: "dealIn" | "lookingFor", tagToRemove: string) => {
    setFormData({
      ...formData,
      [field]: formData[field].filter((tag: string) => tag !== tagToRemove)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key !== "dealIn" && key !== "lookingFor") {
        payload.append(key, value.toString());
      }
    });

    formData.dealIn.forEach((item: string) => payload.append("dealIn", item));
    formData.lookingFor.forEach((item: string) => payload.append("lookingFor", item));

    if (logoFile) {
      payload.append("logo", logoFile);
    }
    if (bannerFile) {
      payload.append("banner", bannerFile);
    }

    try {
      const res = await fetch("/api/company/profile", {
        method: "PUT",
        body: payload,
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success("Profile updated successfully");
        if (previewUrl && logoFile) URL.revokeObjectURL(previewUrl); 
        if (bannerPreviewUrl && bannerFile) URL.revokeObjectURL(bannerPreviewUrl);
        onSuccess();
      } else {
        toast.error(data.message || "Failed to update profile");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6">
      <div className="w-full max-w-2xl bg-white rounded-[28px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200">
        
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Edit Company Profile</h2>
            <p className="text-xs text-gray-400 mt-0.5 font-medium">Changes will be reflected across your public profile</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition">
            <X size={20} />
          </button>
        </div>

        <form id="edit-profile-form" onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          
          <div className="relative mb-12">
            {/* Banner Area */}
            <div className="h-32 w-full bg-slate-200 relative group overflow-hidden">
              {bannerPreviewUrl ? (
                <img src={bannerPreviewUrl} alt="Banner" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-gradient-to-r from-blue-100 to-blue-50"></div>
              )}
              <label htmlFor="banner-upload" className="absolute top-3 right-3 cursor-pointer bg-black/50 text-white p-2 rounded-full shadow-lg border border-white/20 transition-transform group-hover:scale-105 hover:bg-black/70">
                <Pencil size={14} />
              </label>
              <input type="file" id="banner-upload" accept="image/*" className="hidden" onChange={handleBannerChange} />
            </div>

            {/* Logo Area */}
            <div className="absolute -bottom-10 left-6">
              <input type="file" id="logo-upload" accept="image/*" className="hidden" onChange={handleImageChange} />
              <label htmlFor="logo-upload" className="relative cursor-pointer group block">
                <div className="h-24 w-24 rounded-full border-4 border-white shadow-md overflow-hidden bg-slate-100 flex items-center justify-center transition-transform group-hover:scale-105">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-4xl font-bold text-slate-300">
                      {formData.companyName.charAt(0) || "C"}
                    </span>
                  )}
                </div>
                <div className="absolute bottom-0 right-0 bg-black text-white p-2 rounded-full shadow-lg border-2 border-white transition-transform group-hover:scale-110">
                  <Pencil size={14} />
                </div>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Company Name</label>
              <input required name="companyName" value={formData.companyName} onChange={handleChange} className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:bg-white" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Company Type</label>
              <input required name="type" value={formData.type} onChange={handleChange} placeholder="e.g. Startup, Agency" className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:bg-white" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Team Size</label>
              <input required type="number" name="size" value={formData.size} onChange={handleChange} className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:bg-white" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Year Established</label>
              <input required type="number" name="yearOfEstablishment" value={formData.yearOfEstablishment} onChange={handleChange} className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:bg-white" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Location</label>
              <input name="location" value={formData.location} onChange={handleChange} placeholder="City, Country" className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:bg-white" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Website</label>
              <input type="url" name="website" value={formData.website} onChange={handleChange} placeholder="https://" className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:bg-white" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Services (Deal In)</label>
            <input
              value={dealInInput}
              onChange={(e) => setDealInInput(e.target.value)}
              onKeyDown={(e) => handleAddTag(e, "dealIn", dealInInput, setDealInInput)}
              placeholder="Type a service and press Enter or comma…"
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:bg-white"
            />
            {formData.dealIn.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {formData.dealIn.map((tag: string) => (
                  <span key={tag} className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-semibold">
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag("dealIn", tag)} className="text-blue-300 hover:text-red-500 transition-colors">
                      <X size={13} strokeWidth={2.5} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Looking For</label>
            <input
              value={lookingForInput}
              onChange={(e) => setLookingForInput(e.target.value)}
              onKeyDown={(e) => handleAddTag(e, "lookingFor", lookingForInput, setLookingForInput)}
              placeholder="Type what you need and press Enter or comma…"
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:bg-white"
            />
             {formData.lookingFor.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {formData.lookingFor.map((tag: string) => (
                  <span key={tag} className="flex items-center gap-1.5 bg-green-50 border border-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-semibold">
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag("lookingFor", tag)} className="text-green-300 hover:text-red-500 transition-colors">
                      <X size={13} strokeWidth={2.5} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Description</label>
            <textarea required name="description" value={formData.description} onChange={handleChange} className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:bg-white min-h-[100px] resize-none" />
          </div>
        </form>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl bg-white border border-gray-200 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition shadow-sm">
            Cancel
          </button>
          <button type="submit" form="edit-profile-form" disabled={loading} className="flex-1 flex justify-center items-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 shadow-sm disabled:opacity-50">
            {loading ? <Loader2 size={16} className="animate-spin" /> : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
}