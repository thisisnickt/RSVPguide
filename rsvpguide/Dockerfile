# ─────────────────────────────────────────────────────────────────────────────
# RSVPguide — Docker image for Hostinger VPS deployment
#
# Multi-stage build:
#   1. deps    — install all dependencies (including dev deps for the build)
#   2. builder — compile the Next.js app with output: 'standalone'
#   3. runner  — minimal production image (copies standalone bundle only)
#
# Build and run:
#   docker build -t rsvpguide .
#   docker run -p 3000:3000 --env-file .env.local rsvpguide
# ─────────────────────────────────────────────────────────────────────────────

FROM node:18-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ── Stage 1: Install all deps (dev included — needed for next build) ──────────
FROM base AS deps
COPY package*.json ./
RUN npm ci

# ── Stage 2: Build ────────────────────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable Next.js telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ── Stage 3: Production runner (standalone bundle only) ───────────────────────
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Copy only what the standalone server needs
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

USER nextjs

EXPOSE 3000

# server.js is the standalone Next.js HTTP server
CMD ["node", "server.js"]
