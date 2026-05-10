"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class DashboardController {
    async listSavedSearches(req, reply) {
        const organizationId = req.user.organizationId;
        const searches = await prisma.savedSearch.findMany({
            where: { organizationId },
            orderBy: { createdAt: 'desc' }
        });
        return reply.send({ success: true, data: searches });
    }
    async createSavedSearch(req, reply) {
        const organizationId = req.user.organizationId;
        const userId = req.user.id;
        const { name, query, filters } = req.body;
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
    async deleteSavedSearch(req, reply) {
        const organizationId = req.user.organizationId;
        const { searchId } = req.params;
        await prisma.savedSearch.deleteMany({
            where: { id: searchId, organizationId }
        });
        return reply.send({ success: true });
    }
    async listDashboards(req, reply) {
        const organizationId = req.user.organizationId;
        const dashboards = await prisma.dashboard.findMany({
            where: { organizationId },
            orderBy: { updatedAt: 'desc' }
        });
        return reply.send({ success: true, data: dashboards });
    }
    async createDashboard(req, reply) {
        const organizationId = req.user.organizationId;
        const userId = req.user.id;
        const { name, config } = req.body;
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
    async updateDashboard(req, reply) {
        const organizationId = req.user.organizationId;
        const { dashboardId } = req.params;
        const { name, config } = req.body;
        const updateData = {};
        if (name)
            updateData.name = name;
        if (config)
            updateData.config = config;
        const dashboard = await prisma.dashboard.updateMany({
            where: { id: dashboardId, organizationId },
            data: updateData
        });
        return reply.send({ success: true });
    }
    async deleteDashboard(req, reply) {
        const organizationId = req.user.organizationId;
        const { dashboardId } = req.params;
        await prisma.dashboard.deleteMany({
            where: { id: dashboardId, organizationId }
        });
        return reply.send({ success: true });
    }
}
exports.DashboardController = DashboardController;
