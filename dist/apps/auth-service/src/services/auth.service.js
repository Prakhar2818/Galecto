"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const tsyringe_1 = require("tsyringe");
const user_repository_1 = require("../repositories/user.repository");
const organization_repository_1 = require("../repositories/organization.repository");
const project_repository_1 = require("../repositories/project.repository");
const hash_1 = require("../utils/hash");
let AuthService = class AuthService {
    constructor(userRepo, orgRepo, projectRepo) {
        this.userRepo = userRepo;
        this.orgRepo = orgRepo;
        this.projectRepo = projectRepo;
    }
    async register(email, password, organizationName) {
        const existing = await this.userRepo.findByEmail(email);
        if (existing) {
            throw new Error("User already exists");
        }
        // 1. Create the Organization
        const org = await this.orgRepo.create(organizationName);
        // 2. Create Default Project
        const project = await this.projectRepo.create(org.id, "Default Project");
        // 3. Create Initial API Key
        const apiKey = await this.projectRepo.createApiKey(project.id, "Primary Key");
        // 4. Hash the password
        const hashed = await (0, hash_1.hashPassword)(password);
        // 5. Create the User linked to the Org
        const user = await this.userRepo.create({
            email,
            password: hashed,
            organizationId: org.id,
        });
        return { user, org, project, apiKey };
    }
    async login(email, password) {
        const user = await this.userRepo.findByEmail(email);
        if (!user)
            throw new Error("User not found");
        const valid = await (0, hash_1.comparePassword)(password, user.password);
        if (!valid)
            throw new Error("Invalid credentials");
        return user;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(user_repository_1.UserRepository)),
    __param(1, (0, tsyringe_1.inject)(organization_repository_1.OrganizationRepository)),
    __param(2, (0, tsyringe_1.inject)(project_repository_1.ProjectRepository)),
    __metadata("design:paramtypes", [user_repository_1.UserRepository,
        organization_repository_1.OrganizationRepository,
        project_repository_1.ProjectRepository])
], AuthService);
