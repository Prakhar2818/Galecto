import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const endpoint = process.env.MINIO_ENDPOINT || "http://localhost:9000";
const accessKey = process.env.MINIO_ACCESS_KEY || "minioadmin";
const secretKey = process.env.MINIO_SECRET_KEY || "minioadmin";
const bucket = process.env.MINIO_BUCKET || "galecto-session-replays";

const s3Client = new S3Client({
  endpoint,
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretKey,
  },
  region: "us-east-1",
  forcePathStyle: true,
});

export async function uploadSessionReplay(
  tenantId: string,
  sessionId: string,
  buffer: Buffer
): Promise<string> {
  const key = `${tenantId}/${sessionId}.json.gz`;
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: "application/gzip",
    })
  );
  return key;
}

export async function getSessionReplay(
  tenantId: string,
  sessionId: string
): Promise<Buffer> {
  const key = `${tenantId}/${sessionId}.json.gz`;
  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
  const chunks: Buffer[] = [];
  for await (const chunk of response.Body as any) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function deleteSessionReplay(
  tenantId: string,
  sessionId: string
): Promise<void> {
  const key = `${tenantId}/${sessionId}.json.gz`;
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
}
