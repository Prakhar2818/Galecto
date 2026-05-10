"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const client_2 = require("../../../packages/redis/src/client");
const uuid_1 = require("uuid");
const prisma = new client_1.PrismaClient();
async function seed() {
    console.log("Seeding database...");
    try {
        // 1. Create an Organization
        const org = await prisma.organization.create({
            data: {
                name: "Test Corp",
            },
        });
        console.log(`✅ Created Organization: ${org.name} (ID: ${org.id})`);
        // 2. Create an API Key for the Organization
        const apiKeyString = `test-api-key-${(0, uuid_1.v4)()}`;
        const apiKey = await prisma.apiKey.create({
            data: {
                key: apiKeyString,
                name: "Default Test Key",
                organizationId: org.id,
            },
        });
        console.log(`✅ Created API Key in Postgres: ${apiKey.key}`);
        // 3. Cache the API Key in Redis (API Gateway uses this to validate requests)
        await client_2.redis.set(`apikey:${apiKey.key}`, org.id);
        console.log(`✅ Synced API Key to Redis!`);
        console.log("\n🚀 SEED COMPLETE!");
        console.log("-------------------------------------------------");
        console.log(`Use this exact string for testing: Bearer ${apiKey.key}`);
        console.log("-------------------------------------------------");
    }
    catch (error) {
        console.error("Error seeding:", error);
    }
    finally {
        await prisma.$disconnect();
        client_2.redis.disconnect();
    }
}
seed();
