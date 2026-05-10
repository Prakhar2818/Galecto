import { createClient } from '@clickhouse/client';

export const clickhouse = createClient({
  url: process.env.CLICKHOUSE_HOST || 'http://localhost:8123',
  username: process.env.CLICKHOUSE_USER || 'default',
  password: process.env.CLICKHOUSE_PASSWORD || '',
  database: process.env.CLICKHOUSE_DATABASE || 'default',
});

export async function initializeClickHouseSchemas() {
  await clickhouse.exec({
    query: `
      CREATE TABLE IF NOT EXISTS events (
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
      ORDER BY (tenant_id, timestamp, trace_id, span_id)
    `
  });
}
