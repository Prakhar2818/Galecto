import { injectable } from "tsyringe";
import { prisma } from "../prisma/client";

@injectable()
export class OrganizationRepository {
  async create(name: string) {
    return prisma.organization.create({
      data: {
        name,
      },
    });
  }

  async findById(id: string) {
    return prisma.organization.findUnique({
      where: { id },
    });
  }
}
