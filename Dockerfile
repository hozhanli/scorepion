# syntax=docker/dockerfile:1.7

# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY patches ./patches
RUN npm ci --ignore-scripts

COPY tsconfig.base.json tsconfig.json ./
COPY server ./server
COPY shared ./shared
COPY app.json ./

RUN npx esbuild server/index.ts \
    --platform=node \
    --packages=external \
    --bundle \
    --format=esm \
    --outdir=server_dist

# ---- Production deps ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY patches ./patches
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# ---- Runtime ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs && adduser -S scorepion -u 1001
USER scorepion

COPY --from=deps --chown=scorepion:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=scorepion:nodejs /app/server_dist ./server_dist
COPY --chown=scorepion:nodejs package.json app.json ./
COPY --chown=scorepion:nodejs server/templates ./server/templates
COPY --chown=scorepion:nodejs server/migrations ./server/migrations

EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||5000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server_dist/index.js"]
