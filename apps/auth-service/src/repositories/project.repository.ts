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

  async createApiKey(projectId: string, name: string) {
    return prisma.apiKey.create({
      data: {
        projectId,
        name,
        key: `gl_${uuidv4().replace(/-/g, '')}`,
      },
    });
  }

  async findByOrgId(organizationId: string) {
    return prisma.project.findMany({
      where: { organizationId },
    });
  }

  async rotateApiKey(keyId: string) {
    const newKey = `gl_${uuidv4().replace(/-/g, '')}`;
    return prisma.apiKey.update({
      where: { id: keyId },
      data: { key: newKey },
    });
  }

  async listApiKeyAuditLogs(organizationId: string) {
    return prisma.apiKeyAuditLog.findMany({
      where: { organizationId },
      orderBy: { performedAt: 'desc' },
      take: 100,
    });
  }
}