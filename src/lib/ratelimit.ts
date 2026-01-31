import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Lazy initialization to avoid build-time errors when env vars are not set
let redis: Redis | null = null
let subscribeRateLimiterInstance: Ratelimit | null = null
let webhookRateLimiterInstance: Ratelimit | null = null

// Check if Upstash is configured
export function isRateLimitingEnabled(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
}

function getRedis(): Redis | null {
  if (!isRateLimitingEnabled()) {
    return null
  }

  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  }
  return redis
}

// Rate limiter for subscribe endpoint: 10 requests per minute per IP
export function getSubscribeRateLimiter(): Ratelimit | null {
  const redisClient = getRedis()
  if (!redisClient) {
    return null
  }

  if (!subscribeRateLimiterInstance) {
    subscribeRateLimiterInstance = new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      prefix: 'ratelimit:subscribe',
    })
  }
  return subscribeRateLimiterInstance
}

// Rate limiter for webhook endpoint: 100 requests per minute per IP
export function getWebhookRateLimiter(): Ratelimit | null {
  const redisClient = getRedis()
  if (!redisClient) {
    return null
  }

  if (!webhookRateLimiterInstance) {
    webhookRateLimiterInstance = new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(100, '1 m'),
      prefix: 'ratelimit:webhook',
    })
  }
  return webhookRateLimiterInstance
}

// Helper to get IP from request
export function getClientIP(request: Request): string {
  // Check common headers for forwarded IP
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  // Fallback to a default (should not happen in production)
  return '127.0.0.1'
}
