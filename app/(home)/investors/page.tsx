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
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 rounded-2xl p-10 text-center relative overflow-hidden shadow-2xl border border-slate-800">
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/20 rounded-full blur-[80px]"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[80px]"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20 mb-6">
            <Briefcase className="w-12 h-12 text-blue-300" />
          </div>

          <span className="rounded-full bg-blue-500/20 px-3.5 py-1 text-xs font-semibold text-blue-300 border border-blue-400/30 mb-4">
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
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3.5 rounded-full transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Open Investor Portal <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/signup/investor"
              className="bg-white/10 hover:bg-white/15 text-white font-medium px-7 py-3.5 rounded-full border border-white/20 transition-all"
            >
              Register as Investor
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
