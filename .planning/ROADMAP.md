# Roadmap: Masjid Notify

## Overview

This roadmap delivers Masjid Notify from working MVP to production-ready WhatsApp notification system before Ramadan 2025. The critical path starts with WhatsApp template compliance (48-hour approval buffer needed), followed by security hardening, reliability improvements, and finally production deployment. Bug fixes are addressed before deployment to ensure a stable launch.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: WhatsApp Templates** - Meta-approved templates for all message types (critical path)
- [ ] **Phase 2: Security Hardening** - Rate limiting, auth, token validation, webhook security
- [ ] **Phase 3: Monitoring & Reliability** - Sentry, logging, performance optimizations
- [ ] **Phase 4: Message Scheduling** - Database storage and UI for scheduled announcements
- [ ] **Phase 5: Bug Fixes** - Known issues from CONCERNS.md
- [ ] **Phase 6: Production Deployment** - Vercel deployment, environment setup, smoke testing

## Phase Details

### Phase 1: WhatsApp Templates
**Goal**: All automated messages use Meta-approved templates, enabling legal production messaging
**Depends on**: Nothing (first phase, critical path)
**Requirements**: TMPL-01, TMPL-02, TMPL-03, TMPL-04, TMPL-05, TMPL-06, TMPL-07, TMPL-08
**Success Criteria** (what must be TRUE):
  1. Prayer reminder messages sent via approved Utility template with dynamic prayer name and time
  2. Welcome messages sent via approved template when user subscribes
  3. Ramadan messages (Suhoor, Iftar, Taraweeh) sent via approved templates with daily times
  4. Admin announcements sent via approved template with custom body text
  5. Template submission to Meta completed and all templates approved
**Plans**: TBD

Plans:
- [ ] 01-01: Create and submit all message templates to Meta
- [ ] 01-02: Refactor message sending to use template IDs

### Phase 2: Security Hardening
**Goal**: Production-grade security protecting all public endpoints and admin routes
**Depends on**: Phase 1 (templates must work before securing the system)
**Requirements**: SEC-01, SEC-02, SEC-03, SEC-04, SEC-05, SEC-06, SEC-07
**Success Criteria** (what must be TRUE):
  1. Subscribe endpoint returns 429 error after 10 requests per minute from same IP
  2. Webhook endpoint rate limited to prevent abuse
  3. Webhook requests without valid X-Hub-Signature-256 header are rejected with 401
  4. Admin API routes return 401 when accessed without valid session
  5. Settings page loads and saves preferences using persisted database token
**Plans**: TBD

Plans:
- [ ] 02-01: Implement rate limiting on public endpoints
- [ ] 02-02: Add webhook signature verification and admin auth
- [ ] 02-03: Fix settings token persistence and phone normalization

### Phase 3: Monitoring & Reliability
**Goal**: Production observability and performance that scales to full subscriber base
**Depends on**: Phase 2 (security must be in place before production load)
**Requirements**: MON-01, MON-02, MON-03, MON-04, MON-05, MON-06
**Success Criteria** (what must be TRUE):
  1. Unhandled errors appear in Sentry dashboard within 1 minute
  2. Cron job executions logged with structured data (start time, duration, messages sent)
  3. Prayer reminders sent to all eligible subscribers within 5-minute window
  4. WhatsApp messages sent concurrently in batches (not sequentially blocking)
  5. Prayer times fetched from cache instead of API on each cron run
**Plans**: TBD

Plans:
- [ ] 03-01: Integrate Sentry and add structured logging
- [ ] 03-02: Fix reminder window and implement concurrent sending
- [ ] 03-03: Add caching and batch database operations

### Phase 4: Message Scheduling
**Goal**: Admin can schedule announcements for future delivery
**Depends on**: Phase 3 (reliability must be solid for scheduled messages)
**Requirements**: SCHED-01, SCHED-02, SCHED-03, SCHED-04
**Success Criteria** (what must be TRUE):
  1. Admin can create announcement with future date/time and see it in pending list
  2. Scheduled messages automatically send at their scheduled time (within 5 min accuracy)
  3. Admin can preview and edit scheduled messages before they send
  4. Scheduled message history shows sent/pending status
**Plans**: TBD

Plans:
- [ ] 04-01: Add scheduling database schema and cron integration
- [ ] 04-02: Create scheduling UI in announcements page

### Phase 5: Bug Fixes
**Goal**: All known bugs from CONCERNS.md resolved before production
**Depends on**: Phase 4 (scheduling may reveal additional bugs)
**Requirements**: FIX-01, FIX-02, FIX-03, FIX-04
**Success Criteria** (what must be TRUE):
  1. Webhook correctly matches incoming phone numbers regardless of +27 vs 27 format
  2. Users who sent STOP can re-subscribe by sending RESUME or START
  3. Message log sent_to_count accurately reflects actual messages sent
  4. Ramadan mode uses database-configured dates, not hardcoded values
**Plans**: TBD

Plans:
- [ ] 05-01: Fix webhook and command handling bugs
- [ ] 05-02: Fix message logging and Ramadan date issues

### Phase 6: Production Deployment
**Goal**: System running on Vercel production with all integrations configured
**Depends on**: Phase 5 (all bugs fixed before production launch)
**Requirements**: DEPLOY-01, DEPLOY-02, DEPLOY-03, DEPLOY-04, DEPLOY-05, DEPLOY-06, DEPLOY-07, DEPLOY-08, DEPLOY-09
**Success Criteria** (what must be TRUE):
  1. Admin can log in at production URL with Supabase Auth credentials
  2. All environment variables set in Vercel (WhatsApp, Supabase, secrets)
  3. WhatsApp webhook receives and processes messages at production URL
  4. Cron jobs execute on schedule (verified in Vercel dashboard logs)
  5. End-to-end test passes: subscribe, receive welcome, receive prayer reminder
**Plans**: TBD

Plans:
- [ ] 06-01: Create admin user and Vercel deployment
- [ ] 06-02: Configure WhatsApp webhook and production secrets
- [ ] 06-03: End-to-end production smoke test

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. WhatsApp Templates | 0/2 | Not started | - |
| 2. Security Hardening | 0/3 | Not started | - |
| 3. Monitoring & Reliability | 0/3 | Not started | - |
| 4. Message Scheduling | 0/2 | Not started | - |
| 5. Bug Fixes | 0/2 | Not started | - |
| 6. Production Deployment | 0/3 | Not started | - |

**Total Plans:** 15
**Completed:** 0/15 (0%)

---
*Roadmap created: 2026-01-31*
*Last updated: 2026-01-31*
