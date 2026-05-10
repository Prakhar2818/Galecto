"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationController = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class OrganizationController {
    async getSettings(req, reply) {
        const organizationId = req.user.organizationId;
        const org = await prisma.organization.findUnique({
            where: { id: organizationId },
            select: { id: true, name: true, retentionDays: true }
        });
        return reply.send({ success: true, data: org });
    }
    async updateSettings(req, reply) {
        const organizationId = req.user.organizationId;
        const { retentionDays } = req.body;
        const updateData = {};
        if (retentionDays !== undefined) {
            updateData.retentionDays = retentionDays;
        }
        const org = await prisma.organization.update({
            where: { id: organizationId },
            data: updateData,
        });
        return reply.send({ success: true, data: { retentionDays: org.retentionDays } });
    }
}
exports.OrganizationController = OrganizationController;
