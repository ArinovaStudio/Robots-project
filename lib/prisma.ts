import { PrismaClient } from "@prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"
import { neonConfig } from "@neondatabase/serverless"
import ws from "ws"

neonConfig.webSocketConstructor = ws
const TRANSIENT_PATTERNS = [
  "connection terminated",
  "connection closed",
  "connection refused",
  "server closed the connection",
  "terminating connection",
  "econnreset",
  "etimedout",
  "econnrefused",
  "websocket",
  "timeout exceeded when trying to connect",
  "can't reach database server",
  "control plane request failed",
  "the database system is starting up",
  "the database system is resuming",
]
const TRANSIENT_CODES = new Set(["P1001", "P1002", "P1008", "P1017", "P2024"])

function isTransient(err: unknown): boolean {
  const e = err as { code?: string; message?: string; cause?: { message?: string } }
  if (e?.code && TRANSIENT_CODES.has(e.code)) return true
  const text = `${e?.message ?? ""} ${e?.cause?.message ?? ""}`.toLowerCase()
  return TRANSIENT_PATTERNS.some((p) => text.includes(p))
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function createClient() {
  const adapter = new PrismaNeon(
    {
      connectionString: process.env.DATABASE_URL!,
      // Fail fast and retry rather than hanging while the compute wakes up
      connectionTimeoutMillis: 10_000,
      // Drop idle sockets before Neon does, so we rarely reuse a dead one
      idleTimeoutMillis: 10_000,
    },
    {
      onPoolError: (err) => console.warn("[prisma] pool error (will reconnect):", err.message),
    }
  )

  return new PrismaClient({ adapter }).$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          const maxAttempts = 4
          for (let attempt = 1; ; attempt++) {
            try {
              return await query(args)
            } catch (err) {
              if (attempt >= maxAttempts || !isTransient(err)) throw err
              await sleep(400 * attempt) // 400ms, 800ms, 1200ms: covers Neon wake-up
            }
          }
        },
      },
    },
  })
}

type ExtendedPrisma = ReturnType<typeof createClient>

const globalForPrisma = global as unknown as { prisma?: ExtendedPrisma }

export const prisma = globalForPrisma.prisma || createClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma