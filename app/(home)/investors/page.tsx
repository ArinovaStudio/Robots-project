import type { Metadata } from "next";
import { ArrowRight, Briefcase } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Investor Matchmaking - Pitch Angel & VC Investors",
  description: "Gain access to a curated network of angel investors, venture capitalists, and private equity firms on Connecto.",
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
    <section className="mx-auto max-w-4xl pt-10 pb-20">
      <div className="bg-gradient-to-br from-slate-900 to-blue-950 rounded-2xl p-10 text-center relative overflow-hidden shadow-2xl border border-slate-800">
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/20 rounded-full blur-[80px]"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[80px]"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20 mb-6">
            <Briefcase className="w-12 h-12 text-blue-300" />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
            Investor profiles
          </h1>
          
          <p className="text-lg text-slate-300 max-w-xl mx-auto mb-10 leading-relaxed">
            Investor signup is now open. Create a profile to share your investment focus, preferred stages, and typical investment range with businesses on Connecto.
          </p>

          <Link
            href="/signup/investor"
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-8 py-3.5 rounded-full transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)]"
          >
            Create investor profile <ArrowRight className="ml-2 inline h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
