export class ReplayProtectionService {

  private piiPatterns = [
    { pattern: /(\b\d{3}[-.]?\d{3}[-.]?\d{4}\b)/g, replacement: '***-***-****' }, // Phone
    { pattern: /(\b\d{16}\b)/g, replacement: '****-****-****-****' }, // Credit card
    { pattern: /("password"\s*:\s*")[^"]*(")/gi, replacement: '$1******$2' }, // Password field
    { pattern: /("secret"\s*:\s*")[^"]*(")/gi, replacement: '$1******$2' }, // Secret field
    { pattern: /("token"\s*:\s*")[^"]*(")/gi, replacement: '$1******$2' }, // Token field
    { pattern: /("api_key"\s*:\s*")[^"]*(")/gi, replacement: '$1******$2' }, // API key field
    { pattern: /("authorization"\s*:\s*")[^"]*(")/gi, replacement: '$1Bearer ***$2' }, // Auth header
    { pattern: /(\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b)/g, replacement: '***@***.***' }, // Email
  ];

  private allowedHeaders = [
    'content-type',
    'accept',
    'user-agent',
    'x-request-id',
    'x-trace-id',
    'x-correlation-id',
    'accept-language',
    'host',
    'authorization',
  ];

  private allowedEnvPatterns = [
    'localhost',
    '127.0.0.1',
    'staging.',
    '.internal',
    'service',      // matches auth-service, api-service, log-service, etc.
    'gateway',      // matches api-gateway, etc.
    'app',          // matches app-service, etc.
    'backend',      // matches backend, etc.
  ];

  maskPii(payload: any): any {
    if (!payload) return payload;

    const str = typeof payload === 'string' ? payload : JSON.stringify(payload);

    let masked = str;
    for (const { pattern, replacement } of this.piiPatterns) {
      masked = masked.replace(pattern, replacement);
    }

    try {
      return JSON.parse(masked);
    } catch {
      return masked;
    }
  }

  filterHeaders(headers: any): any {
    const filtered: any = {};
    
    for (const [key, value] of Object.entries(headers || {})) {
      const lowerKey = key.toLowerCase();
      if (this.allowedHeaders.includes(lowerKey)) {
        filtered[key] = value;
      }
    }

    return filtered;
  }

  validateTargetUrl(url: string): { valid: boolean; error?: string; normalizedUrl?: string } {
    if (!url) {
      return { valid: false, error: 'URL is required' };
    }

    let urlToValidate = url;
    // Handle relative paths: /api/v1/users -> http://localhost:3001/api/v1/users
    if (urlToValidate.startsWith('/')) {
      urlToValidate = 'http://localhost:' + (process.env.PORT || 3001) + urlToValidate;
    }
    // Prepend protocol if missing so partial URLs like localhost:3000/api work
    else if (!urlToValidate.startsWith('http://') && !urlToValidate.startsWith('https://')) {
      urlToValidate = 'http://' + urlToValidate;
    }

    try {
      const urlObj = new URL(urlToValidate);
      
      // Only allow http/https
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return { valid: false, error: 'Only HTTP/HTTPS URLs allowed' };
      }

      // Check allowed patterns
      const hostname = urlObj.hostname;
      const isAllowed = this.allowedEnvPatterns.some(pattern => 
        hostname.includes(pattern) || hostname === 'localhost'
      );

      if (!isAllowed) {
        console.log(`[Replay] Rejected URL: original="${url}" normalized="${urlToValidate}" hostname="${hostname}"`);
        return { valid: false, error: `Target URL hostname "${hostname}" is not allowed. Allowed: localhost, 127.0.0.1, staging.*, *.internal, *service*, *gateway*, *app*, *backend*, or relative paths` };
      }

      return { valid: true, normalizedUrl: urlToValidate };
    } catch {
      return { valid: false, error: 'Invalid URL format' };
    }
  }

  redactSensitiveFields(body: any, fieldsToRedact: string[] = ['password', 'secret', 'token', 'apiKey', 'authorization']): any {
    if (!body || typeof body !== 'object') return body;

    const redacted = { ...body };
    
    for (const field of fieldsToRedact) {
      if (redacted[field]) {
        redacted[field] = '***REDACTED***';
      }
    }

    return redacted;
  }
}

export const replayProtection = new ReplayProtectionService();