import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Updating all users to OWNER role for local development...");

  const result = await prisma.user.updateMany({
    data: {
      role: Role.OWNER,
    },
  });

  console.log(`✅ Successfully updated ${result.count} users to OWNER.`);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
