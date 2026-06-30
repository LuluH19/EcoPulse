# syntax=docker/dockerfile:1

FROM node:22-alpine AS base

# --- deps : installe les dépendances seules, pour profiter du cache Docker ---
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# npm install (pas npm ci) : le lockfile généré sur macOS/arm64 n'enregistre pas
# toutes les optionalDependencies natives linux (ex. @emnapi/*, binaires WASI de
# secours), ce que `npm ci` refuse strictement. `npm install` les résout pour la
# plateforme réelle du conteneur.
RUN npm install

# --- builder : build Next.js en mode standalone ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- runner : image d'exécution minimale, utilisateur non-root ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
