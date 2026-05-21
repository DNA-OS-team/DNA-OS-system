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
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:5100
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
COPY dnaos-frontend ./dnaos-frontend
RUN pnpm --dir dnaos-frontend build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_BASE_URL=http://localhost:5100
COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dnaos-frontend ./dnaos-frontend
WORKDIR /app/dnaos-frontend
EXPOSE 3000
CMD ["pnpm", "start"]
