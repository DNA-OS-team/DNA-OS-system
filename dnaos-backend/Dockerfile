FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY dnaos-backend/package.json dnaos-backend/package.json
COPY dnaos-frontend/package.json dnaos-frontend/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
ENV DATABASE_URL="postgresql://postgres:postgres@postgres:5432/dnaos_dev?schema=public"
ENV DIRECT_URL="postgresql://postgres:postgres@postgres:5432/dnaos_dev?schema=public"
COPY dnaos-backend ./dnaos-backend
RUN pnpm --dir dnaos-backend db:generate
RUN pnpm --dir dnaos-backend build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dnaos-backend ./dnaos-backend
WORKDIR /app/dnaos-backend
EXPOSE 5100
CMD ["pnpm", "start"]
