import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Lazy initialization to avoid build-time errors when env vars are not set
let redis: Redis | null = null
let subscribeRateLimiterInstance: Ratelimit | null = null

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

// Helper to get IP from request
export function getClientIP(request: Request): string {
  const vercelForwarded = request.headers.get('x-vercel-forwarded-for')
  if (vercelForwarded) {
    return vercelForwarded.split(',')[0].trim()
  }

  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const ips = forwarded.split(',').map(ip => ip.trim())
    for (let i = ips.length - 1; i >= 0; i--) {
      if (ips[i] && ips[i] !== '127.0.0.1' && ips[i] !== '::1') {
        return ips[i]
      }
    }
    return ips[0]
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  return '127.0.0.1'
}
