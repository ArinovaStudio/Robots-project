# =============================================================================
# Robots Project — Multi-stage Docker Build
# Stage 1: Build Next.js + compile server.ts
# Stage 2: Lean production runner
# =============================================================================

FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js
RUN npx next build

# Compile server.ts + socket handlers → server-dist/
RUN npx tsc --project tsconfig.server.json --outDir server-dist

# =============================================================================

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install production deps only
COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps

# Prisma generated engine (produced by builder's `prisma generate`)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Next.js build output
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Compiled server + socket handlers
COPY --from=builder /app/server-dist ./server-dist

# Prisma schema (needed by adapter at runtime)
COPY --from=builder /app/prisma ./prisma

EXPOSE 3002

CMD ["node", "server-dist/server.js"]
