-- Add LINE-first identity and session foundation.

ALTER TYPE "UserStatus" ADD VALUE IF NOT EXISTS 'LINE_LINKED';
ALTER TYPE "UserStatus" ADD VALUE IF NOT EXISTS 'SUSPENDED';

CREATE TYPE "IdentityProvider" AS ENUM ('LINE');
CREATE TYPE "SessionType" AS ENUM ('LINE', 'SUPERADMIN');

CREATE TABLE "user_identities" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "provider" "IdentityProvider" NOT NULL DEFAULT 'LINE',
  "provider_user_id" TEXT NOT NULL,
  "display_name" TEXT,
  "picture_url" TEXT,
  "linked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_login_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "user_identities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "line_link_tokens" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "token_hash" TEXT NOT NULL,
  "user_id" UUID NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "used_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "line_link_tokens_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "app_sessions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "session_token_hash" TEXT NOT NULL,
  "user_id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "role" "Role" NOT NULL,
  "line_user_id" TEXT NOT NULL,
  "session_type" "SessionType" NOT NULL DEFAULT 'LINE',
  "expires_at" TIMESTAMP(3) NOT NULL,
  "revoked_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "app_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_identities_provider_provider_user_id_key" ON "user_identities"("provider", "provider_user_id");
CREATE UNIQUE INDEX "user_identities_user_id_provider_key" ON "user_identities"("user_id", "provider");
CREATE INDEX "user_identities_user_id_idx" ON "user_identities"("user_id");

CREATE UNIQUE INDEX "line_link_tokens_token_hash_key" ON "line_link_tokens"("token_hash");
CREATE INDEX "line_link_tokens_user_id_idx" ON "line_link_tokens"("user_id");
CREATE INDEX "line_link_tokens_expires_at_idx" ON "line_link_tokens"("expires_at");

CREATE UNIQUE INDEX "app_sessions_session_token_hash_key" ON "app_sessions"("session_token_hash");
CREATE INDEX "app_sessions_user_id_idx" ON "app_sessions"("user_id");
CREATE INDEX "app_sessions_company_id_idx" ON "app_sessions"("company_id");
CREATE INDEX "app_sessions_expires_at_idx" ON "app_sessions"("expires_at");

ALTER TABLE "user_identities"
  ADD CONSTRAINT "user_identities_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "line_link_tokens"
  ADD CONSTRAINT "line_link_tokens_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "app_sessions"
  ADD CONSTRAINT "app_sessions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "app_sessions"
  ADD CONSTRAINT "app_sessions_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
