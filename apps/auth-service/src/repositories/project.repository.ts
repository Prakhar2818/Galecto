import { prisma } from "../prisma/client";
import { injectable } from "tsyringe";
import { v4 as uuidv4 } from "uuid";

@injectable()
export class ProjectRepository {
  async create(organizationId: string, name: string) {
    return prisma.project.create({
      data: {
        name,
        organizationId,
      },
    });
  }

  async createApiKey(projectId: string, name: string = "Default Key") {
    return prisma.apiKey.create({
      data: {
        key: `gl_live_${uuidv4().replace(/-/g, "")}`,
        name,
        projectId,
      },
    });
  }

  async findByOrgId(organizationId: string) {
    return prisma.project.findMany({
      where: { organizationId },
      include: { apiKeys: true },
    });
  }
}
