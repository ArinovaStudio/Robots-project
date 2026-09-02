import { Briefcase, Lock, Sparkles } from "lucide-react";
import Link from "next/link";

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
            Investor Matchmaking
          </h1>
          
          <p className="text-lg text-slate-300 max-w-xl mx-auto mb-10 leading-relaxed">
            Gain access to a curated network of angel investors, venture capitalists, and private equity firms looking to fund innovative businesses in your sector.
          </p>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-10 w-full max-w-2xl text-left flex items-start gap-4 backdrop-blur-sm">
            <Lock className="w-8 h-8 text-amber-400 shrink-0 mt-1" />
            <div>
              <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                Premium Feature <Sparkles className="w-4 h-4 text-amber-400" />
              </h3>
              <p className="text-slate-400 text-sm mt-1">
                The Investor Directory is exclusively available to Connecto Pro members. Upgrade your account to unlock direct messaging, pitch deck hosting, and priority matching with verified investors.
              </p>
            </div>
          </div>

          <Link 
            href="#" 
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-8 py-3.5 rounded-full transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)]"
          >
            Upgrade to Connecto Pro
          </Link>
        </div>
      </div>
    </section>
  );
}
