import type { FastifyInstance } from "fastify";
import { getCurrentLineSession } from "../services/authService.js";
import { getPrisma } from "../db/prisma.js";

export async function registerPortalRoutes(app: FastifyInstance) {
  app.get("/me", async (request, reply) => {
    const session = await getCurrentLineSession(request);
    if (!session || session.user.status !== "ACTIVE") {
      return reply.code(401).send({ error: "Unauthorized" });
    }

    const prisma = getPrisma();
    const identity = await prisma.userIdentity.findFirst({
      where: { userId: session.userId, provider: "LINE" },
      select: { displayName: true, pictureUrl: true },
    });

    return {
      userId: session.userId,
      role: session.role,
      displayName: identity?.displayName ?? session.user.name ?? "",
      pictureUrl: identity?.pictureUrl ?? null,
      company: {
        id: session.company.id,
        name: session.company.name,
        type: session.company.type,
      },
    };
  });
}
