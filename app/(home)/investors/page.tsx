import type { Metadata } from "next";
import { ArrowRight, Briefcase, Sparkles } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Investor Matchmaking - Pitch Angel & VC Investors | Connecto",
  description: "Gain access to a curated network of angel investors, venture capitalists, and private equity firms on Connecto. View startup pitches, products, and ideas.",
  alternates: {
    canonical: "/investors",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function InvestorsPage() {
  return (
    <section className="mx-auto max-w-4xl pt-6 pb-20">
      <div className="bg-[#1E3A5F] rounded-2xl p-10 text-center relative overflow-hidden border border-[#1E3A5F]">
        <div className="relative z-10 flex flex-col items-center">
          <div className="bg-white/10 p-4 rounded-2xl border border-white/20 mb-6">
            <Briefcase className="w-12 h-12 text-blue-200" />
          </div>

          <span className="rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold text-blue-200 border border-white/20 mb-4">
            Investor Matchmaking & Discovery
          </span>

          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight">
            Investor Portal & Matchmaking
          </h1>
          
          <p className="text-base md:text-lg text-slate-300 max-w-xl mx-auto mb-8 leading-relaxed">
            Discover curated startup ideas, market-ready products, and formal investment pitches tailored to your preferences. Connect directly with high-growth businesses.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/investors/portal"
              className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold px-8 py-3.5 rounded-full transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Open Investor Portal <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/signup/investor"
              className="bg-white/10 hover:bg-white/20 text-white font-medium px-7 py-3.5 rounded-full border border-white/20 transition-all"
            >
              Register as Investor
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
