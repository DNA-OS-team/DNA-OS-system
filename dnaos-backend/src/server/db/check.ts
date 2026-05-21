import "dotenv/config";
import { getPrisma } from "./prisma.js";

const prisma = getPrisma();

try {
  await prisma.$queryRaw`SELECT 1`;
  console.log("Database connection OK");
} catch (error) {
  console.error("Database connection failed");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
