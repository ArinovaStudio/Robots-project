"use client";

import { CalendarDays, MapPin, ExternalLink } from "lucide-react";
import VerificationBadge from "@/components/ui/VerificationBadge";
import ReadMoreText from "@/components/ui/read-more-text";
import MediaSlider from "./media-slider";

export function EventCard({ event }: { event: any }) {
  return (
    <div className="mt-4 rounded-xl border border-[#E5E7EB] overflow-hidden bg-white">
      <div className="bg-[#1E3A5F] p-4 flex items-center justify-between text-white">
        <div>
          <span className="inline-block px-2.5 py-0.5 bg-white/20 text-white text-[11px] font-semibold rounded-full mb-1.5">
            Upcoming Event
          </span>
          <h3 className="text-base font-bold text-white line-clamp-2">{event.title}</h3>
        </div>
        <div className="flex flex-col items-center justify-center bg-white rounded-lg p-2 min-w-16 shrink-0 ml-4">
          <span className="text-[11px] font-bold text-[#2563EB] uppercase">
            {new Date(event.date).toLocaleString("default", { month: "short" })}
          </span>
          <span className="text-lg font-black text-[#172033] leading-none">{new Date(event.date).getDate()}</span>
        </div>
      </div>

      <div className="p-4 bg-[#F8F4E8]">
        <div className="flex flex-col gap-2">
          <div className="flex items-start gap-2 text-[#172033]">
            <CalendarDays className="w-4 h-4 mt-0.5 shrink-0 text-[#2563EB]" />
            <div className="text-sm">
              <p className="font-medium text-[#172033]">
                {new Date(event.date).toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
              <p className="text-xs text-[#64748B]">
                {new Date(event.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>

          {event.location && (
            <div className="flex items-center gap-2 text-xs text-[#64748B] mt-1">
              <MapPin className="w-4 h-4 shrink-0 text-[#2563EB]" />
              <span className="truncate">{event.location}</span>
            </div>
          )}

          {event.link && (
            <div className="mt-3 pt-3 border-t border-[#E5E7EB] flex justify-end">
              <a
                href={event.link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white hover:bg-gray-50 text-[#2563EB] border border-[#E5E7EB] text-xs font-semibold rounded-full transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Event Link
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default function EmbeddedPost({ post, compact = false }: { post: any; compact?: boolean }) {
  if (!post) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
        This post is no longer available.
      </div>
    );
  }

  const name = post.author?.company?.companyName || post.author?.name || "Independent Professional";
  const image = post.author?.company?.logoUrl || post.author?.image;

  const body = (
    <>
      <div className="flex items-center gap-2.5">
        {image ? (
          <img src={image} alt={name} className="h-9 w-9 rounded-full object-cover border border-gray-100" />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-gray-900 flex items-center gap-1.5">
            <span className="truncate">{name}</span>
            <VerificationBadge status={post.author?.verificationStatus} size="xs" />
          </p>
          <p className="text-[11px] text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      {post.content && (
        <div className="mt-2.5">
          <ReadMoreText
            text={post.content}
            charLimit={compact ? 140 : 260}
            title={`Post by ${name}`}
            className="text-sm leading-relaxed text-[#172033] whitespace-pre-wrap"
          />
        </div>
      )}

      {!compact && post.event && <EventCard event={post.event} />}

      {!compact && post.media?.length > 0 && (
        <div className="mt-3">
          <MediaSlider key={post.media.map((m: any) => m.id).join("-")} media={post.media} />
        </div>
      )}
    </>
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3.5">
      {body}
    </div>
  );
}
