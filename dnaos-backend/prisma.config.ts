import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations"
  },
  datasource: {
    // env() throws at build time when DIRECT_URL is absent; process.env fallback is safe
    // because `prisma generate` never connects to the database
    url: process.env.DIRECT_URL ?? "postgresql://"
  }
});
