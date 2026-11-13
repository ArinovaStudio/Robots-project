import Redis from "ioredis";

const globalForRedis = global as unknown as { redis?: Redis };

function createClient() {
  const client = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    connectTimeout: 2000,
    commandTimeout: 2000,
  });
  client.on("error", (err) => console.error("[REDIS] error:", err.message));
  return client;
}
export const redis = globalForRedis.redis || createClient();

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;
