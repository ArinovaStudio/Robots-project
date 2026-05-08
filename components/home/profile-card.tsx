import { Pencil } from "lucide-react";

export default function ProfileCard() {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex flex-col items-center text-center">
        {/* Avatar */}
        <div
          className="
            flex h-20 w-20 items-center justify-center
            rounded-full bg-[#EEF0FF]
            text-3xl font-bold text-[#5667ff]
          "
        >
          A
        </div>

        {/* Name */}
        <h2 className="mt-3 text-lg font-semibold">
          Arinova Studio
        </h2>

        {/* Subtitle */}
        <p className="mt-1 text-xs text-slate-400">
          Software Company • Level 1
        </p>

        {/* Description */}
        <p className="mt-3 text-xs leading-5 text-slate-500">
          Lorem ipsum dolor sit amet consectetur.
          Non amet commodo ac et malesuada at.
          Viverra
        </p>

        {/* Edit Button */}
        <button
          className="
            ml-auto mt-4 rounded-full p-1.5
            shadow-sm transition hover:bg-slate-100
          "
        >
          <Pencil size={14} />
        </button>
      </div>
    </div>
  );
}