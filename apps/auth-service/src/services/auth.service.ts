import { injectable, inject } from "tsyringe";
import { UserRepository } from "../repositories/user.repository";
import { OrganizationRepository } from "../repositories/organization.repository";
import { hashPassword, comparePassword } from "../utils/hash";

@injectable()
export class AuthService {
  constructor(
    @inject(UserRepository)
    private userRepo: UserRepository,
    @inject(OrganizationRepository)
    private orgRepo: OrganizationRepository
  ) {}

  async register(email: string, password: string, organizationName: string) {
    const existing = await this.userRepo.findByEmail(email);
    if (existing) {
      throw new Error("User already exists");
    }

    // 1. Create the Organization first
    const org = await this.orgRepo.create(organizationName);

    // 2. Hash the password
    const hashed = await hashPassword(password);

    // 3. Create the User linked to the Org
    const user = await this.userRepo.create({
      email,
      password: hashed,
      organizationId: org.id,
    });

    return { user, org };
  }

  async login(email: string, password: string) {
    const user = await this.userRepo.findByEmail(email);
    if (!user) throw new Error("User not found");

    const valid = await comparePassword(password, user.password);
    if (!valid) throw new Error("Invalid credentials");

    return user;
  }
}