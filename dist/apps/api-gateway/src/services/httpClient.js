"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpRequest = httpRequest;
const undici_1 = require("undici");
function buildForwardHeaders(headers = {}) {
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
    const forwardedHeaders = {
        "content-type": "application/json",
    };
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
async function httpRequest(url, method, body, headers) {
    const res = await (0, undici_1.request)(url, {
        method,
        body: body ? JSON.stringify(body) : undefined,
        headers: buildForwardHeaders(headers),
    });
    const data = await res.body.json();
    return data;
}
