# Requirements: Masjid Notify

**Defined:** 2026-01-31
**Core Value:** Subscribers receive timely prayer reminders via WhatsApp without installing an app

## v1 Requirements

Requirements for production deployment. Each maps to roadmap phases.

### WhatsApp Templates (Critical Path)

- [ ] **TMPL-01**: Create prayer reminder template (Utility category) for all 5 prayers
- [ ] **TMPL-02**: Create welcome message template for new subscribers
- [ ] **TMPL-03**: Create Ramadan reminder templates (Suhoor, Iftar, Taraweeh)
- [ ] **TMPL-04**: Create announcement template for admin broadcasts
- [ ] **TMPL-05**: Create Jumu'ah reminder template
- [ ] **TMPL-06**: Create hadith template for daily hadith messages
- [ ] **TMPL-07**: Refactor message sending to use template IDs instead of freeform text
- [ ] **TMPL-08**: Submit templates to Meta for approval

### Security

- [ ] **SEC-01**: Implement rate limiting on /api/subscribe endpoint (10 req/min per IP)
- [ ] **SEC-02**: Implement rate limiting on /api/webhook/whatsapp endpoint
- [ ] **SEC-03**: Add WhatsApp webhook signature verification (X-Hub-Signature-256)
- [ ] **SEC-04**: Add server-side authentication to admin API routes
- [ ] **SEC-05**: Fix settings token persistence (store token in database)
- [ ] **SEC-06**: Use constant-time comparison for CRON_SECRET
- [ ] **SEC-07**: Normalize phone number format for consistent lookup

### Monitoring & Reliability

- [ ] **MON-01**: Integrate Sentry for error tracking
- [ ] **MON-02**: Add structured logging for cron job execution
- [ ] **MON-03**: Fix prayer time reminder window (5 min instead of 2 min)
- [ ] **MON-04**: Implement concurrent message sending with batching
- [ ] **MON-05**: Add prayer times caching (avoid API calls each cron run)
- [ ] **MON-06**: Batch subscriber updates instead of N+1 queries

### Message Scheduling

- [ ] **SCHED-01**: Add scheduled_messages table or scheduled_at column
- [ ] **SCHED-02**: Create scheduling UI in announcements page
- [ ] **SCHED-03**: Extend cron to check for scheduled messages
- [ ] **SCHED-04**: Add scheduled message preview and edit

### Production Deployment

- [ ] **DEPLOY-01**: Create admin user in Supabase Auth
- [ ] **DEPLOY-02**: Link admin user to admins table with owner role
- [ ] **DEPLOY-03**: Deploy to Vercel with production configuration
- [ ] **DEPLOY-04**: Set all environment variables in Vercel dashboard
- [ ] **DEPLOY-05**: Configure WhatsApp webhook URL in Meta Developer Console
- [ ] **DEPLOY-06**: Generate production CRON_SECRET
- [ ] **DEPLOY-07**: Generate production WHATSAPP_WEBHOOK_VERIFY_TOKEN
- [ ] **DEPLOY-08**: Add force-dynamic to cron routes
- [ ] **DEPLOY-09**: End-to-end production smoke test

### Bug Fixes

- [ ] **FIX-01**: Fix webhook phone number format mismatch
- [ ] **FIX-02**: Fix RESUME/START command for unsubscribed users
- [ ] **FIX-03**: Fix message log sent_to_count accumulation bug
- [ ] **FIX-04**: Remove hardcoded Ramadan 2025 dates in isRamadanSeason()

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Delivery Analytics

- **DELIV-01**: Track message delivery status via WhatsApp webhooks
- **DELIV-02**: Track message read status
- **DELIV-03**: Dashboard for delivery analytics

### Multi-Admin

- **ADMIN-01**: Implement role-based permission checks
- **ADMIN-02**: Add admin audit logging
- **ADMIN-03**: Admin invitation flow

### Enhanced Features

- **ENH-01**: Multi-language support (Arabic/Afrikaans)
- **ENH-02**: Embeddable prayer time widget
- **ENH-03**: Custom reminder offsets per subscriber

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Multi-mosque support | MVP is single mosque; adds tenant isolation complexity |
| Mobile app | Web-first; WhatsApp IS the mobile interface |
| Donation integration | Not core to notification value |
| Real-time chat | High complexity; not needed for notifications |
| Video content | Storage/bandwidth costs; text is sufficient |
| Event calendar | Announcements cover this use case |
| OAuth login | Email/password sufficient for single admin |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| TMPL-01 | Phase 1 | Pending |
| TMPL-02 | Phase 1 | Pending |
| TMPL-03 | Phase 1 | Pending |
| TMPL-04 | Phase 1 | Pending |
| TMPL-05 | Phase 1 | Pending |
| TMPL-06 | Phase 1 | Pending |
| TMPL-07 | Phase 1 | Pending |
| TMPL-08 | Phase 1 | Pending |
| SEC-01 | Phase 2 | Pending |
| SEC-02 | Phase 2 | Pending |
| SEC-03 | Phase 2 | Pending |
| SEC-04 | Phase 2 | Pending |
| SEC-05 | Phase 2 | Pending |
| SEC-06 | Phase 2 | Pending |
| SEC-07 | Phase 2 | Pending |
| MON-01 | Phase 3 | Pending |
| MON-02 | Phase 3 | Pending |
| MON-03 | Phase 3 | Pending |
| MON-04 | Phase 3 | Pending |
| MON-05 | Phase 3 | Pending |
| MON-06 | Phase 3 | Pending |
| SCHED-01 | Phase 4 | Pending |
| SCHED-02 | Phase 4 | Pending |
| SCHED-03 | Phase 4 | Pending |
| SCHED-04 | Phase 4 | Pending |
| FIX-01 | Phase 5 | Pending |
| FIX-02 | Phase 5 | Pending |
| FIX-03 | Phase 5 | Pending |
| FIX-04 | Phase 5 | Pending |
| DEPLOY-01 | Phase 6 | Pending |
| DEPLOY-02 | Phase 6 | Pending |
| DEPLOY-03 | Phase 6 | Pending |
| DEPLOY-04 | Phase 6 | Pending |
| DEPLOY-05 | Phase 6 | Pending |
| DEPLOY-06 | Phase 6 | Pending |
| DEPLOY-07 | Phase 6 | Pending |
| DEPLOY-08 | Phase 6 | Pending |
| DEPLOY-09 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 37 total
- Mapped to phases: 37
- Unmapped: 0 ✓

---
*Requirements defined: 2026-01-31*
*Last updated: 2026-01-31 after initial definition*
