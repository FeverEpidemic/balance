ARG BUILDPLATFORM
ARG TARGETPLATFORM

FROM --platform=$BUILDPLATFORM node:22-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS builder
# Default values for self-hosted/local dev. Override via --build-arg if needed.
ENV NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=placeholder_key_change_me
ENV NEXT_PUBLIC_SITE_URL=http://localhost:3000
COPY package.json package-lock.json ./
RUN npm ci && npm cache clean --force
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
# Runtime values — will be overridden by docker-compose env_file at runtime.
ENV NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=placeholder_key_change_me
ENV NEXT_PUBLIC_SITE_URL=http://localhost:3000

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/scripts ./scripts

EXPOSE 3000

CMD ["node", "server.js"]
