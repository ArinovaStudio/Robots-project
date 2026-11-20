import { randomUUID } from "node:crypto";
import { prisma } from "./prisma";
import { redis } from "./redis";

const QUEUE_KEY = "robots:interactions:write-behind:queue";
const PROCESSING_KEY = "robots:interactions:write-behind:processing";
const LOCK_KEY = "robots:interactions:write-behind:lock";
export const PENDING_REMOVED_REACTION = "__REMOVED__";
const REMOVED = PENDING_REMOVED_REACTION;
const MAX_EVENTS_PER_FLUSH = 1000;

type ReactionKind = "POST_REACTION" | "COMMENT_REACTION";
type ReactionEvent = {
  id: string;
  kind: ReactionKind;
  targetId: string;
  userId: string;
  type: string | null;
};

export type PendingComment = {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  parentId: string | null;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  version: number;
  deleted?: boolean;
  author: {
    id: string;
    name: string | null;
    image: string | null;
    investor: { firmName: string | null } | null;
    company: { companyName: string; logoUrl: string | null; isBoosted: boolean } | null;
  };
};

type CommentEvent = {
  id: string;
  kind: "COMMENT_CREATE" | "COMMENT_UPDATE" | "COMMENT_DELETE";
  commentId: string;
  version: number;
  comment?: PendingComment;
  content?: string;
};

type InteractionEvent = ReactionEvent | CommentEvent;

const postReactionKey = (postId: string) => `robots:pending:post-reactions:${postId}`;
const commentReactionKey = (commentId: string) => `robots:pending:comment-reactions:${commentId}`;
const pendingCommentKey = (commentId: string) => `robots:pending:comment:${commentId}`;
const pendingPostCommentsKey = (postId: string) => `robots:pending:post-comments:${postId}`;

function reactionKey(kind: ReactionKind, targetId: string) {
  return kind === "POST_REACTION" ? postReactionKey(targetId) : commentReactionKey(targetId);
}

export async function getPendingReactionStates(
  kind: ReactionKind,
  targetIds: string[]
): Promise<Record<string, Record<string, string>>> {
  if (!targetIds.length) return {};
  const entries = await Promise.all(
    targetIds.map(async (targetId) => [targetId, await redis.hgetall(reactionKey(kind, targetId))] as const)
  );
  return Object.fromEntries(entries);
}

export async function enqueuePostReaction(postId: string, userId: string, type: string | null) {
  const event: ReactionEvent = { id: randomUUID(), kind: "POST_REACTION", targetId: postId, userId, type };
  const multi = redis.multi();
  multi.lpush(QUEUE_KEY, JSON.stringify(event));
  multi.hset(postReactionKey(postId), userId, type ?? REMOVED);
  await multi.exec();
}

export async function enqueueCommentReaction(commentId: string, userId: string, type: string | null) {
  const event: ReactionEvent = { id: randomUUID(), kind: "COMMENT_REACTION", targetId: commentId, userId, type };
  const multi = redis.multi();
  multi.lpush(QUEUE_KEY, JSON.stringify(event));
  multi.hset(commentReactionKey(commentId), userId, type ?? REMOVED);
  await multi.exec();
}

export async function getPendingComment(commentId: string): Promise<PendingComment | null> {
  const raw = await redis.get(pendingCommentKey(commentId));
  if (!raw) return null;
  try {
    const comment = JSON.parse(raw) as PendingComment;
    return comment.deleted ? null : comment;
  } catch {
    return null;
  }
}

export async function getPendingCommentStates(postId: string): Promise<PendingComment[]> {
  const ids = await redis.smembers(pendingPostCommentsKey(postId));
  if (!ids.length) return [];
  const rows = await Promise.all(ids.map(async (id) => {
    const raw = await redis.get(pendingCommentKey(id));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as PendingComment;
    } catch {
      return null;
    }
  }));
  return rows.filter((row): row is PendingComment => Boolean(row));
}

export async function getPendingCommentCounts(postIds: string[]): Promise<Record<string, number>> {
  if (!postIds.length) return {};
  const entries = await Promise.all(
    postIds.map(async (postId) => [postId, await getPendingCommentStates(postId)] as const)
  );
  const allIds = entries.flatMap(([, comments]) => comments.map((comment) => comment.id));
  const persistedIds = allIds.length
    ? await prisma.comment.findMany({
        where: { id: { in: allIds } },
        select: { id: true },
      })
    : [];
  const persistedSet = new Set(persistedIds.map((comment) => comment.id));

  return Object.fromEntries(entries.map(([postId, comments]) => {
    const activePendingCount = comments.filter((comment) => !comment.deleted).length;
    const persistedPendingCount = comments.filter((comment) => persistedSet.has(comment.id)).length;
    // Delta over the DB count: add unpersisted active comments and subtract
    // persisted comments that are awaiting deletion.
    return [postId, activePendingCount - persistedPendingCount];
  }));
}

export async function enqueueComment(comment: PendingComment) {
  const event: CommentEvent = {
    id: randomUUID(),
    kind: "COMMENT_CREATE",
    commentId: comment.id,
    version: comment.version,
    comment,
  };
  const multi = redis.multi();
  multi.lpush(QUEUE_KEY, JSON.stringify(event));
  multi.set(pendingCommentKey(comment.id), JSON.stringify(comment));
  multi.sadd(pendingPostCommentsKey(comment.postId), comment.id);
  await multi.exec();
}

export async function updatePendingComment(comment: PendingComment, content: string) {
  const updated: PendingComment = {
    ...comment,
    content,
    isEdited: true,
    updatedAt: new Date().toISOString(),
    version: comment.version + 1,
  };
  const event: CommentEvent = {
    id: randomUUID(),
    kind: "COMMENT_UPDATE",
    commentId: comment.id,
    version: updated.version,
    content,
  };
  const multi = redis.multi();
  multi.lpush(QUEUE_KEY, JSON.stringify(event));
  multi.set(pendingCommentKey(comment.id), JSON.stringify(updated));
  multi.sadd(pendingPostCommentsKey(comment.postId), comment.id);
  await multi.exec();
  return updated;
}

export async function deletePendingComment(comment: PendingComment) {
  const updated: PendingComment = {
    ...comment,
    deleted: true,
    version: comment.version + 1,
    updatedAt: new Date().toISOString(),
  };
  const event: CommentEvent = {
    id: randomUUID(),
    kind: "COMMENT_DELETE",
    commentId: comment.id,
    version: updated.version,
  };
  const multi = redis.multi();
  multi.lpush(QUEUE_KEY, JSON.stringify(event));
  multi.set(pendingCommentKey(comment.id), JSON.stringify(updated));
  multi.sadd(pendingPostCommentsKey(comment.postId), comment.id);
  await multi.exec();
}

async function clearReactionOverlay(kind: ReactionKind, targetId: string, userId: string, expected: string) {
  const key = reactionKey(kind, targetId);
  // Compare and delete atomically so a newer reaction cannot be cleared by an older flush.
  await redis.eval(
    "if redis.call('HGET', KEYS[1], ARGV[1]) == ARGV[2] then return redis.call('HDEL', KEYS[1], ARGV[1]) else return 0 end",
    1,
    key,
    userId,
    expected
  );
}

async function clearPendingComment(commentId: string, version: number, postId?: string) {
  const key = pendingCommentKey(commentId);
  const raw = await redis.get(key);
  if (!raw) return;
  try {
    const current = JSON.parse(raw) as PendingComment;
    if (current.version !== version) return;
    await redis.multi()
      .del(key)
      .srem(pendingPostCommentsKey(postId || current.postId), commentId)
      .exec();
  } catch {
    // Keep malformed pending state for manual inspection rather than silently deleting it.
  }
}

async function applyEvent(event: InteractionEvent) {
  if (event.kind === "POST_REACTION") {
    const post = await prisma.post.findUnique({ where: { id: event.targetId }, select: { id: true } });
    if (post) {
      if (event.type === null) {
        await prisma.postReaction.deleteMany({ where: { postId: event.targetId, userId: event.userId } });
      } else {
        await prisma.postReaction.upsert({
          where: { postId_userId: { postId: event.targetId, userId: event.userId } },
          create: { postId: event.targetId, userId: event.userId, type: event.type as any },
          update: { type: event.type as any },
        });
      }
    }
    await clearReactionOverlay("POST_REACTION", event.targetId, event.userId, event.type ?? REMOVED);
    return;
  }

  if (event.kind === "COMMENT_REACTION") {
    const comment = await prisma.comment.findUnique({ where: { id: event.targetId }, select: { id: true } });
    if (comment) {
      if (event.type === null) {
        await prisma.commentReaction.deleteMany({ where: { commentId: event.targetId, userId: event.userId } });
      } else {
        await prisma.commentReaction.upsert({
          where: { commentId_userId: { commentId: event.targetId, userId: event.userId } },
          create: { commentId: event.targetId, userId: event.userId, type: event.type as any },
          update: { type: event.type as any },
        });
      }
    }
    await clearReactionOverlay("COMMENT_REACTION", event.targetId, event.userId, event.type ?? REMOVED);
    return;
  }

  if (event.kind === "COMMENT_CREATE") {
    const comment = event.comment!;
    const post = await prisma.post.findUnique({ where: { id: comment.postId }, select: { id: true } });
    if (post) {
      await prisma.comment.upsert({
        where: { id: comment.id },
        create: {
          id: comment.id,
          postId: comment.postId,
          authorId: comment.authorId,
          content: comment.content,
          parentId: comment.parentId,
          isEdited: comment.isEdited,
          createdAt: new Date(comment.createdAt),
          updatedAt: new Date(comment.updatedAt),
        },
        update: {},
      });
    }
    await clearPendingComment(comment.id, event.version, comment.postId);
    return;
  }

  if (event.kind === "COMMENT_UPDATE") {
    await prisma.comment.updateMany({
      where: { id: event.commentId },
      data: { content: event.content!, isEdited: true },
    });
    const pending = await getPendingComment(event.commentId);
    if (pending) await clearPendingComment(event.commentId, event.version, pending.postId);
    return;
  }

  if (event.kind === "COMMENT_DELETE") {
    const rawPending = await redis.get(pendingCommentKey(event.commentId));
    let pending: PendingComment | null = null;
    if (rawPending) {
      try {
        pending = JSON.parse(rawPending) as PendingComment;
      } catch {
        pending = null;
      }
    }
    await prisma.comment.deleteMany({ where: { id: event.commentId } });
    if (pending) {
      await redis.multi()
        .del(pendingCommentKey(event.commentId))
        .srem(pendingPostCommentsKey(pending.postId), event.commentId)
        .exec();
    }
  }
}

/**
 * Durable Redis queue + idempotent Prisma writes. Events are moved to a processing
 * list before execution; a crash leaves them there to be retried on the next run.
 */
export async function flushPendingInteractions() {
  const token = randomUUID();
  const lock = await redis.set(LOCK_KEY, token, "PX", 5 * 60 * 1000, "NX");
  if (lock !== "OK") return { flushed: 0, locked: true };

  let flushed = 0;
  try {
    while (flushed < MAX_EVENTS_PER_FLUSH) {
      let raw = await redis.lindex(PROCESSING_KEY, -1);
      if (!raw) {
        const moved = await redis.rpoplpush(QUEUE_KEY, PROCESSING_KEY);
        if (!moved) break;
        raw = await redis.lindex(PROCESSING_KEY, -1);
      }
      if (!raw) break;

      const event = JSON.parse(raw) as InteractionEvent;
      await applyEvent(event);
      await redis.lrem(PROCESSING_KEY, 1, raw);
      await redis.eval(
        "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('PEXPIRE', KEYS[1], ARGV[2]) else return 0 end",
        1,
        LOCK_KEY,
        token,
        5 * 60 * 1000
      );
      flushed += 1;
    }
    return { flushed, locked: false };
  } finally {
    await redis.eval(
      "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) else return 0 end",
      1,
      LOCK_KEY,
      token
    );
  }
}

export async function startInteractionFlushWorker() {
  const run = async () => {
    try {
      const result = await flushPendingInteractions();
      if (result.flushed) console.info(`[write-behind] flushed ${result.flushed} interaction(s)`);
    } catch (error) {
      console.error("[write-behind] flush failed; pending events will be retried:", error);
    }
  };

  // Flush after boot and then every 30 seconds. The Redis queue survives process restarts.
  void run();
  const timer = setInterval(() => void run(), 30_000);
  timer.unref?.();
  return () => clearInterval(timer);
}
