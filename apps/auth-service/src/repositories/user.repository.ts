import { prisma } from "../prisma/client";

export class UserRepository {
  async create(data: { email: string; password: string; organizationId: string }) {
    return prisma.user.create({ data });
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }
}