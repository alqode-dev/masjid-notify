# Technology Stack: Production Hardening

**Project:** Masjid Notify (WhatsApp Notification System)
**Researched:** 2026-01-31
**Focus:** Rate limiting, error monitoring, webhook security, token management

---

## Recommended Stack

### Rate Limiting

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @upstash/ratelimit | ^2.0.8 | API rate limiting | HTTP-based, designed for serverless/Vercel Edge, supports multiple algorithms |
| @upstash/redis | ^1.36.1 | Redis client for rate limiting | Connectionless HTTP client, pairs with ratelimit |

**Recommendation:** Use Upstash because it's the standard for Next.js + Vercel deployments. It's HTTP-based (no persistent connections), works in Edge runtime, has built-in caching to reduce Redis calls during spikes, and offers a generous free tier.

**Algorithm Choice:** Use **sliding window** for WhatsApp API routes. It provides smoother rate limiting than fixed window and prevents burst abuse at window boundaries.

```typescript
// Rate limiter configuration
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const rateLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"), // 10 requests per 10 seconds
  analytics: true, // Enable analytics in Upstash dashboard
  prefix: "masjid-notify", // Namespace for this app
});
```

### Error Monitoring

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @sentry/nextjs | ^10.34.0 | Error tracking & performance | Industry standard, Next.js 16 compatible, App Router support |

**Recommendation:** Sentry is the clear choice. Version 10.x has active Next.js 16 testing, supports App Router auto-instrumentation, and handles client/server/edge runtimes.

**Key Configuration Files:**
- `instrumentation-client.ts` - Client-side initialization
- `sentry.server.config.ts` - Server runtime
- `sentry.edge.config.ts` - Edge runtime
- `app/global-error.tsx` - React error boundary

```typescript
// sentry.server.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0, // Capture 100% of transactions for performance monitoring
  environment: process.env.NODE_ENV,
  enableLogs: true, // Enable structured logging
});
```

### WhatsApp Webhook Security

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Node.js crypto (built-in) | N/A | HMAC-SHA256 signature verification | Native, no dependencies, standard approach |

**Recommendation:** Use Node.js built-in `crypto` module. Meta's X-Hub-Signature-256 verification is straightforward HMAC-SHA256 and doesn't require external libraries.

**Critical Implementation Details:**

1. **Raw body access is mandatory** - JSON parsing middleware breaks signature verification
2. **Use timing-safe comparison** - Prevents timing attacks
3. **Respond within 30 seconds** - Meta's webhook requirement

```typescript
// lib/whatsapp/verify-signature.ts
import crypto from "crypto";

export function verifyWhatsAppSignature(
  rawBody: Buffer | string,
  signatureHeader: string,
  appSecret: string
): boolean {
  const expectedSignature =
    "sha256=" +
    crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signatureHeader),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false; // Length mismatch
  }
}
```

```typescript
// app/api/webhooks/whatsapp/route.ts
import { verifyWhatsAppSignature } from "@/lib/whatsapp/verify-signature";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!signature || !verifyWhatsAppSignature(rawBody, signature, process.env.WHATSAPP_APP_SECRET!)) {
    return new Response("Invalid signature", { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  // Process verified webhook...

  return new Response("OK", { status: 200 });
}
```

### Environment & Secrets Management

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vercel Environment Variables | N/A | Secret storage | Encrypted by default, environment separation, CLI sync |
| Sensitive Environment Variables | N/A | Extra protection for secrets | Prevents decryption in dashboard |

**Recommendation:** Use Vercel's built-in environment variable management. All variables are encrypted by default since Vercel sunset legacy secrets. For production secrets (WhatsApp tokens, Supabase service keys), mark as "Sensitive" to prevent dashboard viewing.

**Environment Variable Strategy:**

```
# Server-only (no NEXT_PUBLIC_ prefix)
WHATSAPP_ACCESS_TOKEN=       # WhatsApp Cloud API token
WHATSAPP_APP_SECRET=         # For webhook signature verification
WHATSAPP_PHONE_NUMBER_ID=    # Business phone number ID
SENTRY_DSN=                  # Sentry error tracking
UPSTASH_REDIS_REST_URL=      # Rate limiting
UPSTASH_REDIS_REST_TOKEN=    # Rate limiting auth
SUPABASE_SERVICE_ROLE_KEY=   # Admin operations only

# Can be public (if needed client-side)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

## Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | ^4.3.6 (already installed) | Input validation | Validate all webhook payloads, API inputs |
| @edge-csrf/nextjs | ^2.0.0 | CSRF protection | For custom route handlers that accept mutations |

**Zod Usage:** Already in your stack. Use it to validate WhatsApp webhook payloads after signature verification.

```typescript
import { z } from "zod";

const WhatsAppMessageSchema = z.object({
  entry: z.array(z.object({
    changes: z.array(z.object({
      value: z.object({
        messages: z.array(z.object({
          from: z.string(),
          text: z.object({ body: z.string() }).optional(),
        })).optional(),
      }),
    })),
  })),
});
```

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Rate Limiting | @upstash/ratelimit | express-rate-limit | Express-rate-limit uses in-memory storage, doesn't work with serverless/Edge |
| Rate Limiting | @upstash/ratelimit | Vercel WAF | WAF is good for network-level blocking, but Upstash gives finer control per-route |
| Error Monitoring | @sentry/nextjs | LogRocket | LogRocket focuses on session replay, Sentry is better for error aggregation |
| Error Monitoring | @sentry/nextjs | Vercel Analytics | Vercel Analytics is performance-focused, not error tracking |
| Webhook Security | crypto (built-in) | @kapso/whatsapp-cloud-api | Extra dependency for trivial functionality |

---

## Installation

```bash
# Production hardening dependencies
npm install @upstash/ratelimit @upstash/redis @sentry/nextjs

# Optional: CSRF protection if using custom route handlers
npm install @edge-csrf/nextjs
```

### Sentry Setup

```bash
# Use the Sentry wizard for proper configuration
npx @sentry/wizard@latest -i nextjs
```

This will:
1. Create configuration files (sentry.*.config.ts)
2. Set up source maps
3. Add error boundary
4. Configure next.config.js

---

## Architecture Integration

### Middleware Rate Limiting (Edge)

```typescript
// middleware.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 requests/minute
  analytics: true,
});

export async function middleware(request: NextRequest) {
  // Only rate limit API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const ip = request.ip ?? request.headers.get("x-forwarded-for") ?? "anonymous";
    const { success, limit, remaining, reset } = await ratelimit.limit(ip);

    if (!success) {
      return new NextResponse("Rate limit exceeded", {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
        },
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
```

### Per-Route Rate Limits

For WhatsApp API routes, apply stricter limits to prevent abuse:

```typescript
// Different limiters for different endpoints
export const apiLimiters = {
  // Public endpoints - strict
  webhook: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(60, "1 m"), // 60/min for incoming webhooks
  }),

  // Admin endpoints - moderate
  admin: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(30, "1 m"), // 30/min for admin actions
  }),

  // Message sending - careful (WhatsApp has its own limits)
  sendMessage: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.tokenBucket(10, "1 m", 50), // Token bucket: 10/min refill, 50 burst
  }),
};
```

---

## Vercel Configuration

### vercel.json (update existing)

```json
{
  "env": {
    "SENTRY_DSN": "@sentry_dsn",
    "UPSTASH_REDIS_REST_URL": "@upstash_redis_rest_url",
    "UPSTASH_REDIS_REST_TOKEN": "@upstash_redis_rest_token"
  }
}
```

### Recommended Vercel Dashboard Settings

1. **Environment Variables:**
   - Mark `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_APP_SECRET` as **Sensitive**
   - Mark `SUPABASE_SERVICE_ROLE_KEY` as **Sensitive**
   - Separate variables by environment (Production/Preview/Development)

2. **Vercel WAF (Optional Additional Layer):**
   - Enable rate limiting rules as backup to application-level limiting
   - Block known malicious IPs
   - Geographic restrictions if relevant

---

## Required External Services

| Service | Purpose | Setup Required |
|---------|---------|----------------|
| Upstash | Redis for rate limiting | Create account, create database, get REST URL/token |
| Sentry | Error monitoring | Create account, create project, get DSN |
| Meta Developer Console | WhatsApp API | Already configured (existing app) |

### Upstash Setup Steps

1. Create account at upstash.com
2. Create a new Redis database (free tier: 10K commands/day)
3. Select region closest to Vercel deployment (e.g., US-East-1)
4. Copy REST URL and REST Token
5. Add to Vercel environment variables

### Sentry Setup Steps

1. Create account at sentry.io
2. Create new project (select Next.js)
3. Run wizard: `npx @sentry/wizard@latest -i nextjs`
4. Add SENTRY_DSN to Vercel environment variables

---

## Confidence Assessment

| Component | Confidence | Notes |
|-----------|------------|-------|
| @upstash/ratelimit | HIGH | Official docs, npm registry, widely adopted for Next.js |
| @sentry/nextjs | HIGH | Official Sentry docs confirm Next.js 16 compatibility, active testing |
| WhatsApp signature verification | HIGH | Meta official documentation, standard HMAC-SHA256 |
| Vercel secrets management | HIGH | Vercel official docs, encrypted by default |
| Version numbers | MEDIUM | Verified via npm registry, but check for updates at implementation |

---

## Sources

### Rate Limiting
- [Upstash Ratelimit Documentation](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview)
- [Rate Limiting Next.js with Upstash](https://upstash.com/blog/nextjs-ratelimiting)
- [@upstash/ratelimit npm](https://www.npmjs.com/package/@upstash/ratelimit)
- [Vercel Edge Middleware Rate Limiting](https://upstash.com/blog/edge-rate-limiting)
- [Vercel Rate Limiting Guide](https://vercel.com/guides/rate-limiting-edge-middleware-vercel-kv)

### Error Monitoring
- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [@sentry/nextjs npm](https://www.npmjs.com/package/@sentry/nextjs)
- [Sentry JavaScript Releases](https://github.com/getsentry/sentry-javascript/releases)

### WhatsApp Security
- [WhatsApp Webhook Testing Guide](https://softwareengineeringstandard.com/2025/08/31/whatsapp-webhook/)
- [Meta Community Forums - Webhook Verification](https://communityforums.atmeta.com/discussions/dev-general/how-to-verify-a-webhook-request-sign/1171086)
- [Webhook Signature Verification Best Practices](https://hookdeck.com/webhooks/guides/how-to-implement-sha256-webhook-signature-verification)

### Secrets Management
- [Vercel Sensitive Environment Variables](https://vercel.com/docs/environment-variables/sensitive-environment-variables)
- [Next.js Environment Variables Guide](https://nextjs.org/docs/pages/guides/environment-variables)
- [HashiCorp Vault Vercel Integration](https://developer.hashicorp.com/vault/docs/sync/vercelproject)

### Security Best Practices
- [Complete Next.js Security Guide 2025](https://www.turbostarter.dev/blog/complete-nextjs-security-guide-2025-authentication-api-protection-and-best-practices)
- [Next.js Data Security](https://nextjs.org/docs/app/guides/data-security)
- [CSRF Protection in Next.js](https://medium.com/@mmalishshrestha/implementing-csrf-protection-in-next-js-applications-9a29d137a12d)
