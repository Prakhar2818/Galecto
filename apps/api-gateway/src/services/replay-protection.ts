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
  ];

  private allowedEnvPatterns = [
    'localhost',
    '127.0.0.1',
    'staging.',
    '.internal',
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

  validateTargetUrl(url: string): { valid: boolean; error?: string } {
    if (!url) {
      return { valid: false, error: 'URL is required' };
    }

    try {
      const urlObj = new URL(url);
      
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
        return { valid: false, error: 'Target URL must be on allowed environments (localhost, staging, internal)' };
      }

      return { valid: true };
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