# Research Summary: Masjid Notify Production Enhancements

**Domain:** WhatsApp notification system for mosque community
**Researched:** 2026-01-31
**Overall Confidence:** HIGH

---

## Executive Summary

Research focused on four key areas for production deployment: WhatsApp message templates, message scheduling, admin user management, and production deployment best practices. The findings reveal that **WhatsApp template compliance is the most critical factor** for production readiness - Meta requires pre-approved templates for all business-initiated messages, and non-compliance can result in account suspension.

The existing Masjid Notify implementation is architecturally sound but needs several production-hardening features. The current prayer reminder and announcement systems send messages directly without using WhatsApp-approved templates, which works in development but violates production requirements. The transition to templates requires planning since template approval can take up to 48 hours.

Message scheduling is a straightforward addition using the existing cron infrastructure. The recommended approach stores scheduled messages in the database with a `scheduled_at` timestamp, and the existing 5-minute cron pattern checks for due messages. This aligns with industry-standard "outbox pattern" for reliable message delivery.

Rate limiting and error monitoring are low-effort, high-impact additions that should be implemented before production launch. Sentry integration takes approximately 5 minutes with the wizard, and Upstash provides serverless-compatible rate limiting that works well with Vercel.

---

## Key Findings

**Templates:** WhatsApp requires pre-approved message templates for business-initiated messages. Prayer reminders should use "Utility" templates (free within 24-hour window). Template approval takes 1 minute to 48 hours.

**Messaging Limits:** New accounts start at 250 unique users/24 hours. Quality rating affects ability to scale - maintain high quality by respecting user preferences and handling opt-outs properly.

**Scheduling:** Use database-backed scheduling with existing cron infrastructure. Store `scheduled_at` timestamp; cron checks for due messages every 5 minutes.

**Production Security:** Rate limiting is essential for public APIs. Use Upstash or Vercel KV (not in-memory) for serverless compatibility. Sentry catches ~35% of Next.js production issues.

---

## Implications for Roadmap

Based on research, recommended phase structure:

### Phase 1: Template Compliance (Critical Path)

**Rationale:** Without approved templates, the system cannot legally send messages in production. This is a blocker for all other features.

- Create WhatsApp message templates for:
  - Prayer reminders (Utility category)
  - Ramadan notifications (Utility category)
  - Welcome messages (Utility category)
  - Announcements (Marketing or Utility based on content)
- Refactor existing message sending to use template IDs
- Submit templates for approval (allow 48+ hours buffer)

**Addresses:** WhatsApp ToS compliance, production messaging capability
**Avoids:** Account suspension, message delivery failures

### Phase 2: Production Hardening (High Priority)

**Rationale:** These are low-effort changes with high security/reliability impact.

- Implement rate limiting on `/api/subscribe` and webhook
- Add Sentry error monitoring
- Verify cron job security (CRON_SECRET validation)
- Add `force-dynamic` to cron routes

**Addresses:** Security, reliability, observability
**Avoids:** DDoS vulnerability, silent production failures

### Phase 3: Message Scheduling (Before Ramadan)

**Rationale:** Enables admin to prepare Ramadan content in advance.

- Add `scheduled_at` column or `scheduled_messages` table
- Create scheduling UI in announcements page
- Extend cron to check scheduled messages

**Addresses:** Admin convenience, prepared messaging
**Avoids:** Last-minute content creation during Ramadan

### Phase 4: Admin Enhancements (Nice-to-Have)

**Rationale:** Existing RBAC schema is sufficient; enforcement adds security.

- Implement role-based permission checks
- Add admin audit logging
- Multi-admin support

**Addresses:** Security, accountability
**Avoids:** Permission creep, lack of audit trail

---

## Phase Ordering Rationale

1. **Templates First:** Everything else depends on being able to send messages legally in production. Templates take time to approve, so start early.

2. **Production Hardening Second:** These are quick wins that significantly improve security and observability. Should be done before public launch.

3. **Scheduling Third:** Adds value for Ramadan preparation but is not a blocker. Can be done in parallel with template approval.

4. **Admin Enhancements Last:** The existing owner role works for single-admin MVP. Multi-admin and audit logging can wait until post-launch.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| WhatsApp Templates | HIGH | Verified via multiple sources including Meta business docs |
| Messaging Limits | HIGH | Consistent across all sources; official documentation confirms |
| Rate Limiting | HIGH | Well-documented patterns for Vercel/Next.js |
| Scheduling Architecture | MEDIUM | Standard patterns; specific implementation needs validation |
| Error Monitoring | HIGH | Official Sentry documentation; proven tooling |

---

## Gaps to Address

1. **Template Testing:** Need to actually submit test templates and verify approval process. Research describes requirements but real-world approval may have additional friction.

2. **South Africa Pricing:** WhatsApp pricing varies by country. Need to verify exact per-message costs for South African phone numbers (+27).

3. **Ramadan Mode Integration:** Need to verify how template system works with dynamic Ramadan timing (Suhoor/Iftar times change daily).

4. **Quality Rating Monitoring:** Need to understand how to monitor quality rating via Meta dashboard or API.

---

## Research Files Created

| File | Purpose |
|------|---------|
| `.planning/research/SUMMARY.md` | This file - executive summary with roadmap implications |
| `.planning/research/FEATURES.md` | Complete feature landscape (table stakes, differentiators, anti-features) |

---

## Ready for Roadmap

Research complete. Key recommendations:

1. **Start template submission immediately** - 48-hour approval buffer needed
2. **Rate limiting + Sentry are quick wins** - implement in first sprint
3. **Scheduling fits naturally** - uses existing cron infrastructure
4. **Current architecture is sound** - enhancements are additive, not refactoring

Proceeding to roadmap creation with feature priorities established.
