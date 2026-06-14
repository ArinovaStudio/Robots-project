"use client";

import { Sparkles } from "lucide-react";

const CATEGORIES = [
  { name: "Technology", emoji: "💻", count: 142 },
  { name: "Manufacturing", emoji: "🏭", count: 98 },
  { name: "Healthcare", emoji: "🏥", count: 76 },
  { name: "Logistics", emoji: "🚛", count: 65 },
  { name: "Construction", emoji: "🏗️", count: 54 },
  { name: "Retail", emoji: "🛍️", count: 88 },
  { name: "Finance", emoji: "💹", count: 43 },
  { name: "Agriculture", emoji: "🌾", count: 37 },
  { name: "Energy", emoji: "⚡", count: 29 },
  { name: "Education", emoji: "📚", count: 61 },
  { name: "Real Estate", emoji: "🏢", count: 52 },
  { name: "Textiles", emoji: "🧵", count: 41 },
];

export default function CategoriesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles size={22} className="text-slate-700" />
        <h1 className="text-2xl font-bold text-slate-900">Browse Categories</h1>
      </div>

      <p className="text-sm text-slate-500">
        Explore businesses and services across industries.
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.name}
            className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-white p-5 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
          >
            <span className="text-3xl">{cat.emoji}</span>
            <span className="font-semibold text-slate-800">{cat.name}</span>
            <span className="text-xs text-slate-400">{cat.count} businesses</span>
          </button>
        ))}
      </div>
    </div>
  );
}
