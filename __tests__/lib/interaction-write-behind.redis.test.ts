import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import {
  enqueueComment,
  enqueueCommentReaction,
  enqueuePostReaction,
  deletePendingComment,
  flushPendingInteractions,
  getPendingComment,
  getPendingCommentCounts,
  getPendingCommentStates,
  getPendingReactionStates,
  updatePendingComment,
  PENDING_REMOVED_REACTION,
  type PendingComment,
} from "@/lib/interaction-write-behind";

const enabled =
  process.env.WRITE_BEHIND_TEST === "1" && !!process.env.REDIS_URL && !!process.env.DATABASE_URL;
const suite = enabled ? describe : describe.skip;

const QUEUE_KEY = "robots:interactions:write-behind:queue";
const PROCESSING_KEY = "robots:interactions:write-behind:processing";

/** Flush until the queue is drained (retries if the lock is held elsewhere). */
async function flushAll(timeoutMs = 15_000) {
  const start = Date.now();
  let total = 0;
  while (Date.now() - start < timeoutMs) {
    const res = await flushPendingInteractions();
    total += res.flushed;
    const [q, p] = await Promise.all([redis.llen(QUEUE_KEY), redis.llen(PROCESSING_KEY)]);
    if (!res.locked && q === 0 && p === 0) return total;
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error("Queue did not drain in time");
}

function makeComment(postId: string, authorId: string, over: Partial<PendingComment> = {}): PendingComment {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    postId,
    authorId,
    content: "hello redis",
    parentId: null,
    isEdited: false,
    createdAt: now,
    updatedAt: now,
    version: 1,
    author: { id: authorId, name: "WB Test", image: null, investor: null, company: null },
    ...over,
  };
}

suite("Redis write-behind (likes & comments) against real Redis + Postgres", () => {
  const tag = `wbtest-${Date.now()}`;
  let userA: string;
  let userB: string;
  let postId: string;

  beforeAll(async () => {
    const a = await prisma.user.create({ data: { email: `${tag}-a@example.test`, name: "WB A", isOnboarded: true } });
    const b = await prisma.user.create({ data: { email: `${tag}-b@example.test`, name: "WB B", isOnboarded: true } });
    userA = a.id;
    userB = b.id;
    const post = await prisma.post.create({ data: { authorId: userA, content: `${tag} post` } });
    postId = post.id;
    await flushAll(); // start from an empty queue
  });

  afterAll(async () => {
    // Cascades remove the post, comments and reactions.
    await prisma.user.deleteMany({ where: { email: { startsWith: tag } } });
    const keys = await redis.keys(`robots:pending:*${postId}*`);
    if (keys.length) await redis.del(...keys);
    await redis.quit();
    await prisma.$disconnect();
  });

  describe("post reactions", () => {
    it("buffers a like in Redis, then persists it on flush and clears the overlay", async () => {
      await enqueuePostReaction(postId, userB, "LIKE");

      // Visible via overlay, NOT yet in DB
      const pending = (await getPendingReactionStates("POST_REACTION", [postId]))[postId];
      expect(pending[userB]).toBe("LIKE");
      expect(await prisma.postReaction.count({ where: { postId, userId: userB } })).toBe(0);
      expect(await redis.llen(QUEUE_KEY)).toBeGreaterThanOrEqual(1);

      await flushAll();

      const row = await prisma.postReaction.findUnique({ where: { postId_userId: { postId, userId: userB } } });
      expect(row?.type).toBe("LIKE");
      expect((await getPendingReactionStates("POST_REACTION", [postId]))[postId]).toEqual({});
    });

    it("keeps only the final reaction when changed before the flush", async () => {
      await enqueuePostReaction(postId, userA, "LIKE");
      await enqueuePostReaction(postId, userA, "LOVE");

      expect((await getPendingReactionStates("POST_REACTION", [postId]))[postId][userA]).toBe("LOVE");

      await flushAll();

      const rows = await prisma.postReaction.findMany({ where: { postId, userId: userA } });
      expect(rows).toHaveLength(1);
      expect(rows[0].type).toBe("LOVE");
      expect((await getPendingReactionStates("POST_REACTION", [postId]))[postId]).toEqual({});
    });

    it("like then remove before flush leaves no row", async () => {
      await prisma.postReaction.deleteMany({ where: { postId, userId: userA } });
      await enqueuePostReaction(postId, userA, "LIKE");
      await enqueuePostReaction(postId, userA, null);

      expect((await getPendingReactionStates("POST_REACTION", [postId]))[postId][userA]).toBe(
        PENDING_REMOVED_REACTION
      );

      await flushAll();

      expect(await prisma.postReaction.count({ where: { postId, userId: userA } })).toBe(0);
      expect((await getPendingReactionStates("POST_REACTION", [postId]))[postId]).toEqual({});
    });

    it("removing an already-persisted reaction deletes it on flush", async () => {
      // userB's LIKE was persisted in the first test
      expect(await prisma.postReaction.count({ where: { postId, userId: userB } })).toBe(1);
      await enqueuePostReaction(postId, userB, null);
      expect(await prisma.postReaction.count({ where: { postId, userId: userB } })).toBe(1); // still there
      await flushAll();
      expect(await prisma.postReaction.count({ where: { postId, userId: userB } })).toBe(0);
    });

    it("does not throw for a reaction on a post that no longer exists", async () => {
      const ghostPost = randomUUID();
      await enqueuePostReaction(ghostPost, userA, "LIKE");
      await expect(flushAll()).resolves.toBeGreaterThanOrEqual(1);
      expect((await getPendingReactionStates("POST_REACTION", [ghostPost]))[ghostPost]).toEqual({});
    });
  });

  describe("comments", () => {
    it("buffers a comment, exposes it via overlay, persists on flush, clears overlay", async () => {
      const c = makeComment(postId, userA);
      await enqueueComment(c);

      expect((await getPendingComment(c.id))?.content).toBe("hello redis");
      expect((await getPendingCommentStates(postId)).map((x) => x.id)).toContain(c.id);
      expect((await getPendingCommentCounts([postId]))[postId]).toBe(1);
      expect(await prisma.comment.count({ where: { id: c.id } })).toBe(0);

      await flushAll();

      const row = await prisma.comment.findUnique({ where: { id: c.id } });
      expect(row?.content).toBe("hello redis");
      expect(row?.authorId).toBe(userA);
      expect(await getPendingComment(c.id)).toBeNull();
      expect((await getPendingCommentCounts([postId]))[postId]).toBe(0);
    });

    it("applies an edit made before the flush (create + update)", async () => {
      const c = makeComment(postId, userA, { content: "original" });
      await enqueueComment(c);
      await updatePendingComment(c, "edited");

      expect((await getPendingComment(c.id))?.content).toBe("edited");

      await flushAll();

      const row = await prisma.comment.findUnique({ where: { id: c.id } });
      expect(row?.content).toBe("edited");
      expect(row?.isEdited).toBe(true);
    });

    it("create + delete before the flush leaves nothing in the DB", async () => {
      const c = makeComment(postId, userA, { content: "short-lived" });
      await enqueueComment(c);
      await deletePendingComment(c);

      expect(await getPendingComment(c.id)).toBeNull(); // hidden immediately

      await flushAll();

      expect(await prisma.comment.count({ where: { id: c.id } })).toBe(0);
      expect(await redis.exists(`robots:pending:comment:${c.id}`)).toBe(0);
    });

    it("deleting an already-persisted comment removes it on flush", async () => {
      const c = makeComment(postId, userA, { content: "persist then delete" });
      await enqueueComment(c);
      await flushAll();
      expect(await prisma.comment.count({ where: { id: c.id } })).toBe(1);

      const persisted = { ...c, version: 1 };
      await deletePendingComment(persisted);
      // Persisted-but-pending-delete should count as -1 on top of the DB count
      expect((await getPendingCommentCounts([postId]))[postId]).toBe(-1);
      await flushAll();
      expect(await prisma.comment.count({ where: { id: c.id } })).toBe(0);
    });

    it("persists replies with parentId", async () => {
      const parent = makeComment(postId, userA, { content: "parent" });
      const reply = makeComment(postId, userB, { content: "reply", parentId: parent.id });
      await enqueueComment(parent);
      await enqueueComment(reply);
      await flushAll();

      const row = await prisma.comment.findUnique({ where: { id: reply.id } });
      expect(row?.parentId).toBe(parent.id);
    });
  });

  describe("comment reactions", () => {
    it("buffers and persists a comment reaction", async () => {
      const c = makeComment(postId, userA);
      await enqueueComment(c);
      await flushAll();

      await enqueueCommentReaction(c.id, userB, "LIKE");
      expect((await getPendingReactionStates("COMMENT_REACTION", [c.id]))[c.id][userB]).toBe("LIKE");
      expect(await prisma.commentReaction.count({ where: { commentId: c.id } })).toBe(0);

      await flushAll();

      const row = await prisma.commentReaction.findUnique({
        where: { commentId_userId: { commentId: c.id, userId: userB } },
      });
      expect(row?.type).toBe("LIKE");
      expect((await getPendingReactionStates("COMMENT_REACTION", [c.id]))[c.id]).toEqual({});
    });
  });

  describe("durability & concurrency", () => {
    it("recovers an event stranded in the processing list (simulated crash)", async () => {
      await prisma.postReaction.deleteMany({ where: { postId, userId: userB } });
      await enqueuePostReaction(postId, userB, "SUPPORT");

      // Simulate a worker that popped the event and died before applying it.
      await redis.rpoplpush(QUEUE_KEY, PROCESSING_KEY);
      expect(await redis.llen(PROCESSING_KEY)).toBe(1);
      expect(await redis.llen(QUEUE_KEY)).toBe(0);

      await flushAll();

      const row = await prisma.postReaction.findUnique({ where: { postId_userId: { postId, userId: userB } } });
      expect(row?.type).toBe("SUPPORT");
      expect(await redis.llen(PROCESSING_KEY)).toBe(0);
    });

    it("only one of several concurrent flushers does the work (lock)", async () => {
      await prisma.postReaction.deleteMany({ where: { postId, userId: userA } });
      await enqueuePostReaction(postId, userA, "INSIGHTFUL");

      const results = await Promise.all(Array.from({ length: 5 }, () => flushPendingInteractions()));
      expect(results.filter((r) => !r.locked).length).toBeGreaterThanOrEqual(1);
      expect(results.reduce((s, r) => s + r.flushed, 0)).toBe(1); // applied exactly once

      await flushAll();
      expect(await prisma.postReaction.count({ where: { postId, userId: userA } })).toBe(1);
    });

    it("replaying the same events is idempotent", async () => {
      const c = makeComment(postId, userA, { content: "idempotent" });
      await enqueueComment(c);
      // Duplicate the CREATE event as if it were redelivered
      const raw = await redis.lindex(QUEUE_KEY, 0);
      await redis.lpush(QUEUE_KEY, raw as string);

      await flushAll();

      expect(await prisma.comment.count({ where: { id: c.id } })).toBe(1);
    });
  });
});