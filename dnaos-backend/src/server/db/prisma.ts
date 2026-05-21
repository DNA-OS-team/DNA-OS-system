import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.js";
import { env } from "../../config/env.js";

let prisma: PrismaClient | undefined;

export function getPrisma() {
  if (!env.DATABASE_URL) {
    throw new Error("Prisma requires DATABASE_URL.");
  }

  prisma ??= new PrismaClient({
    adapter: new PrismaPg({
      connectionString: env.DATABASE_URL
    })
  });

  return prisma;
}
