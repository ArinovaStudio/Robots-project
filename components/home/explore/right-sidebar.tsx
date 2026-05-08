import { Bed, Lock } from "lucide-react";
import Image from "next/image";

export default function RightSidebar() {
  return (
    <div className="space-y-3">
      {/* Companies */}
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="text-base font-semibold">Company Matched for you</h3>

        <div className="mt-4 space-y-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-none last:pb-0"
            >
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-full relative">
                  <Image alt={"Logo"} src={"/logo.png"} fill/>
                  </div>

                <div>
                  <h4 className="text-sm font-semibold">CyberFort</h4>

                  <p className="text-[11px] text-slate-400">
                    Cyber Security Company
                  </p>
                </div>
              </div>

              <button className="text-xs font-medium text-[#4f46e5] hover:underline">
                Connect
              </button>
            </div>
          ))}
        </div>

        <button className="mt-5 w-full text-center text-xs font-medium text-[#4f46e5] hover:underline">
          View All →
        </button>
      </div>

      {/* Investors */}
      <div className="flex h-[170px] flex-col items-center justify-center rounded-2xl bg-white p-5 text-center shadow-sm">
        <h3 className="text-2xl"><Lock /></h3>

        <h4 className="mt-3 text-lg font-medium text-slate-800">
          Top Investors for you
        </h4>

        <p className="mt-2 text-xs text-slate-400">Coming soon...</p>
      </div>
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        {/* Heading */}
        <h3 className="text-sm font-semibold text-slate-900">
          Requests for connections
        </h3>

        {/* Empty State */}
        <div className="flex h-[140px] flex-col items-center justify-center text-center">
          <Bed size={28} className="text-slate-300" strokeWidth={1.5} />

          <p className="mt-4 max-w-[180px] text-xs leading-5 text-slate-400">
            No one has requested to connect with you
          </p>
        </div>
      </div>
    </div>
  );
}
