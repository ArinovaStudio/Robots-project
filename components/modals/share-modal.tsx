"use client";
import { X, Copy, Check } from "lucide-react";
import { useState } from "react";

export default function ShareModal({ postId, onClose }: { postId: string, onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}/post/${postId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-xl relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
          <X size={20} />
        </button>
        <h3 className="text-lg font-bold text-slate-900 mb-4">Share this post</h3>
        <p className="text-sm text-slate-500 mb-4">Anyone with this link will be able to view this post.</p>
        <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
          <input readOnly value={link} className="flex-1 bg-transparent text-sm text-slate-600 outline-none px-2" />
          <button 
            onClick={handleCopy} 
            className="flex items-center gap-1 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium transition hover:bg-slate-800"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}