import {
  FileText,
  ImageIcon,
  Video,
} from "lucide-react";

export default function AchievementPost() {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Post Your Achievements
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Share updates, milestones, and business progress
        </p>
      </div>

      {/* Textarea */}
      <textarea
        placeholder="Type your achievement..."
        className="
          mt-5 h-28 w-full resize-none rounded-2xl border
          border-slate-200 bg-[#f8fafc] p-4 text-sm
          text-slate-700 outline-none transition-all
          placeholder:text-slate-400
          focus:border-slate-300 focus:bg-white
        "
      />

      {/* Actions */}
      <div className="mt-5 flex items-center justify-between gap-3">
        <Action icon={<Video size={16} />} label="Video" />

        <Action
          icon={<ImageIcon size={16} />}
          label="Image"
        />

        <Action
          icon={<FileText size={16} />}
          label="Documents"
        />
      </div>
    </div>
  );
}

function Action({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      className="
        flex flex-1 items-center justify-center gap-2
        rounded-xl border border-slate-200
        bg-slate-50 px-4 py-3 text-sm font-medium
        text-slate-700 transition-all
        hover:bg-slate-100
      "
    >
      {icon}

      <span>{label}</span>
    </button>
  );
}