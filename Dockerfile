# ============================================
# Stage 1: Install dependencies
# ============================================
FROM node:20-alpine AS deps

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ============================================
# Stage 2: Build the application
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js
RUN npm run build

# ============================================
# Stage 3: Production runner
# ============================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy package files and install production deps + ts-node (needed for custom server)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && \
    npm install ts-node typescript @types/node

# Copy Prisma schema and generated client
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/app/generated ./app/generated

# Copy Next.js build output
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts

# Copy custom server, socket handlers, and config files
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/tsconfig.server.json ./tsconfig.server.json
COPY --from=builder /app/socket ./socket

# Copy proxy (Next.js 16 middleware replacement)
COPY --from=builder /app/proxy.ts ./proxy.ts

# Copy lib directory (needed by proxy.ts at runtime)
COPY --from=builder /app/lib ./lib

# Create uploads directory
RUN mkdir -p /app/public/uploads && chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start the custom server (which boots Next.js + Socket.IO)
CMD ["npx", "ts-node", "--project", "tsconfig.server.json", "server.ts"]
