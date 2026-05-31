import { prisma } from "../prisma/client";
import { injectable } from "tsyringe";
import { Role } from "@prisma/client";

@injectable()
export class UserRepository {
  async create(data: { email: string; password: string; organizationId: string; role?: Role }) {
    return prisma.user.create({ data });
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }
}