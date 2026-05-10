import { FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class DashboardController {
  
  async listSavedSearches(req: FastifyRequest, reply: FastifyReply) {
    const organizationId = (req as any).user.organizationId;
    
    const searches = await prisma.savedSearch.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' }
    });
    
    return reply.send({ success: true, data: searches });
  }

  async createSavedSearch(req: FastifyRequest, reply: FastifyReply) {
    const organizationId = (req as any).user.organizationId;
    const userId = (req as any).user.id;
    const { name, query, filters } = req.body as any;

    const search = await prisma.savedSearch.create({
      data: {
        organizationId,
        name,
        query,
        filters: filters || {},
        createdBy: userId
      }
    });

    return reply.send({ success: true, data: search });
  }

  async deleteSavedSearch(req: FastifyRequest, reply: FastifyReply) {
    const organizationId = (req as any).user.organizationId;
    const { searchId } = req.params as { searchId: string };

    await prisma.savedSearch.deleteMany({
      where: { id: searchId, organizationId }
    });

    return reply.send({ success: true });
  }

  async listDashboards(req: FastifyRequest, reply: FastifyReply) {
    const organizationId = (req as any).user.organizationId;
    
    const dashboards = await prisma.dashboard.findMany({
      where: { organizationId },
      orderBy: { updatedAt: 'desc' }
    });
    
    return reply.send({ success: true, data: dashboards });
  }

  async createDashboard(req: FastifyRequest, reply: FastifyReply) {
    const organizationId = (req as any).user.organizationId;
    const userId = (req as any).user.id;
    const { name, config } = req.body as any;

    const dashboard = await prisma.dashboard.create({
      data: {
        organizationId,
        name,
        config: config || {},
        createdBy: userId
      }
    });

    return reply.send({ success: true, data: dashboard });
  }

  async updateDashboard(req: FastifyRequest, reply: FastifyReply) {
    const organizationId = (req as any).user.organizationId;
    const { dashboardId } = req.params as { dashboardId: string };
    const { name, config } = req.body as any;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (config) updateData.config = config;

    const dashboard = await prisma.dashboard.updateMany({
      where: { id: dashboardId, organizationId },
      data: updateData
    });

    return reply.send({ success: true });
  }

  async deleteDashboard(req: FastifyRequest, reply: FastifyReply) {
    const organizationId = (req as any).user.organizationId;
    const { dashboardId } = req.params as { dashboardId: string };

    await prisma.dashboard.deleteMany({
      where: { id: dashboardId, organizationId }
    });

    return reply.send({ success: true });
  }
}