# Architecture

**Analysis Date:** 2026-01-31

## Pattern Overview

**Overall:** Next.js App Router Monolith with Supabase Backend

**Key Characteristics:**
- Server-Side Rendering (SSR) with React Server Components for landing pages
- Client-Side SPA for admin dashboard with client-side auth guards
- API Routes (Route Handlers) for backend logic
- Scheduled cron jobs via Vercel for background messaging tasks
- WhatsApp Business API integration for outbound messaging
- Row Level Security (RLS) in Supabase for data access control

## Layers

**Presentation Layer:**
- Purpose: UI rendering and user interactions
- Location: `src/app/`, `src/components/`
- Contains: React components, pages, layouts
- Depends on: Library layer, API layer (via fetch)
- Used by: End users (subscribers) and admin users

**API Layer:**
- Purpose: HTTP endpoints for data mutations and external integrations
- Location: `src/app/api/`
- Contains: Route handlers (POST/GET), webhook handlers, cron endpoints
- Depends on: Library layer (Supabase, WhatsApp clients)
- Used by: Presentation layer, Vercel Cron, WhatsApp webhooks

**Library Layer:**
- Purpose: Shared utilities, external service clients, type definitions
- Location: `src/lib/`
- Contains: Supabase clients, WhatsApp API wrapper, utility functions, prayer time calculator
- Depends on: External APIs (Supabase, WhatsApp, Aladhan)
- Used by: API layer, Presentation layer

**Data Layer:**
- Purpose: Data persistence and access control
- Location: `supabase/` (schema), Supabase cloud (runtime)
- Contains: PostgreSQL tables, RLS policies, triggers
- Depends on: Supabase infrastructure
- Used by: Library layer (via Supabase clients)

## Data Flow

**Subscriber Registration Flow:**

1. User submits form on landing page (`src/app/landing-page.tsx` + `src/components/subscribe-form.tsx`)
2. Client POSTs to `/api/subscribe` route handler
3. Route handler validates phone, creates subscriber in Supabase
4. Route handler sends welcome message via WhatsApp API
5. Route handler logs message in `messages` table
6. Client receives success/error response

**Prayer Reminder Flow (Cron-triggered):**

1. Vercel Cron calls `GET /api/cron/prayer-reminders` every 5 minutes
2. Route handler fetches all mosques and their prayer times from Aladhan API
3. For each mosque, fetches active subscribers with matching preferences
4. Groups subscribers by reminder offset and checks if within 2-min window
5. Sends WhatsApp messages to eligible subscribers
6. Logs messages in `messages` table

**WhatsApp Command Flow (Webhook-triggered):**

1. WhatsApp sends webhook to `POST /api/webhook/whatsapp`
2. Route handler parses incoming message, extracts command
3. Looks up subscriber by phone number
4. Executes command (STOP, SETTINGS, PAUSE, RESUME, HELP)
5. Sends response message via WhatsApp API

**State Management:**
- Server state: Supabase PostgreSQL database
- Client state: React useState hooks (no global state library)
- Auth state: Supabase Auth with client-side session checks

## Key Abstractions

**Database Types:**
- Purpose: TypeScript types mirroring database schema
- Examples: `src/lib/supabase.ts` (Mosque, Subscriber, Admin, Message, Hadith types)
- Pattern: Manually defined types exported alongside Supabase client

**Supabase Clients:**
- Purpose: Database access with different permission levels
- Examples: `src/lib/supabase.ts`
- Pattern: `supabaseAdmin` (service role, bypasses RLS) for API routes; `createClientSupabase()` (browser client, uses anon key) for client components

**WhatsApp Message Formatters:**
- Purpose: Consistent message templates for different notification types
- Examples: `src/lib/whatsapp.ts` (getWelcomeMessage, getPrayerReminderMessage, etc.)
- Pattern: Pure functions that return formatted strings with mosque branding

**Prayer Times Calculator:**
- Purpose: Fetch and format prayer times from Aladhan API
- Examples: `src/lib/prayer-times.ts`
- Pattern: Async functions with caching, time offset calculations, timezone handling

## Entry Points

**Public Landing Page:**
- Location: `src/app/page.tsx`
- Triggers: User visits root URL
- Responsibilities: Fetch mosque data, prayer times; render landing page with subscribe form

**Admin Dashboard:**
- Location: `src/app/admin/page.tsx` (wrapped by `src/app/admin/layout.tsx`)
- Triggers: Admin visits /admin
- Responsibilities: Auth check, display stats, quick actions, analytics

**API Subscribe Endpoint:**
- Location: `src/app/api/subscribe/route.ts`
- Triggers: POST from subscribe form
- Responsibilities: Validate phone, create/reactivate subscriber, send welcome message

**Cron Endpoints:**
- Location: `src/app/api/cron/*/route.ts`
- Triggers: Vercel Cron scheduler (see `vercel.json`)
- Responsibilities: Prayer reminders (every 5 min), Jumuah reminder (Fridays 10am), Daily hadith (6:30am), Ramadan reminders (every 5 min)

**WhatsApp Webhook:**
- Location: `src/app/api/webhook/whatsapp/route.ts`
- Triggers: Incoming WhatsApp messages
- Responsibilities: Parse commands, update subscriber status, send responses

## Error Handling

**Strategy:** Try-catch with console.error logging, graceful degradation

**Patterns:**
- API routes return JSON errors with appropriate HTTP status codes
- Non-critical failures (e.g., WhatsApp send failure) logged but don't block success response
- Webhook always returns 200 to WhatsApp to prevent retries
- Client components display error messages via toast notifications (sonner)
- Loading states shown via Skeleton components during data fetches

## Cross-Cutting Concerns

**Logging:** Console.error for errors, no structured logging framework

**Validation:**
- Phone number validation via regex in `src/lib/utils.ts`
- Request body validation inline in route handlers
- Zod available but not extensively used yet

**Authentication:**
- Admin routes protected by Supabase Auth session check in `src/app/admin/layout.tsx`
- Cron routes protected by Bearer token (`CRON_SECRET`)
- Webhook verification via `WHATSAPP_WEBHOOK_VERIFY_TOKEN`

---

*Architecture analysis: 2026-01-31*
