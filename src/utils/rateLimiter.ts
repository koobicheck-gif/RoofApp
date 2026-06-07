// Rate limiter utility for external API calls

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitState {
  requests: number[];
}

const rateLimitStates: Map<string, RateLimitState> = new Map();

const defaultConfigs: Record<string, RateLimitConfig> = {
  nominatim: { maxRequests: 1, windowMs: 1000 }, // 1 request per second (Nominatim policy)
  ghl: { maxRequests: 10, windowMs: 1000 }, // 10 requests per second
  weather: { maxRequests: 5, windowMs: 1000 }, // 5 requests per second
};

export async function rateLimitedFetch(
  key: string,
  url: string,
  options?: RequestInit
): Promise<Response> {
  const config = defaultConfigs[key] || { maxRequests: 10, windowMs: 1000 };

  await waitForRateLimit(key, config);

  return fetch(url, options);
}

async function waitForRateLimit(key: string, config: RateLimitConfig): Promise<void> {
  const now = Date.now();
  let state = rateLimitStates.get(key);

  if (!state) {
    state = { requests: [] };
    rateLimitStates.set(key, state);
  }

  // Remove old requests outside the window
  state.requests = state.requests.filter(time => now - time < config.windowMs);

  // If at limit, wait until oldest request expires
  if (state.requests.length >= config.maxRequests) {
    const oldestRequest = state.requests[0];
    const waitTime = config.windowMs - (now - oldestRequest) + 10; // +10ms buffer

    if (waitTime > 0) {
      await new Promise(resolve => setTimeout(resolve, waitTime));
      // Recursively check again after waiting
      return waitForRateLimit(key, config);
    }
  }

  // Record this request
  state.requests.push(Date.now());
}

// Exponential backoff for retries
export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // Retry on rate limit (429) or server errors (5xx)
      if (response.status === 429 || response.status >= 500) {
        if (attempt < maxRetries) {
          const delay = baseDelayMs * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Fetch failed after retries');
}
