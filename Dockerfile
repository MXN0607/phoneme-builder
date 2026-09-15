# syntax=docker/dockerfile:1

# Pinned to the exact Node version this project was built/tested against.
FROM node:22-alpine AS base
# libc6-compat + openssl are required for Prisma's query engine on Alpine.
RUN apk add --no-cache libc6-compat openssl

# ---------- deps: install dependencies once, cached across builds ----------
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# The prisma schema needs to be present for the `postinstall` (`prisma
# generate`) script that npm ci triggers.
COPY prisma ./prisma
RUN npm ci

# ---------- builder: compile the Next.js app ----------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY . .
RUN npx prisma generate
RUN npm run build

# ---------- runner: minimal image that actually runs the app ----------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# SQLite file lives under /app/data so it can be mounted as a volume and
# survive container recreation (see docker-compose.yml).
ENV DATABASE_URL="file:/app/data/prod.db"

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Full node_modules (not just a standalone-traced subset) so the Prisma CLI
# and seed tooling — not just @prisma/client — are available at container
# start, since migrations/seeding run there rather than at build time.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/app ./app
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY docker-entrypoint.sh ./docker-entrypoint.sh

RUN mkdir -p /app/data \
  && chown -R nextjs:nodejs /app/data /app/.next \
  && chmod +x ./docker-entrypoint.sh

USER nextjs

EXPOSE 3000

# Matches the brief's "health API returning 200 OK at /health" check.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health').then(r=>{if(!r.ok)throw 0}).catch(()=>process.exit(1))"

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
