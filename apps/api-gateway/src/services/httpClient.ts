import { request } from "undici";

function buildForwardHeaders(headers: Record<string, any> = {}, hasBody: boolean = false) {
  const blockedHeaders = new Set([
    "connection",
    "content-length",
    "expect",
    "host",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
  ]);

  const forwardedHeaders: Record<string, string> = {};

  // Only set Content-Type when there's actually a body
  if (hasBody) {
    forwardedHeaders["content-type"] = "application/json";
  }

  for (const [name, value] of Object.entries(headers)) {
    const key = name.toLowerCase();

    if (blockedHeaders.has(key)) {
      continue;
    }

    if (typeof value === "string") {
      forwardedHeaders[key] = value;
    }
  }

  return forwardedHeaders;
}

export async function httpRequest(
  url: string,
  method: string,
  body?: any,
  headers?: any
) {
  const hasBody = !!body;
  const res = await request(url, {
    method,
    body: hasBody ? JSON.stringify(body) : undefined,
    headers: buildForwardHeaders(headers, hasBody),
  });

  const data = await res.body.json();

  return data;
}
