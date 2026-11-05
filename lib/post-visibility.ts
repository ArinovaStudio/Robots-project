import { prisma } from "@/lib/prisma";
export function visibleToViewer(viewerId: string) {
  return {
    OR: [
      { visibility: "ANYONE" as const },
      { authorId: viewerId },
      {
        author: {
          OR: [
            { sentConnections: { some: { receiverId: viewerId, status: "ACCEPTED" as const } } },
            { receivedConnections: { some: { senderId: viewerId, status: "ACCEPTED" as const } } },
          ],
        },
      },
    ],
  };
}

/** Which of the given user ids are accepted connections of the viewer. */
export async function getConnectedAmong(viewerId: string, userIds: string[]): Promise<Set<string>> {
  const ids = Array.from(new Set(userIds.filter((id) => id && id !== viewerId)));
  if (ids.length === 0) return new Set();

  const rows = await prisma.connection.findMany({
    where: {
      status: "ACCEPTED",
      OR: [
        { senderId: viewerId, receiverId: { in: ids } },
        { receiverId: viewerId, senderId: { in: ids } },
      ],
    },
    select: { senderId: true, receiverId: true },
  });

  return new Set(rows.map((r) => (r.senderId === viewerId ? r.receiverId : r.senderId)));
}
export async function withCanComment<T extends { authorId: string; commentAccess?: string | null }>(
  posts: T[],
  viewerId: string
): Promise<(T & { canComment: boolean })[]> {
  const restrictedAuthors = posts
    .filter((p) => p.commentAccess === "CONNECTIONS" && p.authorId !== viewerId)
    .map((p) => p.authorId);
  const connected = await getConnectedAmong(viewerId, restrictedAuthors);

  return posts.map((p) => ({
    ...p,
    canComment: p.commentAccess !== "CONNECTIONS" || p.authorId === viewerId || connected.has(p.authorId),
  }));
}
export const repostOfInclude = {
  select: {
    id: true,
    authorId: true,
    content: true,
    createdAt: true,
    media: true,
    event: true,
    author: {
      select: {
        id: true,
        name: true,
        image: true,
        verificationStatus: true,
        company: { select: { companyName: true, logoUrl: true } },
      },
    },
  },
} as const;
export async function withHasReposted<T extends { id: string; repostOfId?: string | null }>(
  posts: T[],
  viewerId: string
): Promise<(T & { hasReposted: boolean })[]> {
  const originalIds = Array.from(new Set(posts.map((p) => p.repostOfId ?? p.id)));
  if (originalIds.length === 0) return [];

  const mine = await prisma.post.findMany({
    where: { authorId: viewerId, repostOfId: { in: originalIds }, status: "ACTIVE" },
    select: { repostOfId: true },
  });
  const reposted = new Set(mine.map((r) => r.repostOfId));

  return posts.map((p) => ({ ...p, hasReposted: reposted.has(p.repostOfId ?? p.id) }));
}
export function notHiddenBy(viewerId: string) {
  return { hiddenBy: { none: { userId: viewerId } } };
}
export async function withIsFollowing<T extends { authorId: string }>(
  posts: T[],
  viewerId: string
): Promise<(T & { isFollowingAuthor: boolean })[]> {
  const authorIds = Array.from(new Set(posts.map((p) => p.authorId).filter((id) => id !== viewerId)));
  const rows = authorIds.length
    ? await prisma.follow.findMany({
        where: { followerId: viewerId, followingId: { in: authorIds } },
        select: { followingId: true },
      })
    : [];
  const following = new Set(rows.map((r) => r.followingId));

  return posts.map((p) => ({ ...p, isFollowingAuthor: following.has(p.authorId) }));
}
