import React from "react";
import Image from "next/image";
export default function SuggestedProfiles() {
  return (
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
                <Image alt={"Logo"} src={"/logo.png"} fill />
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
  );
}
