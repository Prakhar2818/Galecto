import "reflect-metadata";
import { container } from "tsyringe";
import { UserRepository } from "../repositories/user.repository";
import { AuthService } from "../services/auth.service";

container.register(UserRepository, { useClass: UserRepository });
container.register(AuthService, { useClass: AuthService });

export { container };
