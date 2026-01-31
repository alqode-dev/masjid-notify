# Codebase Concerns

**Analysis Date:** 2026-01-31

## Tech Debt

**Settings Token Not Persisted:**
- Issue: Settings link generated in webhook does not store token in database, making it impossible to validate
- Files: `src/app/api/webhook/whatsapp/route.ts` (lines 111-129), `src/app/settings/[token]/page.tsx`
- Impact: Settings links cannot work - the token is generated but never saved or associated with a subscriber
- Fix approach: Add `settings_token` and `settings_token_expires` columns to subscribers table; store token when generating settings link; validate token in settings page API

**Prayer Time Reminder Window Too Narrow:**
- Issue: Uses a 2-minute window to detect if it's time to send reminders, which may miss triggers if cron job is delayed
- Files: `src/lib/prayer-times.ts` (lines 220-222)
- Impact: Reminders may not be sent if cron runs slightly outside the 2-minute window
- Fix approach: Increase window to 5 minutes or track last sent time to prevent duplicates instead of relying on narrow timing

**Sequential WhatsApp Message Sending:**
- Issue: All cron jobs send messages one-by-one in a loop without batching or concurrency
- Files: `src/app/api/cron/prayer-reminders/route.ts` (lines 92-106), `src/app/api/cron/ramadan-reminders/route.ts`, `src/app/api/admin/announcements/route.ts`
- Impact: For 1000+ subscribers, cron may timeout (Vercel 10s-60s limit); slow delivery times
- Fix approach: Use Promise.all with concurrency limits (e.g., p-limit), or batch messages via WhatsApp Bulk API

**Subscriber Import Uses Client Supabase:**
- Issue: CSV import uses browser client which respects RLS, but inserts without checking auth properly
- Files: `src/components/admin/subscriber-import.tsx` (line 98)
- Impact: May fail silently due to RLS policies or succeed unexpectedly; inconsistent with other admin operations
- Fix approach: Create API endpoint for bulk import using supabaseAdmin; validate auth server-side

**Hardcoded Ramadan Date Check:**
- Issue: `isRamadanSeason()` function has hardcoded 2025 dates that will be incorrect in future years
- Files: `src/lib/utils.ts` (lines 113-120)
- Impact: Function will return incorrect results after March 2025
- Fix approach: Remove or deprecate this function; rely solely on `ramadan_mode` database flag which admins control

**Message Log Count Incorrect:**
- Issue: In prayer reminders cron, `sent_to_count` uses `totalSent` which accumulates across all prayers/mosques
- Files: `src/app/api/cron/prayer-reminders/route.ts` (lines 110-122)
- Impact: Message logs show inflated sent counts
- Fix approach: Reset count per message batch or track per-prayer sent count separately

## Known Bugs

**Webhook Phone Number Format Mismatch:**
- Symptoms: Subscriber lookup may fail for incoming WhatsApp messages
- Files: `src/app/api/webhook/whatsapp/route.ts` (line 48)
- Trigger: WhatsApp sends phone without `+`, but database stores with `+`. Code adds `+` prefix but format may still not match if stored differently
- Workaround: Phone numbers should be normalized on both storage and lookup

**Pause Resume via START Command Not Working:**
- Symptoms: User sends START but isn't resubscribed properly
- Files: `src/app/api/webhook/whatsapp/route.ts` (line 80)
- Trigger: "RESUME" and "START" both call `handleResume` which only updates status, but if user was `unsubscribed` (not `paused`), they should be reactivated differently
- Workaround: None currently

## Security Considerations

**Admin API Routes Lack Authentication:**
- Risk: API routes under `/api/admin/*` do not verify user session server-side
- Files: `src/app/api/admin/announcements/route.ts`, `src/app/api/admin/settings/route.ts`, `src/app/api/admin/subscribers/route.ts`
- Current mitigation: Relies on client-side auth check in admin layout and Supabase RLS
- Recommendations: Add explicit session validation in each API route; return 401 for unauthenticated requests

**Service Role Key Used in All API Routes:**
- Risk: `supabaseAdmin` bypasses all RLS, so any code bug could expose/modify all data
- Files: `src/lib/supabase.ts` (lines 94-100), used throughout `/api/*` routes
- Current mitigation: RLS policies exist but are bypassed by admin client
- Recommendations: Use service role only where necessary; prefer authenticated client for user-specific operations

**Cron Secret in Plain Comparison:**
- Risk: Timing attack possible on cron secret comparison
- Files: `src/app/api/cron/prayer-reminders/route.ts` (line 11), `src/app/api/cron/daily-hadith/route.ts`, `src/app/api/cron/jumuah-reminder/route.ts`, `src/app/api/cron/ramadan-reminders/route.ts`
- Current mitigation: Secret is in env var
- Recommendations: Use constant-time comparison (crypto.timingSafeEqual)

**WhatsApp Access Token Exposed in Memory:**
- Risk: Token stored in module-level constant, visible in stack traces
- Files: `src/lib/whatsapp.ts` (line 3)
- Current mitigation: Server-side only
- Recommendations: Access from process.env at call time rather than module initialization

**Phone Numbers Logged on Failure:**
- Risk: PII (phone numbers) logged to console on send failures
- Files: `src/app/api/admin/announcements/route.ts` (line 65-67)
- Current mitigation: None
- Recommendations: Mask phone numbers in logs or remove from error messages

## Performance Bottlenecks

**N+1 Queries in Cron Jobs:**
- Problem: For each subscriber, individual updates to `last_message_at`
- Files: `src/app/api/cron/prayer-reminders/route.ts` (lines 101-105), `src/app/api/cron/ramadan-reminders/route.ts`
- Cause: Update query inside for-loop for each subscriber
- Improvement path: Batch update all subscriber IDs that received messages at end of loop

**External API Call Per Mosque:**
- Problem: Prayer times fetched from Aladhan API for each mosque on every cron run
- Files: `src/app/api/cron/prayer-reminders/route.ts` (lines 33-38), `src/lib/prayer-times.ts`
- Cause: No caching of prayer times
- Improvement path: Cache prayer times in database or Redis; they're valid for entire day

**Analytics Charts Load All Messages:**
- Problem: Analytics fetches all messages without pagination or date limits
- Files: `src/components/admin/analytics-charts.tsx`
- Cause: No limit clause in query
- Improvement path: Add date range filter and pagination; aggregate data server-side

## Fragile Areas

**Webhook Message Parsing:**
- Files: `src/app/api/webhook/whatsapp/route.ts` (lines 26-42)
- Why fragile: Deep optional chaining without validation; WhatsApp webhook payload structure may change
- Safe modification: Add Zod schema validation for incoming webhook payload
- Test coverage: No unit tests for webhook parsing

**Prayer Time Parsing:**
- Files: `src/lib/prayer-times.ts` (lines 156-164, 170-191, 202-211)
- Why fragile: Regex-based time parsing; assumes specific format from Aladhan API
- Safe modification: Add robust date/time library (date-fns or dayjs); add unit tests for parsing
- Test coverage: No unit tests for time parsing functions

**Admin Layout Auth State:**
- Files: `src/app/admin/layout.tsx` (lines 19-50)
- Why fragile: Race condition possible between auth check and subscription listener
- Safe modification: Use server-side auth check in middleware
- Test coverage: Only E2E tests for auth flow

## Scaling Limits

**Vercel Cron Timeout:**
- Current capacity: ~100-200 subscribers per cron run (10s timeout on Hobby, 60s on Pro)
- Limit: At ~500+ subscribers, cron will timeout before sending all messages
- Scaling path: Move to background job processing (Vercel Queue, Inngest, or external service)

**WhatsApp Rate Limits:**
- Current capacity: Unknown - no rate limiting implemented
- Limit: WhatsApp Business API has per-phone rate limits (80 messages/second max)
- Scaling path: Implement rate limiting with queue system; track rate limit headers

**Single Mosque Query Pattern:**
- Current capacity: Works for pilot (1 mosque)
- Limit: Public page (`page.tsx`) queries first mosque; admin assumes single mosque per user
- Scaling path: Add mosque selection for multi-tenant support; use subdomain or slug routing

## Dependencies at Risk

**Meta WhatsApp Cloud API:**
- Risk: API version (v18.0) may be deprecated; Meta has history of breaking changes
- Impact: All messaging functionality breaks
- Migration plan: Monitor API changelog; abstract API calls behind interface for easier updates

**Aladhan Prayer Times API:**
- Risk: Free API with no SLA; no fallback if service is down
- Impact: Prayer reminders cannot be sent
- Migration plan: Cache times locally; add fallback calculation library (adhan-js)

**Next.js 16 (Release Candidate):**
- Risk: Running on non-stable Next.js version (16.1.6)
- Impact: Potential bugs; limited community support
- Migration plan: Monitor for stable release; be prepared for breaking changes

## Missing Critical Features

**No Webhook Signature Verification:**
- Problem: WhatsApp webhook does not verify `X-Hub-Signature-256` header
- Blocks: Production deployment to verified WhatsApp Business Account
- Priority: High - required for security

**No Message Delivery Tracking:**
- Problem: No tracking of whether messages were actually delivered/read
- Blocks: Delivery analytics; retry failed messages
- Priority: Medium

**No Subscriber Settings API:**
- Problem: `/api/settings/[token]` route does not exist
- Blocks: Settings page functionality completely broken
- Priority: High - core feature

**No Rate Limiting:**
- Problem: No rate limiting on public endpoints (subscribe, webhook)
- Blocks: Production readiness
- Priority: High - security requirement

## Test Coverage Gaps

**API Routes Not Tested:**
- What's not tested: All API routes (`/api/subscribe`, `/api/webhook/*`, `/api/cron/*`, `/api/admin/*`)
- Files: `src/app/api/**/*.ts`
- Risk: Regressions in core messaging logic go unnoticed
- Priority: High

**Utility Functions Not Tested:**
- What's not tested: Phone validation, time parsing, formatting functions
- Files: `src/lib/utils.ts`, `src/lib/prayer-times.ts`
- Risk: Edge cases in phone number formats or time zones cause failures
- Priority: Medium

**WhatsApp Integration Not Mocked:**
- What's not tested: WhatsApp send functions with mocked API responses
- Files: `src/lib/whatsapp.ts`
- Risk: Cannot test error handling paths; no confidence in API integration
- Priority: Medium

**Component Unit Tests Missing:**
- What's not tested: React components (form validation, state management)
- Files: `src/components/**/*.tsx`
- Risk: UI regressions; form behavior changes
- Priority: Low (E2E covers happy paths)

---

*Concerns audit: 2026-01-31*
