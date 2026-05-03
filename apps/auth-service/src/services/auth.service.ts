import { injectable, inject } from "tsyringe";
import { UserRepository } from "../repositories/user.repository";
import { hashPassword, comparePassword } from "../utils/hash";

@injectable()
export class AuthService {
  constructor(
    @inject(UserRepository)
    private userRepo: UserRepository
  ) {}

  async register(email: string, password: string, organizationId: string) {
    const existing = await this.userRepo.findByEmail(email);
    if (existing) {
      throw new Error("User already exists");
    }

    const hashed = await hashPassword(password);

    return this.userRepo.create({
      email,
      password: hashed,
      organizationId,
    });
  }

  async login(email: string, password: string) {
    const user = await this.userRepo.findByEmail(email);
    if (!user) throw new Error("User not found");

    const valid = await comparePassword(password, user.password);
    if (!valid) throw new Error("Invalid credentials");

    return user;
  }
}