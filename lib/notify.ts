import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

const FANOUT_CAP = 100;
const MAX_MENTIONS = 5;

type NamedUser = { name: string | null; company?: { companyName: string } | null } | null | undefined;
const nameOf = (u: NamedUser, fallback: string) => u?.company?.companyName || u?.name || fallback;

const actorSelect = { name: true, company: { select: { companyName: true } } } as const;

/**
 * A new reaction on a post:
 *  - the post author gets a POST_LIKE ("My posts" tab)
 *  - the reactor's connections and followers get NETWORK_ACTIVITY ("All" tab),
 *    only for public posts, capped so one reaction can't fan out unbounded.
 * Never throws: notifications must not break the reaction itself.
 */
export async function notifyPostReaction(postId: string, actorId: string) {
  try {
    const [post, actor] = await Promise.all([
      prisma.post.findUnique({
        where: { id: postId },
        select: { authorId: true, visibility: true, author: { select: actorSelect } },
      }),
      prisma.user.findUnique({ where: { id: actorId }, select: actorSelect }),
    ]);
    if (!post || !actor) return;

    const link = `/post/${postId}`;
    const actorName = nameOf(actor, "Someone");
    const rows: Prisma.NotificationCreateManyInput[] = [];

    if (post.authorId !== actorId) {
      rows.push({ userId: post.authorId, actorId, type: "POST_LIKE", content: `${actorName} reacted to your post`, link });
    }

    if (post.visibility === "ANYONE") {
      const [connections, followers] = await Promise.all([
        prisma.connection.findMany({
          where: { status: "ACCEPTED", OR: [{ senderId: actorId }, { receiverId: actorId }] },
          select: { senderId: true, receiverId: true },
          take: FANOUT_CAP,
        }),
        prisma.follow.findMany({ where: { followingId: actorId }, select: { followerId: true }, take: FANOUT_CAP }),
      ]);

      const audience = new Set<string>();
      connections.forEach((c) => audience.add(c.senderId === actorId ? c.receiverId : c.senderId));
      followers.forEach((f) => audience.add(f.followerId));
      audience.delete(actorId);
      audience.delete(post.authorId); // the author already gets the direct notification

      const authorName = nameOf(post.author, "someone");
      Array.from(audience)
        .slice(0, FANOUT_CAP)
        .forEach((userId) =>
          rows.push({ userId, actorId, type: "NETWORK_ACTIVITY", content: `${actorName} reacted to ${authorName}'s post`, link })
        );
    }

    if (rows.length === 0) return;

    // Don't re-notify when someone removes and re-adds a reaction
    const existing = await prisma.notification.findMany({
      where: { actorId, link, type: { in: ["POST_LIKE", "NETWORK_ACTIVITY"] }, userId: { in: rows.map((r) => r.userId) } },
      select: { userId: true, type: true },
    });
    const already = new Set(existing.map((e) => `${e.userId}:${e.type}`));
    const fresh = rows.filter((r) => !already.has(`${r.userId}:${r.type}`));
    if (fresh.length) await prisma.notification.createMany({ data: fresh });
  } catch (err) {
    console.error("notifyPostReaction failed:", err);
  }
}

/**
 * A new comment: notify the post author, and the parent comment's author for replies.
 * Returns the user ids that were notified so mention notifications can skip them.
 */
export async function notifyPostComment(postId: string, actorId: string, parentId?: string | null): Promise<string[]> {
  const notified: string[] = [];
  try {
    const [post, actor] = await Promise.all([
      prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } }),
      prisma.user.findUnique({ where: { id: actorId }, select: actorSelect }),
    ]);
    if (!post || !actor) return notified;

    const link = `/post/${postId}`;
    const actorName = nameOf(actor, "Someone");
    const rows: Prisma.NotificationCreateManyInput[] = [];

    if (post.authorId !== actorId) {
      rows.push({ userId: post.authorId, actorId, type: "NEW_COMMENT", content: `${actorName} commented on your post`, link });
    }

    if (parentId) {
      const parent = await prisma.comment.findUnique({ where: { id: parentId }, select: { authorId: true } });
      if (parent && parent.authorId !== actorId && parent.authorId !== post.authorId) {
        rows.push({ userId: parent.authorId, actorId, type: "NEW_COMMENT", content: `${actorName} replied to your comment`, link });
      }
    }

    if (rows.length) {
      await prisma.notification.createMany({ data: rows });
      rows.forEach((r) => notified.push(r.userId));
    }
  } catch (err) {
    console.error("notifyPostComment failed:", err);
  }
  return notified;
}

/**
 * "@Name" mentions. A mention is "@" followed by up to 4 words; the longest run of
 * words that exactly matches a user's name or a company name (case-insensitive) wins.
 */
export async function notifyMentions(opts: {
  content: string;
  actorId: string;
  postId: string;
  where: "post" | "comment";
  skipUserIds?: string[];
}) {
  try {
    const { content, actorId, postId, where, skipUserIds = [] } = opts;
    if (!content || !content.includes("@")) return;

    const found = new Set<string>();
    const regex = /@([^\s@]+(?:\s+[^\s@]+){0,3})/g;
    let m: RegExpExecArray | null;

    while ((m = regex.exec(content)) !== null && found.size < MAX_MENTIONS) {
      const words = m[1].split(/\s+/).map((w) => w.replace(/[.,;:!?)\]]+$/g, "")).filter(Boolean);
      for (let n = words.length; n >= 1; n--) {
        const candidate = words.slice(0, n).join(" ");
        const match = await prisma.user.findFirst({
          where: {
            status: "ACTIVE",
            OR: [
              { name: { equals: candidate, mode: "insensitive" } },
              { company: { companyName: { equals: candidate, mode: "insensitive" } } },
            ],
          },
          select: { id: true },
        });
        if (match) {
          found.add(match.id);
          break;
        }
      }
    }

    const targets = Array.from(found).filter((id) => id !== actorId && !skipUserIds.includes(id));
    if (targets.length === 0) return;

    const actor = await prisma.user.findUnique({ where: { id: actorId }, select: actorSelect });
    const actorName = nameOf(actor, "Someone");
    const link = `/post/${postId}`;

    await prisma.notification.createMany({
      data: targets.map((userId) => ({
        userId,
        actorId,
        type: "MENTION" as const,
        content: `${actorName} mentioned you in a ${where}`,
        link,
      })),
    });
  } catch (err) {
    console.error("notifyMentions failed:", err);
  }
}
