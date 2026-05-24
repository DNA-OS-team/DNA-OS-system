import "dotenv/config";
import { hashPassword } from "../../core/auth/password.js";
import { getPrisma } from "./prisma.js";

const superadminUsername = "dnaos";
const superadminPassword = "iamadmin";

async function main() {
  const prisma = getPrisma();
  const passwordHash = await hashPassword(superadminPassword);

  await prisma.admin.upsert({
    where: {
      username: superadminUsername
    },
    update: {
      singletonKey: 1,
      email: "admin@dnaos.local",
      name: "DNA OS Admin",
      phoneNumber: null,
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE"
    },
    create: {
      singletonKey: 1,
      username: superadminUsername,
      email: "admin@dnaos.local",
      name: "DNA OS Admin",
      phoneNumber: null,
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE"
    }
  });

  console.log(`Superadmin user ready: ${superadminUsername}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });
