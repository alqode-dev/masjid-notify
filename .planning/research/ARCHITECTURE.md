# Architecture Patterns: Production Hardening for WhatsApp Notification System

**Domain:** Next.js WhatsApp notification system production hardening
**Researched:** 2026-01-31
**Overall Confidence:** HIGH (verified with official documentation and current best practices)

---

## Executive Summary

This document provides architecture patterns for hardening the Masjid Notify WhatsApp notification system for production. The current implementation sends messages synchronously in loops, lacks rate limiting on public endpoints, does not verify WhatsApp webhook signatures, and has no authentication middleware for admin APIs. These gaps must be addressed before scaling to 500+ subscribers.

The recommended architecture introduces four layers of protection:
1. **Edge rate limiting** via Upstash Ratelimit in Next.js middleware
2. **Webhook signature verification** using HMAC-SHA256 with Meta's App Secret
3. **Authentication middleware** protecting admin API routes
4. **Message queue architecture** using Upstash QStash for batch processing

---

## Current Architecture Analysis

### Current State (Based on Codebase Review)

```
┌─────────────────────────────────────────────────────────────────┐
│                     CURRENT ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Public Internet                                                │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│  │ /subscribe  │    │ /webhook    │    │ /admin/*    │        │
│  │ (No rate    │    │ (No sig     │    │ (No auth    │        │
│  │  limit)     │    │  verify)    │    │  middleware)│        │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘        │
│         │                  │                   │                │
│         ▼                  ▼                   ▼                │
│  ┌─────────────────────────────────────────────────────┐      │
│  │              Supabase (Direct Access)                │      │
│  └─────────────────────────────────────────────────────┘      │
│         │                                                      │
│         ▼                                                      │
│  ┌─────────────────────────────────────────────────────┐      │
│  │     WhatsApp API (Sequential, blocking loops)        │      │
│  │     - 80 msg/sec limit (default)                     │      │
│  │     - No batching                                    │      │
│  │     - Timeout risk at 500+ subscribers               │      │
│  └─────────────────────────────────────────────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Identified Gaps

| Gap | Current State | Risk | Priority |
|-----|---------------|------|----------|
| No rate limiting | Public APIs unprotected | DDoS, abuse, cost | HIGH |
| No webhook signature | Accepts any POST to /webhook | Spoofing, data injection | CRITICAL |
| No admin auth middleware | Frontend-only auth check | API bypass, data exposure | HIGH |
| Sequential message sending | Loops with await | Timeout at 500+ subscribers | HIGH |
| No retry mechanism | Failures are logged only | Message loss | MEDIUM |

---

## Recommended Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     PRODUCTION ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Public Internet                                                         │
│       │                                                                  │
│       ▼                                                                  │
│  ┌──────────────────────────────────────────────────────────┐           │
│  │            Next.js Edge Middleware (middleware.ts)        │           │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │           │
│  │  │ Rate Limit  │  │ Auth Check  │  │ Route Matching  │   │           │
│  │  │ (Upstash)   │  │ (Supabase)  │  │                 │   │           │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │           │
│  └──────────────────────────────────────────────────────────┘           │
│       │                                                                  │
│       ▼                                                                  │
│  ┌──────────────────────────────────────────────────────────┐           │
│  │                     API Routes                            │           │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │           │
│  │  │ /subscribe   │  │ /webhook     │  │ /admin/*     │    │           │
│  │  │ Rate: 5/min  │  │ Sig verify   │  │ Auth required│    │           │
│  │  │ per IP       │  │ HMAC-SHA256  │  │              │    │           │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │           │
│  └─────────┼─────────────────┼─────────────────┼────────────┘           │
│            │                 │                 │                         │
│            ▼                 ▼                 ▼                         │
│  ┌──────────────────────────────────────────────────────────┐           │
│  │                 Upstash QStash (Message Queue)            │           │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │           │
│  │  │ Batch API   │  │ Retry Logic │  │ Rate Limiting   │   │           │
│  │  │ /v2/batch   │  │ Auto 3x     │  │ Custom/endpoint │   │           │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │           │
│  └──────────────────────────────────────────────────────────┘           │
│            │                                                             │
│            ▼                                                             │
│  ┌──────────────────────────────────────────────────────────┐           │
│  │              Message Processing Worker                    │           │
│  │              /api/worker/send-message                     │           │
│  │              (Receives from QStash, sends to WhatsApp)    │           │
│  └──────────────────────────────────────────────────────────┘           │
│            │                                                             │
│            ▼                                                             │
│  ┌──────────────────────────────────────────────────────────┐           │
│  │              WhatsApp Cloud API                           │           │
│  │              80 msg/sec default → 1000 msg/sec upgraded   │           │
│  └──────────────────────────────────────────────────────────┘           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Component 1: Rate Limiting Architecture

### Middleware Placement

Rate limiting must occur at the **edge middleware layer** before requests reach API routes. This is the recommended approach for Vercel deployments.

**Confidence:** HIGH (Verified with [Upstash documentation](https://upstash.com/blog/edge-rate-limiting) and [Vercel best practices](https://vercel.com/docs/functions/configuring-functions/duration))

### Implementation Pattern

```typescript
// middleware.ts (project root)
import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize rate limiter (cached between requests)
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '60 s'), // 10 requests per minute
  analytics: true,
  prefix: 'masjid-notify',
});

// Stricter limit for subscription endpoint
const subscribeRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '60 s'), // 5 subscriptions per minute
  prefix: 'masjid-notify-subscribe',
});

export async function middleware(request: NextRequest) {
  const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? '127.0.0.1';
  const path = request.nextUrl.pathname;

  // Apply rate limiting to public API routes
  if (path.startsWith('/api/subscribe')) {
    const { success, limit, remaining, reset } = await subscribeRatelimit.limit(ip);

    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
            'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
          }
        }
      );
    }
  }

  // General API rate limiting
  if (path.startsWith('/api/') && !path.startsWith('/api/cron/') && !path.startsWith('/api/webhook/')) {
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/subscribe/:path*',
    '/api/admin/:path*',
  ],
};
```

### Rate Limit Configuration by Endpoint

| Endpoint | Limit | Window | Rationale |
|----------|-------|--------|-----------|
| `/api/subscribe` | 5 requests | 60 seconds | Prevent subscription spam |
| `/api/admin/*` | 30 requests | 60 seconds | Allow admin work, prevent abuse |
| `/api/webhook/whatsapp` | No limit | - | Meta controls throughput |
| `/api/cron/*` | No limit | - | Protected by CRON_SECRET |

### Required Environment Variables

```env
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

### Dependencies

```bash
npm install @upstash/ratelimit @upstash/redis
```

---

## Component 2: Webhook Signature Verification

### Security Flow

Meta signs all webhook payloads using HMAC-SHA256 with your App Secret. The signature is sent in the `X-Hub-Signature-256` header.

**Confidence:** HIGH (Verified with [Meta Developer Documentation](https://communityforums.atmeta.com/discussions/dev-general/how-to-verify-a-webhook-request-sign/1171086))

### Verification Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 WEBHOOK VERIFICATION FLOW                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Meta WhatsApp Server                                        │
│       │                                                      │
│       │ POST /api/webhook/whatsapp                           │
│       │ Headers:                                             │
│       │   X-Hub-Signature-256: sha256=abc123...              │
│       │ Body: { entry: [...] }                               │
│       │                                                      │
│       ▼                                                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            Signature Verification Layer               │   │
│  │                                                       │   │
│  │  1. Extract X-Hub-Signature-256 header               │   │
│  │  2. Get raw request body (before JSON parsing)       │   │
│  │  3. Compute HMAC-SHA256(rawBody, APP_SECRET)         │   │
│  │  4. Compare using timingSafeEqual()                  │   │
│  │                                                       │   │
│  │  ┌─────────┐     ┌─────────────────────┐             │   │
│  │  │ Invalid │ ──► │ Return 401          │             │   │
│  │  │ Sig     │     │ Log security event  │             │   │
│  │  └─────────┘     └─────────────────────┘             │   │
│  │                                                       │   │
│  │  ┌─────────┐     ┌─────────────────────┐             │   │
│  │  │ Valid   │ ──► │ Process webhook     │             │   │
│  │  │ Sig     │     │ (existing logic)    │             │   │
│  │  └─────────┘     └─────────────────────┘             │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Implementation Pattern

```typescript
// src/lib/webhook-security.ts
import crypto from 'crypto';

export function verifyWhatsAppSignature(
  rawBody: string | Buffer,
  signatureHeader: string | null,
  appSecret: string
): boolean {
  if (!signatureHeader) {
    console.error('Missing X-Hub-Signature-256 header');
    return false;
  }

  // Extract the signature (remove 'sha256=' prefix)
  const signature = signatureHeader.replace('sha256=', '');

  // Compute expected signature
  const expectedSignature = crypto
    .createHmac('sha256', appSecret)
    .update(rawBody)
    .digest('hex');

  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch {
    return false;
  }
}

// src/app/api/webhook/whatsapp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyWhatsAppSignature } from '@/lib/webhook-security';

export async function POST(request: NextRequest) {
  // CRITICAL: Get raw body BEFORE parsing
  const rawBody = await request.text();
  const signature = request.headers.get('x-hub-signature-256');

  // Verify signature
  const isValid = verifyWhatsAppSignature(
    rawBody,
    signature,
    process.env.WHATSAPP_APP_SECRET!
  );

  if (!isValid) {
    console.error('Invalid webhook signature - possible spoofing attempt');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Now safe to parse and process
  const body = JSON.parse(rawBody);

  // ... rest of existing webhook logic
}
```

### Required Environment Variable

```env
# Add to .env.local - this is your Meta App Secret (NOT the verify token)
WHATSAPP_APP_SECRET=your-app-secret-from-meta-dashboard
```

### Critical Implementation Notes

1. **Raw body first**: Must capture raw body before any JSON parsing
2. **Timing-safe comparison**: Always use `crypto.timingSafeEqual()` to prevent timing attacks
3. **Log failures**: Log signature failures for security monitoring
4. **Never skip verification**: Even in development, use a test secret

---

## Component 3: Admin API Authentication

### Authentication Middleware Pattern

Admin routes need server-side authentication verification, not just client-side checks.

**Confidence:** HIGH (Verified with [Supabase Auth documentation](https://supabase.com/docs/guides/auth/server-side/nextjs) and [Next.js middleware patterns](https://nextjs.org/learn/dashboard-app/adding-authentication))

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 ADMIN AUTH ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Admin Dashboard (Client)                                    │
│       │                                                      │
│       │ Request to /api/admin/*                              │
│       │ Cookie: sb-access-token, sb-refresh-token            │
│       │                                                      │
│       ▼                                                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Middleware Auth Check (middleware.ts)         │   │
│  │                                                       │   │
│  │  For /admin/* routes:                                │   │
│  │  1. Extract session from cookies                     │   │
│  │  2. Verify session with Supabase                     │   │
│  │  3. Check user is in admins table                    │   │
│  │  4. Verify mosque_id matches request                 │   │
│  │                                                       │   │
│  │  Unauthorized → Redirect to /admin/login             │   │
│  │  Authorized   → Continue to API route                │   │
│  └──────────────────────────────────────────────────────┘   │
│       │                                                      │
│       ▼                                                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              API Route Handler                        │   │
│  │                                                       │   │
│  │  Additional checks:                                  │   │
│  │  - Verify user can access requested mosque_id       │   │
│  │  - Rate limit per user (not just IP)                │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Combined Middleware Implementation

```typescript
// middleware.ts (project root)
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Rate limiters
const publicRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '60 s'),
  prefix: 'masjid-public',
});

const adminRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(30, '60 s'),
  prefix: 'masjid-admin',
});

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? '127.0.0.1';

  // Create response that can be modified
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  // === RATE LIMITING ===
  if (path.startsWith('/api/subscribe')) {
    const { success } = await publicRatelimit.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }
  }

  // === ADMIN AUTHENTICATION ===
  if (path.startsWith('/api/admin/') || path.startsWith('/admin')) {
    // Skip login page
    if (path === '/admin/login') {
      return response;
    }

    // Create Supabase client for auth check
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    // Refresh session
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      // For API routes, return 401
      if (path.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      // For pages, redirect to login
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // Apply admin rate limiting (per user, not IP)
    const { success } = await adminRatelimit.limit(user.id);
    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Attach user ID to headers for API routes
    response.headers.set('x-user-id', user.id);
  }

  return response;
}

export const config = {
  matcher: [
    '/api/subscribe/:path*',
    '/api/admin/:path*',
    '/admin/:path*',
  ],
};
```

### API Route Authorization Pattern

```typescript
// src/app/api/admin/announcements/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  // User ID is set by middleware after authentication
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { mosque_id, content } = body;

  // Verify user is admin for this specific mosque
  const { data: admin, error: adminError } = await supabaseAdmin
    .from('admins')
    .select('role')
    .eq('user_id', userId)
    .eq('mosque_id', mosque_id)
    .single();

  if (adminError || !admin) {
    return NextResponse.json(
      { error: 'Not authorized for this mosque' },
      { status: 403 }
    );
  }

  // ... proceed with announcement logic
}
```

### Dependencies

```bash
npm install @supabase/ssr
```

---

## Component 4: Message Batching Architecture

### The Problem: Vercel Timeout Limits

| Plan | Default Timeout | With Fluid Compute |
|------|-----------------|-------------------|
| Hobby | 10 seconds | 300 seconds |
| Pro | 60 seconds | 800 seconds |

With 500+ subscribers and sequential sending (~50ms per message), announcement sending takes 25+ seconds, risking timeout on Hobby plan.

**Confidence:** HIGH (Verified with [Vercel documentation](https://vercel.com/docs/functions/configuring-functions/duration) and [Upstash QStash docs](https://upstash.com/docs/qstash/overall/getstarted))

### Solution: QStash Message Queue

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     MESSAGE BATCHING ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Admin triggers announcement                                             │
│       │                                                                  │
│       ▼                                                                  │
│  ┌──────────────────────────────────────────────────────────┐           │
│  │  POST /api/admin/announcements                            │           │
│  │                                                           │           │
│  │  1. Validate request & authorization                     │           │
│  │  2. Fetch subscribers (paginated: 50 per batch)          │           │
│  │  3. Create QStash batch request                          │           │
│  │  4. Return immediately: { queued: true, batches: N }     │           │
│  │                                                           │           │
│  │  ⏱️ Total time: < 2 seconds                               │           │
│  └──────────────────────────────────────────────────────────┘           │
│       │                                                                  │
│       │ Batch request to QStash                                          │
│       │                                                                  │
│       ▼                                                                  │
│  ┌──────────────────────────────────────────────────────────┐           │
│  │                    Upstash QStash                         │           │
│  │                                                           │           │
│  │  Features:                                               │           │
│  │  - Durably stores messages                               │           │
│  │  - Automatic retries (3x with exponential backoff)       │           │
│  │  - Rate limiting (messages/second to endpoint)           │           │
│  │  - Dead letter queue for failures                        │           │
│  │  - Delivery receipts                                     │           │
│  │                                                           │           │
│  │  Configuration:                                          │           │
│  │  - Parallelism: 10 concurrent                            │           │
│  │  - Rate: 50/second (below WhatsApp 80/sec limit)         │           │
│  └──────────────────────────────────────────────────────────┘           │
│       │                                                                  │
│       │ Delivers to worker endpoint                                      │
│       │                                                                  │
│       ▼                                                                  │
│  ┌──────────────────────────────────────────────────────────┐           │
│  │  POST /api/worker/send-batch                              │           │
│  │                                                           │           │
│  │  1. Verify QStash signature                              │           │
│  │  2. Parse batch of phone numbers (50 max)                │           │
│  │  3. Send messages sequentially with 20ms delay           │           │
│  │  4. Update message log in Supabase                       │           │
│  │  5. Return success/failure count                         │           │
│  │                                                           │           │
│  │  ⏱️ Per batch: ~3-5 seconds                               │           │
│  └──────────────────────────────────────────────────────────┘           │
│       │                                                                  │
│       ▼                                                                  │
│  ┌──────────────────────────────────────────────────────────┐           │
│  │              WhatsApp Cloud API                           │           │
│  │              Respecting 80 msg/sec limit                  │           │
│  └──────────────────────────────────────────────────────────┘           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Implementation Pattern

```typescript
// src/lib/qstash.ts
import { Client } from '@upstash/qstash';

export const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
});

export interface MessageBatch {
  mosqueName: string;
  content: string;
  phoneNumbers: string[];
  messageLogId: string;
}

// src/app/api/admin/announcements/route.ts (refactored)
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { qstash, MessageBatch } from '@/lib/qstash';

const BATCH_SIZE = 50;
const WORKER_URL = `${process.env.NEXT_PUBLIC_APP_URL}/api/worker/send-batch`;

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { mosque_id, content } = await request.json();

  // Verify admin access
  const { data: admin } = await supabaseAdmin
    .from('admins')
    .select('role')
    .eq('user_id', userId)
    .eq('mosque_id', mosque_id)
    .single();

  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get mosque name
  const { data: mosque } = await supabaseAdmin
    .from('mosques')
    .select('name')
    .eq('id', mosque_id)
    .single();

  // Get all active subscribers
  const { data: subscribers } = await supabaseAdmin
    .from('subscribers')
    .select('phone_number')
    .eq('mosque_id', mosque_id)
    .eq('status', 'active')
    .eq('pref_programs', true);

  if (!subscribers || subscribers.length === 0) {
    return NextResponse.json({ error: 'No subscribers' }, { status: 400 });
  }

  // Create message log entry
  const { data: messageLog } = await supabaseAdmin
    .from('messages')
    .insert({
      mosque_id,
      type: 'announcement',
      content,
      sent_to_count: 0,
      status: 'queued',
      metadata: { total_recipients: subscribers.length },
    })
    .select('id')
    .single();

  // Batch subscribers into groups of 50
  const phoneNumbers = subscribers.map(s => s.phone_number);
  const batches: string[][] = [];

  for (let i = 0; i < phoneNumbers.length; i += BATCH_SIZE) {
    batches.push(phoneNumbers.slice(i, i + BATCH_SIZE));
  }

  // Queue all batches via QStash
  const qstashMessages = batches.map((batch, index) => ({
    destination: WORKER_URL,
    body: JSON.stringify({
      mosqueName: mosque!.name,
      content,
      phoneNumbers: batch,
      messageLogId: messageLog!.id,
      batchIndex: index,
      totalBatches: batches.length,
    } as MessageBatch),
    headers: {
      'Content-Type': 'application/json',
    },
    retries: 3,
    delay: index * 2, // 2 second delay between batches
  }));

  await qstash.batchJSON(qstashMessages);

  return NextResponse.json({
    success: true,
    queued: true,
    totalSubscribers: subscribers.length,
    batches: batches.length,
    messageLogId: messageLog!.id,
  });
}

// src/app/api/worker/send-batch/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Receiver } from '@upstash/qstash';
import { supabaseAdmin } from '@/lib/supabase';
import { sendWhatsAppMessage, getAnnouncementMessage } from '@/lib/whatsapp';
import type { MessageBatch } from '@/lib/qstash';

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

export async function POST(request: NextRequest) {
  // Verify QStash signature
  const signature = request.headers.get('upstash-signature');
  const rawBody = await request.text();

  const isValid = await receiver.verify({
    signature: signature!,
    body: rawBody,
  });

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const batch: MessageBatch = JSON.parse(rawBody);
  const message = getAnnouncementMessage(batch.content, batch.mosqueName);

  let successCount = 0;
  let failCount = 0;

  // Send messages with small delay to respect rate limits
  for (const phone of batch.phoneNumbers) {
    const result = await sendWhatsAppMessage(phone, message);

    if (result.success) {
      successCount++;
    } else {
      failCount++;
      console.error(`Failed to send to ${phone}: ${result.error}`);
    }

    // 20ms delay between messages (50/sec, well under WhatsApp limit)
    await new Promise(resolve => setTimeout(resolve, 20));
  }

  // Update message log
  await supabaseAdmin.rpc('increment_message_count', {
    message_id: batch.messageLogId,
    success_increment: successCount,
    fail_increment: failCount,
  });

  return NextResponse.json({ successCount, failCount });
}
```

### Required Environment Variables

```env
QSTASH_TOKEN=your-qstash-token
QSTASH_CURRENT_SIGNING_KEY=your-current-signing-key
QSTASH_NEXT_SIGNING_KEY=your-next-signing-key
```

### Dependencies

```bash
npm install @upstash/qstash
```

### Cron Job Refactoring Pattern

The same pattern applies to cron jobs for prayer reminders:

```typescript
// src/app/api/cron/prayer-reminders/route.ts (refactored)
export async function GET(request: NextRequest) {
  // Verify CRON_SECRET
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ... calculate eligible subscribers ...

  if (eligibleSubscribers.length > BATCH_SIZE) {
    // Queue batches via QStash (same pattern as announcements)
    await queueBatches(eligibleSubscribers, message);
    return NextResponse.json({ queued: true });
  } else {
    // Small batch: send directly
    await sendDirectly(eligibleSubscribers, message);
    return NextResponse.json({ sent: eligibleSubscribers.length });
  }
}
```

---

## Scalability Considerations

| Concern | At 100 subscribers | At 500 subscribers | At 5000 subscribers |
|---------|--------------------|--------------------|---------------------|
| Message sending | Direct loop (~5s) | QStash batching (~30s total, queued) | QStash with parallelism (~2min total) |
| Rate limiting | In-memory Map | Upstash Redis | Upstash Redis (scales automatically) |
| Webhook volume | Low | Moderate | Need to monitor, consider dedicated worker |
| Database load | Single queries | Batch queries | Consider read replicas, pagination |

---

## WhatsApp API Rate Limits Reference

| Limit Type | Default | Upgraded | Notes |
|------------|---------|----------|-------|
| Messages per second | 80 | 1000 | Auto-upgrade when unlimited tier |
| Pair rate (per user) | 10/min | 10/min | Fixed, 1 msg per 6 seconds per user |
| Conversations/24h | 250-1000 | Unlimited | Depends on business verification |

**Recommendation:** Stay at 50 messages/second to maintain safety margin.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Client-Side Only Auth

**What:** Checking authentication only in React components, not in API routes
**Why bad:** API routes can be called directly, bypassing frontend
**Instead:** Always verify authentication in middleware AND API route

### Anti-Pattern 2: Sequential Sending Without Queue

**What:** Looping through subscribers with `await sendMessage()` in API handler
**Why bad:** Timeouts, no retries, blocking request
**Instead:** Queue messages, return immediately, process asynchronously

### Anti-Pattern 3: Parsing Body Before Signature Verification

**What:** Using `request.json()` before checking webhook signature
**Why bad:** Signature must be computed on raw body
**Instead:** Use `request.text()`, verify, then parse

### Anti-Pattern 4: Trusting X-Forwarded-For Blindly

**What:** Using client-provided IP headers without validation
**Why bad:** Can be spoofed to bypass rate limits
**Instead:** On Vercel, use `request.ip` which is set by the platform

### Anti-Pattern 5: Storing Secrets in NEXT_PUBLIC_ Variables

**What:** `NEXT_PUBLIC_WHATSAPP_APP_SECRET`
**Why bad:** Exposed to browser
**Instead:** No prefix for server-only secrets

---

## Implementation Phases (Recommended Order)

### Phase 1: Webhook Security (Critical)
- Add signature verification to `/api/webhook/whatsapp`
- Add `WHATSAPP_APP_SECRET` environment variable
- Test with Meta webhook test tool

### Phase 2: Admin Authentication Middleware
- Create `middleware.ts` with Supabase auth check
- Add authorization in `/api/admin/*` routes
- Test admin flows still work

### Phase 3: Rate Limiting
- Set up Upstash Redis account
- Add rate limiting to middleware
- Configure different limits per endpoint

### Phase 4: Message Queue Architecture
- Set up Upstash QStash
- Create worker endpoint `/api/worker/send-batch`
- Refactor announcement sending to use queues
- Refactor cron jobs for large subscriber bases

---

## Sources

### Rate Limiting
- [Upstash Rate Limiting Documentation](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview) - HIGH confidence
- [Upstash Edge Rate Limiting Blog](https://upstash.com/blog/edge-rate-limiting) - HIGH confidence
- [Vercel Next.js Rate Limiting Discussion](https://github.com/vercel/next.js/discussions/62557) - MEDIUM confidence

### Webhook Security
- [Meta Community Forums: Webhook Signature](https://communityforums.atmeta.com/discussions/dev-general/how-to-verify-a-webhook-request-sign/1171086) - HIGH confidence
- [Hookdeck SHA256 Signature Guide](https://hookdeck.com/webhooks/guides/how-to-implement-sha256-webhook-signature-verification) - HIGH confidence

### Message Queues
- [Upstash QStash Documentation](https://upstash.com/docs/qstash/overall/getstarted) - HIGH confidence
- [Vercel Function Duration Docs](https://vercel.com/docs/functions/configuring-functions/duration) - HIGH confidence
- [QStash Webhook Decoupling Blog](https://upstash.com/blog/webhook-qstash) - HIGH confidence

### Authentication
- [Supabase Server-Side Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) - HIGH confidence
- [Next.js Middleware Authentication Guide](https://nextjs.org/learn/dashboard-app/adding-authentication) - HIGH confidence

### WhatsApp API
- [WhatsApp API Rate Limits (WATI)](https://www.wati.io/en/blog/whatsapp-business-api/whatsapp-api-rate-limits/) - MEDIUM confidence
- [WhatsApp Throughput Limits](https://www.wuseller.com/whatsapp-business-knowledge-hub/scale-whatsapp-cloud-api-master-throughput-limits-upgrades-2026/) - MEDIUM confidence
