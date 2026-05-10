"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.container = void 0;
require("reflect-metadata");
const tsyringe_1 = require("tsyringe");
Object.defineProperty(exports, "container", { enumerable: true, get: function () { return tsyringe_1.container; } });
const user_repository_1 = require("../repositories/user.repository");
const organization_repository_1 = require("../repositories/organization.repository");
const project_repository_1 = require("../repositories/project.repository");
const auth_service_1 = require("../services/auth.service");
// Register Repositories
tsyringe_1.container.register(user_repository_1.UserRepository, { useClass: user_repository_1.UserRepository });
tsyringe_1.container.register(organization_repository_1.OrganizationRepository, {
    useClass: organization_repository_1.OrganizationRepository,
});
tsyringe_1.container.register(project_repository_1.ProjectRepository, { useClass: project_repository_1.ProjectRepository });
// Register Services
tsyringe_1.container.register(auth_service_1.AuthService, { useClass: auth_service_1.AuthService });
