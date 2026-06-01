# Phase 1: Infrastructure Setup (Day 1 Morning)

## Objective
Set up all required infrastructure services using Docker Compose.

## Files to Create

### `infra/docker-compose.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: galecto_secret_2024
      POSTGRES_DB: galecto
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - galecto-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - galecto-network

  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    ports:
      - "2181:2181"
    networks:
      - galecto-network

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    depends_on:
      - zookeeper
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: "true"
    ports:
      - "9092:9092"
    healthcheck:
      test: ["CMD", "kafka-broker-api-versions", "--bootstrap-server", "localhost:9092"]
      interval: 30s
      timeout: 10s
      retries: 5
    networks:
      - galecto-network

  clickhouse:
    image: clickhouse/clickhouse-server:23.8-alpine
    ports:
      - "8123:8123"
      - "9000:9000"
    environment:
      CLICKHOUSE_DB: galecto
    volumes:
      - clickhouse_data:/var/lib/clickhouse
      - ./clickhouse-init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "localhost:8123/ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - galecto-network

volumes:
  postgres_data:
  clickhouse_data:

networks:
  galecto-network:
    driver: bridge
```

### `infra/clickhouse-init.sql`

```sql
CREATE DATABASE IF NOT EXISTS galecto;

CREATE TABLE IF NOT EXISTS galecto.events (
    tenant_id String,
    trace_id String,
    span_id String,
    parent_span_id String,
    event_name String,
    service_name String,
    timestamp DateTime64(3),
    payload String,
    duration_ms UInt32,
    status_code UInt16
) ENGINE = MergeTree()
ORDER BY (tenant_id, timestamp, trace_id, span_id);
```

## Commands to Execute

```bash
# Start all infrastructure services
cd Track 1/infra
docker-compose up -d

# Verify services are healthy
# Wait 30-60 seconds for all services to initialize

# Check PostgreSQL
docker-compose exec postgres pg_isready -U postgres

# Check Redis
docker-compose exec redis redis-cli ping

# Check Kafka
docker-compose exec kafka kafka-broker-api-versions --bootstrap-server localhost:9092

# Check ClickHouse
curl http://localhost:8123/ping
```

## Verification Checklist

- [ ] Docker Compose file created
- [ ] `docker-compose up -d` executes successfully
- [ ] PostgreSQL responds to `pg_isready`
- [ ] Redis responds to `ping`
- [ ] Kafka broker is accessible
- [ ] ClickHouse responds to ping
- [ ] `galecto` database exists in ClickHouse
- [ ] `events` table exists in ClickHouse

## Next Steps
Proceed to [02-backend-service-fixes.md](./02-backend-service-fixes.md)
