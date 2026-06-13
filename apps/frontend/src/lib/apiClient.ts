const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3001';
const QUERY_SERVICE_URL = process.env.NEXT_PUBLIC_QUERY_SERVICE_URL || 'http://localhost:4002';
const ALERT_SERVICE_URL = process.env.NEXT_PUBLIC_ALERT_SERVICE_URL || 'http://localhost:5003';

const DEFAULT_TIMEOUT = 10000;
const MAX_RETRIES = 3;
const CACHE_TTL_MS = 30000; // 30 seconds

interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  useCache?: boolean;
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Simple in-memory cache with TTL
const requestCache = new Map<string, { data: any; timestamp: number }>();
const pendingRequests = new Map<string, Promise<any>>();

function getCacheKey(url: string, options: FetchOptions): string {
  return `${url}:${options.method || 'GET'}:${options.body || ''}`;
}

function getCachedResponse(key: string): any | null {
  const cached = requestCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }
  if (cached) {
    requestCache.delete(key);
  }
  return null;
}

function setCachedResponse(key: string, data: any): void {
  requestCache.set(key, { data, timestamp: Date.now() });
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries: number
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options, DEFAULT_TIMEOUT);

      if (response.ok) {
        return response;
      }

      if (response.status === 401) {
        localStorage.removeItem('ag_token');
        localStorage.removeItem('ag_user');
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        throw new ApiError('Unauthorized', 401, 'AUTH_EXPIRED');
      }

      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.error?.message || `Request failed with status ${response.status}`,
        response.status,
        errorData.error?.code
      );
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      lastError = error as Error;

      if (attempt < retries) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Request failed after retries');
}

async function makeRequest(
  baseUrl: string,
  endpoint: string,
  options: FetchOptions = {}
): Promise<any> {
  const token = localStorage.getItem('ag_token');

  const headers: Record<string, string> = {
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  // Only set Content-Type for requests that have a body
  if (options.body) {
    headers['Content-Type'] = 'application/json';
  }

  const { timeout, retries, useCache, ...fetchOptions } = options;
  const effectiveRetries = retries ?? MAX_RETRIES;
  const url = `${baseUrl}${endpoint}`;
  const cacheKey = getCacheKey(url, options);

  // Check cache for GET requests
  if (useCache !== false && (!options.method || options.method === 'GET')) {
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      return cached;
    }
  }

  // Deduplicate in-flight requests
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey)!;
  }

  const requestPromise = (async () => {
    try {
      const response = await fetchWithRetry(
        url,
        {
          ...fetchOptions,
          headers,
        },
        effectiveRetries
      );

      const data = await response.json();
      
      // Cache successful GET responses
      if (useCache !== false && (!options.method || options.method === 'GET')) {
        setCachedResponse(cacheKey, data);
      }
      
      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408, 'TIMEOUT');
      }

      throw new ApiError(
        error instanceof Error ? error.message : 'Network error',
        0,
        'NETWORK_ERROR'
      );
    } finally {
      pendingRequests.delete(cacheKey);
    }
  })();

  pendingRequests.set(cacheKey, requestPromise);
  return requestPromise;
}

export async function apiFetch(
  endpoint: string,
  options: FetchOptions = {}
): Promise<any> {
  return makeRequest(API_GATEWAY_URL, endpoint, options);
}

export async function queryFetch(
  endpoint: string,
  options: FetchOptions = {}
): Promise<any> {
  return makeRequest(QUERY_SERVICE_URL, endpoint, options);
}

export async function alertFetch(
  endpoint: string,
  options: FetchOptions = {}
): Promise<any> {
  return makeRequest(ALERT_SERVICE_URL, endpoint, options);
}

export { ApiError };