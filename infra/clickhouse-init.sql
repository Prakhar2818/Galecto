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
