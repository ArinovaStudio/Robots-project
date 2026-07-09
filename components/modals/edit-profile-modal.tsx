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

    try {
      const res = await fetch("/api/company/profile", {
        method: "PUT",
        body: payload,
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success("Profile updated successfully");
        if (previewUrl && logoFile) URL.revokeObjectURL(previewUrl); 
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
        
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <h2 className="text-xl font-bold text-slate-800">Edit Company Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition">
            <X size={20} />
          </button>
        </div>

        <form id="edit-profile-form" onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          
          <div className="flex flex-col items-center justify-center pb-2">
            <input type="file" id="logo-upload" accept="image/*" className="hidden" onChange={handleImageChange} />
            <label htmlFor="logo-upload" className="relative cursor-pointer group">
              <div className="h-24 w-24 rounded-full border-[3px] border-white shadow-md overflow-hidden bg-slate-100 flex items-center justify-center transition-transform group-hover:scale-105">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Company Name</label>
              <input required name="companyName" value={formData.companyName} onChange={handleChange} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Company Type</label>
              <input required name="type" value={formData.type} onChange={handleChange} placeholder="e.g. Startup, Agency" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Team Size</label>
              <input required type="number" name="size" value={formData.size} onChange={handleChange} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Year Established</label>
              <input required type="number" name="yearOfEstablishment" value={formData.yearOfEstablishment} onChange={handleChange} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Location</label>
              <input name="location" value={formData.location} onChange={handleChange} placeholder="City, Country" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Website</label>
              <input type="url" name="website" value={formData.website} onChange={handleChange} placeholder="https://" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Deal In</label>
            <input
              value={dealInInput}
              onChange={(e) => setDealInInput(e.target.value)}
              onKeyDown={(e) => handleAddTag(e, "dealIn", dealInInput, setDealInInput)}
              placeholder="Type and press Enter or comma..."
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
            />
            {formData.dealIn.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {formData.dealIn.map((tag: string) => (
                  <span key={tag} className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-slate-800 px-3 py-1.5 rounded-lg text-xs font-medium">
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag("dealIn", tag)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <X size={14} strokeWidth={2.5} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Looking For</label>
            <input
              value={lookingForInput}
              onChange={(e) => setLookingForInput(e.target.value)}
              onKeyDown={(e) => handleAddTag(e, "lookingFor", lookingForInput, setLookingForInput)}
              placeholder="Type and press Enter or comma..."
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
            />
             {formData.lookingFor.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {formData.lookingFor.map((tag: string) => (
                  <span key={tag} className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-slate-800 px-3 py-1.5 rounded-lg text-xs font-medium">
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag("lookingFor", tag)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <X size={14} strokeWidth={2.5} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Description</label>
            <textarea required name="description" value={formData.description} onChange={handleChange} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black min-h-[100px] resize-none" />
          </div>
        </form>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl bg-white border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition shadow-sm">
            Cancel
          </button>
          <button type="submit" form="edit-profile-form" disabled={loading} className="flex-1 flex justify-center items-center gap-2 rounded-xl bg-black py-3 text-sm font-semibold text-white transition hover:bg-slate-800 shadow-sm disabled:opacity-50">
            {loading ? <Loader2 size={16} className="animate-spin" /> : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
}