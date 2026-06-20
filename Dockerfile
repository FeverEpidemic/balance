ARG BUILDPLATFORM
ARG TARGETPLATFORM

# Optional build-args — override via --build-arg for production builds.
# Defaults are suitable for local self-hosted Supabase.
ARG NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=placeholder_key_change_me
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000

FROM --platform=$BUILDPLATFORM node:22-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS builder
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
COPY package.json package-lock.json ./
RUN npm ci && npm cache clean --force
COPY . .
# Cache-bust: force rebuild when NEXT_PUBLIC_* args change
RUN echo "Building for site: $NEXT_PUBLIC_SITE_URL" && echo "$NEXT_PUBLIC_SITE_URL" > /tmp/build-env.txt
RUN npm run build

FROM node:22-alpine AS runner
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_SITE_URL
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
# Runtime overrides — docker-compose env_file takes precedence at runtime
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/scripts ./scripts
# Copy node_modules so scheduler scripts (e.g. web-push) can resolve
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["node", "server.js"]
