import { redis } from "../../../../packages/redis/src/client";
import { kafka } from "../../../../packages/kafka/src/client";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface HealthCheck {
  status: 'UP' | 'DOWN';
  latencyMs?: number;
  error?: string;
}

interface HealthStatus {
  status: 'OK' | 'DEGRADED' | 'UNHEALTHY';
  timestamp: string;
  version: string;
  checks: {
    redis: HealthCheck;
    kafka: HealthCheck;
    database: HealthCheck;
  };
}

export class HealthController {
  async getHealth(): Promise<HealthStatus> {
    const [redisCheck, kafkaCheck, dbCheck] = await Promise.all([
      this.checkRedis(),
      this.checkKafka(),
      this.checkDatabase()
    ]);

    const allUp = redisCheck.status === 'UP' && kafkaCheck.status === 'UP' && dbCheck.status === 'UP';
    const anyDown = redisCheck.status === 'DOWN' || kafkaCheck.status === 'DOWN' || dbCheck.status === 'DOWN';

    let overallStatus: 'OK' | 'DEGRADED' | 'UNHEALTHY' = 'OK';
    if (anyDown) {
      overallStatus = dbCheck.status === 'DOWN' ? 'UNHEALTHY' : 'DEGRADED';
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      checks: {
        redis: redisCheck,
        kafka: kafkaCheck,
        database: dbCheck
      }
    };
  }

  private async checkRedis(): Promise<HealthCheck> {
    const start = Date.now();
    try {
      await redis.ping();
      return {
        status: 'UP',
        latencyMs: Date.now() - start
      };
    } catch (error: any) {
      return {
        status: 'DOWN',
        latencyMs: Date.now() - start,
        error: error.message || 'Redis connection failed'
      };
    }
  }

  private async checkKafka(): Promise<HealthCheck> {
    const start = Date.now();
    try {
      const admin = kafka.admin();
      await admin.connect();
      await admin.disconnect();
      return {
        status: 'UP',
        latencyMs: Date.now() - start
      };
    } catch (error: any) {
      return {
        status: 'DOWN',
        latencyMs: Date.now() - start,
        error: error.message || 'Kafka connection failed'
      };
    }
  }

  private async checkDatabase(): Promise<HealthCheck> {
    const start = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      return {
        status: 'UP',
        latencyMs: Date.now() - start
      };
    } catch (error: any) {
      return {
        status: 'DOWN',
        latencyMs: Date.now() - start,
        error: error.message || 'Database connection failed'
      };
    }
  }
}

export const healthController = new HealthController();