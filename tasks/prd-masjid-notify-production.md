# PRD: Masjid Notify Production Deployment

## Introduction

Complete production deployment of Masjid Notify, a WhatsApp notification system for mosques. The core MVP features are built and working locally. This PRD covers all remaining work to go live before Ramadan 2025: WhatsApp template compliance, security hardening, monitoring, message scheduling, bug fixes, and production deployment.

**Deadline:** Ramadan 2025 (~Feb 28, 2025)
**Current State:** MVP complete locally, needs production hardening

## Goals

- Get Meta-approved WhatsApp message templates for all notification types
- Secure all public endpoints with rate limiting and signature verification
- Add error monitoring with Sentry for production observability
- Enable message scheduling for admin convenience
- Fix all known bugs from CONCERNS.md
- Deploy to Vercel with full production configuration
- Complete end-to-end smoke test

## User Stories

### Phase 1: WhatsApp Templates (Critical Path)

#### US-001: Create Prayer Reminder Template
**Description:** As an admin, I need Meta-approved templates for prayer reminders so messages are delivered in production.

**Acceptance Criteria:**
- [ ] Create Utility template with variables: {{1}} prayer name, {{2}} time
- [ ] Template text follows Meta guidelines (no variables at start/end)
- [ ] Submit template via Meta Business Manager
- [ ] Template approved by Meta

#### US-002: Create Welcome Message Template
**Description:** As an admin, I need a welcome template so new subscribers receive confirmation.

**Acceptance Criteria:**
- [ ] Create Utility template for welcome message
- [ ] Include mosque name and settings link variables
- [ ] Submit and get approved by Meta

#### US-003: Create Ramadan Templates
**Description:** As an admin, I need templates for Suhoor, Iftar, and Taraweeh reminders.

**Acceptance Criteria:**
- [ ] Create 3 Utility templates with time variables
- [ ] Each template approved by Meta
- [ ] Templates support dynamic daily times

#### US-004: Create Announcement Template
**Description:** As an admin, I need a template for broadcasting announcements.

**Acceptance Criteria:**
- [ ] Create Marketing or Utility template with body variable
- [ ] Template approved by Meta

#### US-005: Create Jumu'ah and Hadith Templates
**Description:** As an admin, I need templates for Friday reminders and daily hadith.

**Acceptance Criteria:**
- [ ] Create Jumu'ah template with Adhaan/Khutbah times
- [ ] Create Hadith template with text variable
- [ ] Both templates approved by Meta

#### US-006: Refactor Message Sending to Use Templates
**Description:** As a developer, I need to update all message sending to use template IDs.

**Acceptance Criteria:**
- [ ] Update `src/lib/whatsapp.ts` to send template messages
- [ ] Replace freeform text with template name + parameters
- [ ] All cron jobs use templates (prayer, hadith, jumuah, ramadan)
- [ ] Subscribe welcome uses template
- [ ] Announcements use template
- [ ] Typecheck passes
- [ ] Test message delivery works

### Phase 2: Security Hardening

#### US-007: Implement Rate Limiting on Subscribe
**Description:** As a system, I need to prevent abuse of the subscribe endpoint.

**Acceptance Criteria:**
- [ ] Install @upstash/ratelimit and @upstash/redis
- [ ] Create Upstash Redis database
- [ ] Add rate limiting middleware to /api/subscribe (10 req/min per IP)
- [ ] Return 429 status when limit exceeded
- [ ] Typecheck passes

#### US-008: Implement Rate Limiting on Webhook
**Description:** As a system, I need to prevent abuse of the WhatsApp webhook.

**Acceptance Criteria:**
- [ ] Add rate limiting to /api/webhook/whatsapp
- [ ] Configure appropriate limit (higher than subscribe)
- [ ] Return 429 when exceeded
- [ ] Typecheck passes

#### US-009: Add Webhook Signature Verification
**Description:** As a system, I need to verify WhatsApp requests are authentic.

**Acceptance Criteria:**
- [ ] Get raw request body before JSON parsing
- [ ] Verify X-Hub-Signature-256 header using HMAC-SHA256
- [ ] Use crypto.timingSafeEqual for comparison
- [ ] Reject requests with invalid signatures (401)
- [ ] Add WHATSAPP_APP_SECRET to environment variables
- [ ] Typecheck passes

#### US-010: Add Server-Side Admin Authentication
**Description:** As a system, I need to verify admin sessions on API routes.

**Acceptance Criteria:**
- [ ] Create auth middleware for admin routes
- [ ] Verify Supabase session on each request
- [ ] Check user exists in admins table
- [ ] Return 401 for unauthenticated requests
- [ ] Apply to /api/admin/* routes
- [ ] Typecheck passes

#### US-011: Fix Settings Token Persistence
**Description:** As a user, I need settings links to work.

**Acceptance Criteria:**
- [ ] Add settings_token and settings_token_expires columns to subscribers
- [ ] Generate and store token when SETTINGS command received
- [ ] Validate token in /api/settings/[token] route
- [ ] Token expires after 24 hours
- [ ] Settings page loads and saves preferences
- [ ] Typecheck passes

#### US-012: Use Constant-Time Comparison for Cron Secret
**Description:** As a system, I need secure cron authentication.

**Acceptance Criteria:**
- [ ] Replace string comparison with crypto.timingSafeEqual
- [ ] Apply to all cron routes
- [ ] Typecheck passes

#### US-013: Normalize Phone Number Format
**Description:** As a system, I need consistent phone number handling.

**Acceptance Criteria:**
- [ ] Create normalizePhoneNumber utility function
- [ ] Handle +27, 27, and 0 prefixes consistently
- [ ] Use in webhook subscriber lookup
- [ ] Use in subscribe endpoint
- [ ] Typecheck passes

### Phase 3: Monitoring & Reliability

#### US-014: Integrate Sentry Error Tracking
**Description:** As an admin, I need to see production errors.

**Acceptance Criteria:**
- [ ] Run npx @sentry/wizard@latest -i nextjs
- [ ] Configure Sentry DSN in environment
- [ ] Errors appear in Sentry dashboard
- [ ] Source maps uploaded for readable stack traces
- [ ] Typecheck passes

#### US-015: Add Structured Logging for Cron Jobs
**Description:** As an admin, I need visibility into cron execution.

**Acceptance Criteria:**
- [ ] Log start time, end time, duration for each cron
- [ ] Log number of messages sent
- [ ] Log any errors with context
- [ ] Use console.log with JSON structure
- [ ] Typecheck passes

#### US-016: Fix Prayer Reminder Window
**Description:** As a user, I need reliable prayer reminders.

**Acceptance Criteria:**
- [ ] Increase reminder window from 2 to 5 minutes
- [ ] Or implement last_sent tracking to prevent duplicates
- [ ] Reminders not missed due to cron timing variance
- [ ] Typecheck passes

#### US-017: Implement Concurrent Message Sending
**Description:** As a system, I need to send messages faster.

**Acceptance Criteria:**
- [ ] Use Promise.all with concurrency limit (e.g., p-limit)
- [ ] Send messages in batches of 10-20
- [ ] Complete within Vercel timeout (60s Pro, 10s Hobby)
- [ ] Handle individual failures without stopping batch
- [ ] Typecheck passes

#### US-018: Add Prayer Times Caching
**Description:** As a system, I need to avoid repeated API calls.

**Acceptance Criteria:**
- [ ] Cache prayer times for entire day
- [ ] Store in database or Vercel KV
- [ ] Fetch once per day, not per cron run
- [ ] Invalidate at midnight local time
- [ ] Typecheck passes

#### US-019: Batch Subscriber Updates
**Description:** As a system, I need efficient database operations.

**Acceptance Criteria:**
- [ ] Collect all subscriber IDs that received messages
- [ ] Single batch update for last_message_at
- [ ] Remove N+1 query pattern
- [ ] Typecheck passes

### Phase 4: Message Scheduling

#### US-020: Add Scheduling Database Schema
**Description:** As a developer, I need to store scheduled messages.

**Acceptance Criteria:**
- [ ] Add scheduled_messages table or scheduled_at column
- [ ] Include: content, scheduled_at, status, sent_at
- [ ] Create Supabase migration
- [ ] Run migration successfully
- [ ] Typecheck passes

#### US-021: Create Scheduling UI
**Description:** As an admin, I want to schedule announcements.

**Acceptance Criteria:**
- [ ] Add date/time picker to announcements page
- [ ] Show list of pending scheduled messages
- [ ] Allow cancel/edit before send time
- [ ] Clear visual distinction from immediate send
- [ ] Typecheck passes
- [ ] Verify in browser

#### US-022: Extend Cron for Scheduled Messages
**Description:** As a system, I need to send scheduled messages on time.

**Acceptance Criteria:**
- [ ] Check for due scheduled messages every 5 minutes
- [ ] Send messages where scheduled_at <= now
- [ ] Update status to 'sent' after sending
- [ ] Handle failures gracefully
- [ ] Typecheck passes

#### US-023: Add Scheduled Message Preview
**Description:** As an admin, I want to preview before scheduling.

**Acceptance Criteria:**
- [ ] Preview shows exactly what will be sent
- [ ] Includes template formatting
- [ ] Edit button returns to form
- [ ] Typecheck passes
- [ ] Verify in browser

### Phase 5: Bug Fixes

#### US-024: Fix Webhook Phone Format Mismatch
**Description:** As a user, I need my commands to work.

**Acceptance Criteria:**
- [ ] Normalize incoming phone before lookup
- [ ] Match regardless of + prefix
- [ ] Test with +27 and 27 formats
- [ ] Typecheck passes

#### US-025: Fix RESUME/START for Unsubscribed Users
**Description:** As a user, I want to resubscribe after STOP.

**Acceptance Criteria:**
- [ ] RESUME and START reactivate unsubscribed users
- [ ] Set status back to 'active'
- [ ] Send confirmation message
- [ ] Typecheck passes

#### US-026: Fix Message Log Count
**Description:** As an admin, I need accurate message counts.

**Acceptance Criteria:**
- [ ] sent_to_count reflects actual messages per log entry
- [ ] Reset count per prayer/notification type
- [ ] Accurate in database and dashboard
- [ ] Typecheck passes

#### US-027: Remove Hardcoded Ramadan Dates
**Description:** As an admin, I need future-proof Ramadan handling.

**Acceptance Criteria:**
- [ ] Remove hardcoded 2025 dates from isRamadanSeason()
- [ ] Use ramadan_mode database flag exclusively
- [ ] Admin controls Ramadan mode via settings
- [ ] Typecheck passes

### Phase 6: Production Deployment

#### US-028: Create Admin User
**Description:** As an admin, I need login credentials.

**Acceptance Criteria:**
- [ ] Create user in Supabase Auth dashboard
- [ ] Insert into admins table with owner role
- [ ] Link to correct mosque_id
- [ ] Can log in at /admin/login

#### US-029: Deploy to Vercel
**Description:** As an admin, I need the app live.

**Acceptance Criteria:**
- [ ] Run vercel deploy --prod
- [ ] Build succeeds without errors
- [ ] App accessible at production URL

#### US-030: Configure Environment Variables
**Description:** As a system, I need all secrets configured.

**Acceptance Criteria:**
- [ ] All variables from .env.local added to Vercel
- [ ] Mark sensitive values appropriately
- [ ] App loads without missing env errors

#### US-031: Configure WhatsApp Webhook
**Description:** As a system, I need to receive WhatsApp messages.

**Acceptance Criteria:**
- [ ] Set webhook URL in Meta Developer Console
- [ ] Verification succeeds
- [ ] Subscribe to messages event
- [ ] Test message received at webhook

#### US-032: Generate Production Secrets
**Description:** As a system, I need secure production credentials.

**Acceptance Criteria:**
- [ ] Generate new CRON_SECRET (32+ chars)
- [ ] Generate new WHATSAPP_WEBHOOK_VERIFY_TOKEN
- [ ] Update in Vercel and Meta Console

#### US-033: Add force-dynamic to Cron Routes
**Description:** As a system, I need crons to run dynamically.

**Acceptance Criteria:**
- [ ] Add export const dynamic = 'force-dynamic' to cron routes
- [ ] Prevents caching of cron responses
- [ ] Typecheck passes

#### US-034: End-to-End Production Test
**Description:** As an admin, I need confidence the system works.

**Acceptance Criteria:**
- [ ] Subscribe via production form
- [ ] Receive welcome message on WhatsApp
- [ ] Wait for prayer reminder (or trigger manually)
- [ ] Receive prayer reminder
- [ ] Send STOP command, confirm unsubscribe
- [ ] Admin dashboard shows new subscriber

## Functional Requirements

- FR-1: All WhatsApp messages must use Meta-approved templates
- FR-2: Subscribe endpoint limited to 10 requests/minute per IP
- FR-3: Webhook requests must pass signature verification
- FR-4: Admin API routes require valid Supabase session
- FR-5: Errors must appear in Sentry within 1 minute
- FR-6: Messages sent concurrently in batches, not sequentially
- FR-7: Prayer times cached for 24 hours
- FR-8: Admin can schedule announcements for future delivery
- FR-9: All bugs from CONCERNS.md resolved before launch
- FR-10: Production deployment complete with all integrations

## Non-Goals

- Multi-mosque support (single mosque MVP)
- Mobile app (WhatsApp is the mobile interface)
- Delivery receipt tracking (v2 feature)
- Multi-language support (English only for MVP)
- OAuth/social login (email/password sufficient)
- Real-time chat (notification system only)

## Technical Considerations

- **WhatsApp Templates:** Approval takes 1 minute to 48 hours. Start Phase 1 immediately.
- **Rate Limiting:** Use Upstash (serverless-compatible), not in-memory
- **Vercel Timeout:** 10s Hobby, 60s Pro. Batching required for 500+ subscribers
- **Sentry:** Use wizard for proper Next.js 16 configuration
- **Environment:** All secrets via Vercel dashboard, not committed

## Success Metrics

- All 6 WhatsApp templates approved by Meta
- Zero security vulnerabilities (rate limiting, auth, signatures)
- Errors visible in Sentry within 1 minute
- Messages sent within 5-minute window of prayer time
- Admin can schedule and manage future announcements
- All 4 bugs from CONCERNS.md verified fixed
- End-to-end test passes on production

## Open Questions

- Vercel plan (Hobby vs Pro) - affects timeout limits
- Exact WhatsApp pricing for +27 (South Africa) numbers
- Whether to use Meta Marketing templates for announcements

---

*PRD created: 2026-01-31*
*Based on GSD Roadmap: 6 phases, 38 requirements*
