import "reflect-metadata";
import { container } from "tsyringe";
import { UserRepository } from "../repositories/user.repository";
import { OrganizationRepository } from "../repositories/organization.repository";
import { ProjectRepository } from "../repositories/project.repository";
import { AuthService } from "../services/auth.service";

// Register Repositories
container.register(UserRepository, { useClass: UserRepository });
container.register(OrganizationRepository, {
  useClass: OrganizationRepository,
});
container.register(ProjectRepository, { useClass: ProjectRepository });

// Register Services
container.register(AuthService, { useClass: AuthService });

export { container };
