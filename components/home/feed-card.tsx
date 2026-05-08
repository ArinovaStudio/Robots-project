import {
  Bookmark,
  MessageCircle,
  MoreVertical,
  Share2,
  ThumbsUp,
} from "lucide-react";

export default function FeedCard() {
  return (
    <div className="flex flex-col">
      <div className="bg-background p-4 rounded-2xl">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF0FF] text-base font-bold text-[#5667ff]">
              A
            </div>

            <div>
              <h3 className="text-lg font-semibold">Arinova Studio</h3>

              <p className="text-xs text-slate-400">
                Software Company at West Bengal
              </p>
            </div>
          </div>

          <button className="text-slate-500">
            <MoreVertical size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
          <p>
            Lorem ipsum dolor sit amet consectetur. Egestas iaculis molestie at
            malesuada.
          </p>

          <p>Amet consequat phasellus egestas elit aliquam ac tellus sed.</p>

          <p>Mattis viverra mauris feugiat tempor massa.</p>
        </div>
      </div>
      {/* Actions */}
      <div className="mt-3 flex items-center gap-2">
        <button
          className="
            flex h-9 flex-1 items-center justify-center gap-2
            rounded-full bg-[#f5f5f5] text-xs font-medium
            transition bg-background shadow-sm hover:bg-[#ececec]
          "
        >
          <ThumbsUp size={14} />
          Like
        </button>

        <button
          className="
            flex h-9 flex-1 items-center justify-center gap-2
            rounded-full bg-[#f5f5f5] text-xs font-medium
            transition hover:bg-[#ececec] bg-background shadow-sm
          "
        >
          <MessageCircle size={14} />
          Comments
        </button>

        <button
          className="
            flex h-9 flex-1 items-center justify-center gap-2
            rounded-full bg-[#f5f5f5] text-xs font-medium
            transition hover:bg-[#ececec] bg-background shadow-sm
          "
        >
          <Share2 size={14} />
          Share
        </button>

        <button
          className="
            flex h-9 flex-1 items-center justify-center gap-2
            rounded-full bg-black text-xs font-medium text-white
          "
        >
          <Bookmark size={14} />
          Save
        </button>
      </div>
    </div>
  );
}
