import { createClient } from '@clickhouse/client';

export const clickhouse = createClient({
  url: process.env.CLICKHOUSE_HOST || 'http://localhost:8123',
  username: process.env.CLICKHOUSE_USER || 'default',
  password: process.env.CLICKHOUSE_PASSWORD || '',
  database: process.env.CLICKHOUSE_DATABASE || 'default',
});

export async function initializeClickHouseSchemas() {
  const database = process.env.CLICKHOUSE_DATABASE || 'galecto';

  // Connect to the default database so we can create the target database
  const adminClient = createClient({
    url: process.env.CLICKHOUSE_HOST || 'http://localhost:8123',
    username: process.env.CLICKHOUSE_USER || 'default',
    password: process.env.CLICKHOUSE_PASSWORD || '',
    database: 'default',
  });

  await adminClient.exec({
    query: `CREATE DATABASE IF NOT EXISTS ${database}`
  });

  await adminClient.close();

  // Create the table using the fully qualified name so it always lands in the correct database
  await clickhouse.exec({
    query: `
      CREATE TABLE IF NOT EXISTS ${database}.events (
        tenant_id String,
        trace_id String,
        span_id String,
        parent_span_id String,
        event_name String,
        service_name String,
        timestamp DateTime64(3),
        payload String,
        duration_ms UInt32,
        status_code UInt16,
        session_id String
      ) ENGINE = MergeTree()
      ORDER BY (tenant_id, timestamp, trace_id, span_id)
    `
  });

  // Migrate existing tables: add session_id if not present
  try {
    await clickhouse.exec({
      query: `ALTER TABLE ${database}.events ADD COLUMN IF NOT EXISTS session_id String`
    });
  } catch (e) {
    // Column may already exist; ignore
  }
}
