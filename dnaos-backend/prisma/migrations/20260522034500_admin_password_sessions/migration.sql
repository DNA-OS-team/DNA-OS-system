-- Add password-session storage for ADMIN-only username/password login.

CREATE TABLE "admin_sessions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "session_token_hash" TEXT NOT NULL,
  "admin_id" UUID NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "revoked_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "admin_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "admin_sessions_session_token_hash_key" ON "admin_sessions"("session_token_hash");
CREATE INDEX "admin_sessions_admin_id_idx" ON "admin_sessions"("admin_id");
CREATE INDEX "admin_sessions_expires_at_idx" ON "admin_sessions"("expires_at");

ALTER TABLE "admin_sessions"
  ADD CONSTRAINT "admin_sessions_admin_id_fkey"
  FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;
