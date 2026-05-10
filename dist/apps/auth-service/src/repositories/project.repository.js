"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectRepository = void 0;
const client_1 = require("../prisma/client");
const tsyringe_1 = require("tsyringe");
const uuid_1 = require("uuid");
let ProjectRepository = class ProjectRepository {
    async create(organizationId, name) {
        return client_1.prisma.project.create({
            data: {
                name,
                organizationId,
            },
        });
    }
    async createApiKey(projectId, name = "Default Key") {
        return client_1.prisma.apiKey.create({
            data: {
                key: `gl_live_${(0, uuid_1.v4)().replace(/-/g, "")}`,
                name,
                projectId,
            },
        });
    }
    async findByOrgId(organizationId) {
        return client_1.prisma.project.findMany({
            where: { organizationId },
            include: { apiKeys: true },
        });
    }
};
exports.ProjectRepository = ProjectRepository;
exports.ProjectRepository = ProjectRepository = __decorate([
    (0, tsyringe_1.injectable)()
], ProjectRepository);
