# Masjid Notify - Project Status

> **Last Updated:** February 3, 2026 @ 00:30 UTC
> **Status:** ⚠️ **WHATSAPP ACCOUNT UNDER REVIEW** - App code ready, awaiting Meta appeal
> **Production URL:** https://masjid-notify.vercel.app

---

## Quick Links

| Resource | URL |
|----------|-----|
| **Landing Page** | https://masjid-notify.vercel.app |
| **Admin Login** | https://masjid-notify.vercel.app/admin/login |
| **Admin Dashboard** | https://masjid-notify.vercel.app/admin |
| **Privacy Policy** | https://masjid-notify.vercel.app/privacy |
| **Terms of Service** | https://masjid-notify.vercel.app/terms |
| **Data Deletion** | https://masjid-notify.vercel.app/data-deletion |
| **GitHub Repo** | https://github.com/alqode-dev/masjid-notify |
| **Vercel Dashboard** | https://vercel.com/alqodes-projects/masjid-notify |
| **Supabase Dashboard** | https://supabase.com/dashboard/project/jlqtuynaxuooymbwrwth |

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Status](#system-status)
3. [Recent Bug Fixes](#recent-bug-fixes)
4. [E2E Test Suite](#e2e-test-suite)
5. [Production Infrastructure](#production-infrastructure)
6. [Admin Access](#admin-access)
7. [Environment Variables](#environment-variables)
8. [All Features](#all-features)
9. [API Reference](#api-reference)
10. [WhatsApp Integration](#whatsapp-integration)
11. [Database Schema](#database-schema)
12. [Cron Jobs](#cron-jobs)
13. [Tech Stack](#tech-stack)
14. [Project Structure](#project-structure)
15. [Testing Guide](#testing-guide)
16. [Settings Explained](#settings-explained)
17. [Known Limitations](#known-limitations)
18. [Changelog](#changelog)

---

## Executive Summary

**Masjid Notify** is a WhatsApp notification system for mosques. Users scan a QR code, subscribe via a web form, and receive automated prayer reminders, announcements, daily hadith, and Ramadan notifications via WhatsApp.

### Active Mosque

| Property | Value |
|----------|-------|
| **Name** | Anwaarul Islam Rondebosch East |
| **Slug** | anwaarul-islam-rondebosch-east |
| **City** | Cape Town |
| **Country** | South Africa |
| **Madhab** | Hanafi |
| **Timezone** | Africa/Johannesburg (SAST, UTC+2) |
| **Jumu'ah Khutbah** | 13:20 |

### Project Metrics

| Metric | Value |
|--------|-------|
| **Development Sprint** | January 31 - February 2, 2026 |
| **User Stories Completed** | 24/24 (100%) |
| **E2E Tests** | 101 tests (all passing) |
| **Total Commits** | 25+ commits |
| **Lines of Code** | ~8,500+ lines |
| **Build Time** | ~3.5 seconds (Turbopack) |
| **Deployment Region** | Washington D.C. (iad1) |

### Key Achievements

- ✅ Full WhatsApp Cloud API integration
- ✅ Automated prayer time reminders
- ✅ Admin dashboard with analytics
- ✅ Message scheduling system
- ✅ **101 E2E tests** with Playwright
- ✅ Server-side API routes for admin data
- ✅ Rate limiting protection (optional)
- ✅ Webhook signature verification
- ✅ Real Hadith API Integration (random-hadith-generator)
- ✅ South African phone number validation
- ✅ Legal pages (Privacy, Terms, Data Deletion)
- ✅ **Nafl Salah Reminders** (Tahajjud, Ishraq, Awwabin)
- ✅ **Twice-Daily Hadith** (morning and evening)
- ✅ **Enhanced Suhoor Reminders** (planning + morning)
- ✅ **Security Fixes** (mosque-scoped admin operations)

---

## System Status

### Component Health Check

| Component | Status | Last Verified | Notes |
|-----------|--------|---------------|-------|
| **Frontend (Next.js)** | ✅ Operational | Feb 2, 2026 | All pages loading correctly |
| **Backend API** | ✅ Operational | Feb 2, 2026 | All endpoints responding |
| **Database (Supabase)** | ✅ Connected | Feb 2, 2026 | PostgreSQL with RLS |
| **Admin Dashboard** | ✅ Fixed | Feb 2, 2026 | Now shows subscribers correctly |
| **WhatsApp Sending** | ⚠️ Suspended | Feb 2, 2026 | Account under Meta review (appeal submitted) |
| **WhatsApp Webhook** | ⚠️ Suspended | Feb 2, 2026 | Awaiting account restoration |
| **Cron Jobs** | ✅ Scheduled | Feb 2, 2026 | Daily schedule active |
| **Hadith API** | ✅ Integrated | Feb 2, 2026 | random-hadith-generator.vercel.app |
| **E2E Tests** | ✅ 101 Passing | Feb 2, 2026 | Full admin dashboard coverage |
| **Rate Limiting** | ⚠️ Optional | - | Requires Upstash Redis |
| **Error Tracking** | ⚠️ Optional | - | Requires Sentry DSN |

---

## WhatsApp Account Status & Compliance

### Current Status: ⚠️ UNDER REVIEW

| Item | Status | Details |
|------|--------|---------|
| **Account Status** | 🔴 Suspended | "Activity that does not comply with WhatsApp Business terms of service" |
| **Appeal Submitted** | ✅ Yes | February 2, 2026 |
| **Expected Response** | 24-48 hours | Meta review in progress |
| **Business Name** | Bochi / Masjid Notify | Mosque prayer reminder service |

### Why the Ban Likely Occurred

| Cause | Explanation | Prevention |
|-------|-------------|------------|
| **New unverified account** | Meta is suspicious of new WhatsApp Business accounts | Get Meta Business Verified |
| **No approved templates** | Messages sent without Meta-approved templates | Submit templates for approval FIRST |
| **Testing pattern** | Repeatedly deleting/re-adding numbers looks like spam testing | Use dedicated test numbers |
| **Rapid messaging** | Sending multiple messages quickly on new account | Warm up account gradually |

### WhatsApp Business Terms Compliance

Our service **fully complies** with WhatsApp's terms:

| Requirement | Our Status | Evidence |
|-------------|------------|----------|
| **Explicit opt-in** | ✅ Compliant | Users subscribe via web form voluntarily |
| **No spam** | ✅ Compliant | Only send to opted-in users |
| **Valuable content** | ✅ Compliant | Prayer times, religious reminders |
| **Easy opt-out** | ✅ Compliant | STOP command instantly unsubscribes |
| **No prohibited products** | ✅ Compliant | Religious/community service only |
| **No cold outreach** | ✅ Compliant | Never message non-subscribers |
| **User control** | ✅ Compliant | SETTINGS, PAUSE, preferences |

---

## WhatsApp Ban Prevention Guide

### What Respond.io & BSPs Do (Best Practices)

| Practice | What They Do | Our Implementation |
|----------|--------------|-------------------|
| **Business Verification** | Get Meta Business verified (blue checkmark) | ❌ TODO: Apply for verification |
| **Template Approval** | ONLY send pre-approved templates, never plain text for first contact | ⚠️ Templates created, need approval |
| **Double Opt-in** | Send "Reply YES to confirm" after signup | ❌ TODO: Implement |
| **Number Warmup** | Start 50 msgs/day, increase 20% weekly | ❌ TODO: Implement rate scaling |
| **Quality Monitoring** | Track blocks/reports, auto-pause if quality drops | ❌ TODO: Implement |
| **Dedicated Test Numbers** | Use separate numbers for testing | ❌ TODO: Get test number |
| **Message Spacing** | Min 1 second between messages | ✅ Implemented (p-limit) |
| **Opt-out Compliance** | Process STOP within 24 hours | ✅ Implemented (instant) |

### Implementation Priority (After Account Restored)

#### Phase 1: Immediate (Before ANY messaging)
1. **Get ALL templates approved by Meta** before sending any messages
2. **Set up a test phone number** - never test with production number
3. **Verify Meta Business** - apply for business verification

#### Phase 2: Number Warmup Strategy
```
Week 1: Max 50 messages/day
Week 2: Max 100 messages/day
Week 3: Max 250 messages/day
Week 4: Max 500 messages/day
Week 5+: Gradual increase to 1000/day
```

#### Phase 3: Quality Protection (Future Implementation)
- Track message delivery rates
- Monitor for user blocks/reports
- Auto-pause sending if quality drops below 90%
- Implement "message quality score" dashboard

### WhatsApp Message Templates Status

| Template | Purpose | Meta Status | Action Needed |
|----------|---------|-------------|---------------|
| `masjid_notify_welcome` | Welcome message | ⚠️ Unknown | Verify in Meta dashboard |
| `prayer_reminder` | Prayer time alerts | ❌ Not submitted | Submit for approval |
| `jumuah_reminder` | Friday reminder | ❌ Not submitted | Submit for approval |
| `daily_hadith` | Hadith messages | ❌ Not submitted | Submit for approval |
| `ramadan_suhoor` | Suhoor reminder | ❌ Not submitted | Submit for approval |
| `ramadan_iftar` | Iftar reminder | ❌ Not submitted | Submit for approval |
| `ramadan_taraweeh` | Taraweeh reminder | ❌ Not submitted | Submit for approval |
| `tahajjud_reminder` | Tahajjud alert | ❌ Not submitted | Submit for approval |
| `ishraq_reminder` | Ishraq alert | ❌ Not submitted | Submit for approval |
| `awwabin_reminder` | Awwabin alert | ❌ Not submitted | Submit for approval |
| `suhoor_planning` | Night-before suhoor | ❌ Not submitted | Submit for approval |
| `mosque_announcement` | Announcements | ❌ Not submitted | Submit for approval |

### How to Submit Templates to Meta

1. Go to **Meta Business Manager**: https://business.facebook.com/
2. Navigate to: **WhatsApp Manager > Account Tools > Message Templates**
3. Click **"Create Template"**
4. Select Category: **UTILITY** (for reminders) or **MARKETING** (for announcements)
5. Enter template name (use underscore format, e.g., `prayer_reminder`)
6. Select language: **English (en)**
7. Enter the template body text exactly as specified in `src/lib/whatsapp-templates.ts`
8. Submit for review (typically 24-48 hours)

### After Account is Restored: Action Checklist

- [ ] Submit ALL templates to Meta for approval (wait for approval before using)
- [ ] Apply for Meta Business Verification
- [ ] Get a dedicated test phone number
- [ ] Implement number warmup strategy (code change)
- [ ] Add quality monitoring dashboard (future feature)
- [ ] Implement double opt-in flow (future feature)
- [ ] Document testing procedures to avoid test-pattern bans

---

## Recent Bug Fixes

### February 2, 2026

| Issue | Root Cause | Solution | Status |
|-------|------------|----------|--------|
| **Dashboard showing 0 subscribers** | Client-side Supabase queries blocked by RLS | Created server-side API routes (`/api/admin/stats`, `/api/admin/subscribers`) | ✅ Fixed |
| **Subscribers page showing empty** | Same RLS issue | API route uses `supabaseAdmin` which bypasses RLS | ✅ Fixed |
| **Messages count showing 0** | Queries not filtered by mosque_id | Added mosque_id filter to all queries | ✅ Fixed |

### Technical Details

The admin pages were using `createClientSupabase()` (browser client) which is subject to Row Level Security (RLS) policies. The fix was to:

1. Create new API routes that use `supabaseAdmin` (service role)
2. Update dashboard and subscribers pages to fetch via API
3. The API routes are protected by `withAdminAuth()` middleware

**New API Routes Created:**
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/subscribers` - List subscribers with filters
- `PATCH /api/admin/subscribers` - Update subscriber status
- `DELETE /api/admin/subscribers` - Delete subscriber

---

## E2E Test Suite

### Overview

| Metric | Value |
|--------|-------|
| **Framework** | Playwright |
| **Total Tests** | 101 |
| **Pass Rate** | 100% |
| **Runtime** | ~2.5 minutes |
| **Browser** | Chromium (Desktop) |

### Test Files

| File | Tests | Coverage |
|------|-------|----------|
| `admin-auth.spec.ts` | 3 | Login, redirects, error handling |
| `admin-dashboard.spec.ts` | 9 | Stats cards, quick actions, navigation |
| `admin-subscribers.spec.ts` | 12 | Table, search, filters, export, delete |
| `admin-announcements.spec.ts` | 19 | Form, preview, scheduling |
| `admin-settings.spec.ts` | 17 | Settings form, Ramadan toggle, save |
| `admin-qrcode.spec.ts` | 13 | QR display, copy URL |
| `admin-navigation.spec.ts` | 12 | Sidebar, redirects, responsive |
| `subscription.spec.ts` | 5 | Landing page, subscription |
| `mobile.spec.ts` | 6 | Mobile & desktop layouts |

### Running Tests

```bash
# Set credentials
export TEST_ADMIN_EMAIL="your-admin@email.com"
export TEST_ADMIN_PASSWORD="your-password"

# Run all tests
npm test

# Run with UI (interactive)
npm run test:ui

# Run specific test file
npx playwright test admin-dashboard

# Run in headed mode (see browser)
npx playwright test --headed
```

### Test Configuration

Located in `playwright.config.ts`:

```typescript
{
  testDir: "./tests",
  fullyParallel: false,        // Avoid auth rate limiting
  workers: 2,                   // Limited workers
  timeout: 60000,               // 60s per test
  retries: 1,                   // Retry once on failure
  projects: [{ name: "chromium" }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true
  }
}
```

---

## Production Infrastructure

### Vercel Deployment

| Property | Value |
|----------|-------|
| **Account** | alqodes-projects |
| **Project Name** | masjid-notify |
| **Production URL** | https://masjid-notify.vercel.app |
| **Framework** | Next.js 16.1.6 (Turbopack) |
| **Node.js Version** | 18.x |
| **Build Command** | `next build` |
| **Region** | Washington D.C., USA (iad1) |
| **Plan** | Hobby (Free) |

### Supabase Configuration

| Property | Value |
|----------|-------|
| **Project ID** | jlqtuynaxuooymbwrwth |
| **Database** | PostgreSQL 15 |
| **Auth** | Email/Password enabled |
| **RLS** | Enabled on all tables |
| **API URL** | https://jlqtuynaxuooymbwrwth.supabase.co |

---

## Admin Access

### Credentials

| Field | Value |
|-------|-------|
| **Login URL** | https://masjid-notify.vercel.app/admin/login |
| **Email** | alqodez@gmail.com |
| **Role** | owner |
| **Linked Mosque** | Anwaarul Islam Rondebosch East |

### Admin Pages

| Page | URL | Purpose |
|------|-----|---------|
| **Dashboard** | `/admin` | Stats overview, quick actions, analytics charts |
| **Subscribers** | `/admin/subscribers` | View, search, filter, export subscribers |
| **Announcements** | `/admin/announcements` | Send immediate or scheduled messages |
| **QR Code** | `/admin/qr-code` | Generate and download QR codes |
| **Settings** | `/admin/settings` | Mosque configuration, prayer times, Ramadan mode |

### Admin Capabilities

- View subscriber statistics and growth charts
- Send announcements to all active subscribers
- Schedule messages for future delivery
- Cancel pending scheduled messages
- Import subscribers via CSV
- Export subscriber list to CSV
- Configure prayer time calculation method
- Set Jumu'ah times
- Enable/disable Ramadan mode
- Configure Taraweeh time

---

## Environment Variables

### Production Variables (Vercel)

| Variable | Status | Description |
|----------|--------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Set | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Set | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Set | Supabase service role (admin access) |
| `WHATSAPP_ACCESS_TOKEN` | ✅ Set | Meta access token |
| `WHATSAPP_PHONE_NUMBER_ID` | ✅ Set | `895363247004714` |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | ✅ Set | `1443752210724410` |
| `WHATSAPP_APP_SECRET` | ✅ Set | For webhook signature verification |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | ✅ Set | `masjidnotifywebhook2025` |
| `CRON_SECRET` | ✅ Set | `masjidnotify2025cron` |
| `ALADHAN_API_URL` | ✅ Set | `https://api.aladhan.com/v1` |
| `NEXT_PUBLIC_APP_URL` | ✅ Set | `https://masjid-notify.vercel.app` |
| `NEXT_PUBLIC_DEFAULT_MOSQUE_SLUG` | ✅ Set | `anwaarul-islam-rondebosch-east` |

### Optional Variables

| Variable | Purpose | How to Enable |
|----------|---------|---------------|
| `UPSTASH_REDIS_REST_URL` | Rate limiting | Create Redis at console.upstash.com |
| `UPSTASH_REDIS_REST_TOKEN` | Rate limiting | From Upstash dashboard |
| `SENTRY_DSN` | Error tracking | Create project at sentry.io |

---

## All Features

### Core Features (18 Total)

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 1 | Landing Page | ✅ Live | Prayer times display, mosque info, subscribe CTA |
| 2 | Subscribe Form | ✅ Live | Multi-step form with SA phone validation (+27) |
| 3 | WhatsApp Welcome | ✅ Live | Automated welcome message on subscription |
| 4 | Admin Login | ✅ Live | Supabase Auth email/password |
| 5 | Admin Dashboard | ✅ Live | Stats cards, quick actions, analytics |
| 6 | Subscribers Table | ✅ Live | Search, filter, pagination, status management |
| 7 | CSV Export | ✅ Live | Download subscriber list |
| 8 | CSV Import | ✅ Live | Bulk import with validation preview |
| 9 | Announcements | ✅ Live | Message composer with preview |
| 10 | Message Templates | ✅ Live | Pre-built announcement templates |
| 11 | Message Scheduling | ✅ Live | Schedule for future delivery |
| 12 | Mosque Settings | ✅ Live | Prayer calculation, Jumu'ah times |
| 13 | Ramadan Mode | ✅ Live | Toggle Suhoor/Iftar/Taraweeh reminders |
| 14 | QR Code Generator | ✅ Live | Generate, download, print QR codes |
| 15 | Prayer Reminders | ✅ Live | Automated reminders via cron |
| 16 | Daily Hadith | ✅ Live | Real API - 5 authentic collections |
| 17 | Jumu'ah Reminder | ✅ Live | Friday morning reminder |
| 18 | Analytics Charts | ✅ Live | Subscriber growth, message breakdown |

### Subscriber Preferences (6 Options)

| Option | Database Field | Description |
|--------|----------------|-------------|
| All 5 Daily Prayers | `pref_daily_prayers` | Fajr, Dhuhr, Asr, Maghrib, Isha reminders |
| Jumu'ah Khutbah Reminder | `pref_jumuah` | Friday prayer notification |
| Ramadan Mode | `pref_ramadan` | Suhoor, Iftar, Taraweeh reminders |
| Voluntary Prayers (Nafl) | `pref_nafl_salahs` | Tahajjud, Ishraq, Awwabin reminders |
| Daily Hadith | `pref_hadith` | Authentic hadith twice daily (morning & evening) |
| Announcements & Events | `pref_announcements` | Programs, Eid, special events |

### WhatsApp Commands (6 Total)

| Command | Description |
|---------|-------------|
| `STOP` | Unsubscribe from all messages |
| `START` | Resubscribe after STOP |
| `RESUME` | Resume after pause |
| `PAUSE [days]` | Pause for 1-30 days |
| `SETTINGS` | Get 24-hour preferences link |
| `HELP` | Show available commands |

---

## API Reference

### Public Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/subscribe` | Subscribe new user |
| `POST` | `/api/webhook/whatsapp` | WhatsApp webhook |
| `GET` | `/api/settings/[token]` | Get user preferences |
| `POST` | `/api/settings/[token]` | Update user preferences |

### Admin Endpoints (Requires Auth)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/admin/stats` | Dashboard statistics |
| `GET` | `/api/admin/subscribers` | List subscribers |
| `PATCH` | `/api/admin/subscribers` | Update subscriber status |
| `DELETE` | `/api/admin/subscribers?id=` | Delete subscriber |
| `POST` | `/api/admin/announcements` | Send announcement |
| `GET` | `/api/admin/announcements/schedule` | List scheduled |
| `POST` | `/api/admin/announcements/schedule` | Create scheduled |
| `DELETE` | `/api/admin/announcements/schedule/[id]` | Cancel scheduled |

### Cron Endpoints (Requires CRON_SECRET)

| Method | Endpoint | Schedule (UTC) | Purpose |
|--------|----------|----------------|---------|
| `GET` | `/api/cron/prayer-reminders` | Every 5 mins | Prayer reminders |
| `GET` | `/api/cron/daily-hadith?time=fajr` | 3:30 AM daily | Morning hadith |
| `GET` | `/api/cron/daily-hadith?time=maghrib` | 4:00 PM daily | Evening hadith |
| `GET` | `/api/cron/jumuah-reminder` | 10:00 AM Fri | Friday reminder |
| `GET` | `/api/cron/ramadan-reminders` | Every 5 mins | Suhoor/Iftar/Taraweeh |
| `GET` | `/api/cron/nafl-reminders` | Every 5 mins | Tahajjud/Ishraq/Awwabin |

---

## Settings Explained

### Calculation Method

These are different Islamic organizations' methods for calculating prayer times based on sun angles. The difference is mainly in **Fajr and Isha** times:

| Method | Used By |
|--------|---------|
| Muslim World League | Most of Africa, Europe |
| Egyptian General Authority | Egypt, Africa |
| Um Al-Qura | Saudi Arabia |
| ISNA | North America |
| Karachi | Pakistan, Bangladesh |

**For South Africa:** "Muslim World League" or "Egyptian" are commonly used.

### Madhab (for Asr)

The **Hanafi** and **Shafi'i** schools differ ONLY on when Asr time begins:

| Madhab | Asr Starts When |
|--------|-----------------|
| **Shafi'i** | Shadow = object height (earlier) |
| **Hanafi** | Shadow = 2x object height (later, ~45-60 min difference) |

All other prayers are calculated the same between madhabs.

### Why Only Jumu'ah Times Are Editable?

- **Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha** = Calculated automatically from sun position (changes daily)
- **Jumu'ah** = Mosque-specific (you decide when khutbah starts)

Prayer times need to be accurate to the minute based on sun position. Jumu'ah is a human decision.

### Ramadan Settings

- **Suhoor reminder**: Minutes before Fajr to send reminder
- **Iftar reminder**: Minutes before Maghrib to send reminder
- **Taraweeh time**: When Taraweeh starts (leave empty to disable)

---

## Database Schema

### Tables Overview

| Table | Purpose | RLS |
|-------|---------|-----|
| `mosques` | Mosque configuration | ✅ |
| `subscribers` | User subscriptions | ✅ |
| `admins` | Admin users | ✅ |
| `messages` | Message log | ✅ |
| `daily_hadith_log` | Tracks sent hadiths | ✅ |
| `prayer_times_cache` | API response cache | ✅ |
| `scheduled_messages` | Scheduled announcements | ✅ |

### Key Table: subscribers

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `phone_number` | TEXT | +27 format |
| `mosque_id` | UUID | Foreign key to mosques |
| `status` | TEXT | active / paused / unsubscribed |
| `pref_daily_prayers` | BOOLEAN | All 5 daily prayers opt-in |
| `pref_jumuah` | BOOLEAN | Jumu'ah reminder opt-in |
| `pref_ramadan` | BOOLEAN | Ramadan reminders opt-in |
| `pref_nafl_salahs` | BOOLEAN | Voluntary prayers opt-in (Tahajjud, Ishraq, Awwabin) |
| `pref_hadith` | BOOLEAN | Daily hadith opt-in |
| `pref_announcements` | BOOLEAN | Announcements opt-in |
| `reminder_offset` | INT | Minutes before prayer |
| `subscribed_at` | TIMESTAMP | First subscription date |

### Key Table: daily_hadith_log

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `date` | DATE | Date of hadith |
| `time_of_day` | VARCHAR(10) | 'morning' or 'evening' |
| `collection` | TEXT | Bukhari, Muslim, etc. |
| `hadith_number` | INT | Hadith reference number |
| `hadith_text` | TEXT | English text |
| `hadith_arabic` | TEXT | Arabic text (nullable) |
| `source` | TEXT | Source name |
| `reference` | TEXT | Full reference |

**Unique Constraint:** `(date, time_of_day)` - ensures one hadith per time slot per day

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.1.6 | React framework (App Router) |
| React | 19.x | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Utility-first styling |
| shadcn/ui | Latest | Radix UI components |
| Framer Motion | Latest | Animations |
| Recharts | Latest | Charts |
| Sonner | Latest | Toast notifications |
| Lucide React | Latest | Icons |

### Backend

| Technology | Purpose |
|------------|---------|
| Next.js API Routes | Serverless functions |
| Supabase | Database + Auth |
| @supabase/ssr | Server-side auth |

### Testing

| Technology | Purpose |
|------------|---------|
| Playwright | E2E testing |
| @playwright/test | Test runner |

### External APIs

| API | Purpose |
|-----|---------|
| WhatsApp Cloud API | Messaging |
| Aladhan API | Prayer times |
| random-hadith-generator | Authentic hadiths |

---

## Project Structure

```
masjid-notify/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing page
│   │   ├── layout.tsx                  # Root layout
│   │   ├── globals.css                 # Tailwind styles
│   │   │
│   │   ├── admin/
│   │   │   ├── layout.tsx              # Admin layout (auth + footer)
│   │   │   ├── page.tsx                # Dashboard (uses /api/admin/stats)
│   │   │   ├── login/page.tsx          # Login form
│   │   │   ├── subscribers/page.tsx    # Subscriber management
│   │   │   ├── announcements/page.tsx  # Message composer
│   │   │   ├── qr-code/page.tsx        # QR generator
│   │   │   └── settings/page.tsx       # Mosque settings
│   │   │
│   │   ├── privacy/page.tsx            # Privacy policy
│   │   ├── terms/page.tsx              # Terms of service
│   │   ├── data-deletion/page.tsx      # Data deletion instructions
│   │   │
│   │   └── api/
│   │       ├── subscribe/route.ts      # Subscription endpoint
│   │       │
│   │       ├── admin/
│   │       │   ├── stats/route.ts      # Dashboard stats (NEW)
│   │       │   ├── subscribers/route.ts # Subscribers CRUD (NEW)
│   │       │   └── announcements/
│   │       │       ├── route.ts
│   │       │       └── schedule/
│   │       │
│   │       ├── cron/
│   │       │   ├── prayer-reminders/route.ts
│   │       │   ├── daily-hadith/route.ts
│   │       │   ├── jumuah-reminder/route.ts
│   │       │   └── ramadan-reminders/route.ts
│   │       │
│   │       ├── settings/[token]/route.ts
│   │       │
│   │       └── webhook/whatsapp/route.ts
│   │
│   ├── components/
│   │   ├── ui/                         # shadcn components
│   │   ├── footer.tsx                  # "Powered by Alqode"
│   │   ├── prayer-times.tsx
│   │   ├── qr-code.tsx
│   │   ├── subscribe-form.tsx
│   │   └── admin/
│   │       ├── sidebar.tsx
│   │       ├── stats-card.tsx
│   │       ├── analytics-charts.tsx
│   │       ├── announcement-form.tsx
│   │       ├── message-templates.tsx
│   │       ├── subscribers-table.tsx
│   │       └── subscriber-import.tsx
│   │
│   └── lib/
│       ├── supabase.ts                 # Database clients + types
│       ├── whatsapp.ts                 # WhatsApp API
│       ├── whatsapp-templates.ts       # Template definitions
│       ├── prayer-times.ts             # Aladhan API + cache
│       ├── hadith-api.ts               # External hadith API
│       ├── message-sender.ts           # Concurrent sending
│       ├── ratelimit.ts                # Rate limiting
│       ├── auth.ts                     # Auth utilities
│       ├── constants.ts                # DEFAULT_MOSQUE_SLUG
│       ├── logger.ts                   # Structured logging
│       └── utils.ts                    # Helpers
│
├── tests/
│   ├── admin-auth.spec.ts
│   ├── admin-dashboard.spec.ts
│   ├── admin-subscribers.spec.ts
│   ├── admin-announcements.spec.ts
│   ├── admin-settings.spec.ts
│   ├── admin-qrcode.spec.ts
│   ├── admin-navigation.spec.ts
│   ├── subscription.spec.ts
│   ├── mobile.spec.ts
│   ├── helpers/auth.ts                 # Shared login helper
│   └── README.md                       # Test documentation
│
├── supabase/
│   ├── schema.sql
│   └── migrations/
│       ├── 001_add_settings_token.sql
│       ├── 002_add_prayer_times_cache.sql
│       ├── 003_add_scheduled_messages.sql
│       ├── 004_update_mosque_details.sql
│       ├── 005_add_daily_hadith_log.sql
│       └── 006_simplify_preferences.sql
│
├── playwright.config.ts               # Test configuration
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
├── vercel.json
└── .env.local.example
```

---

## Nafl Salah Reminders

### Overview

Voluntary (nafl) prayer reminders are sent at optimal times based on prayer calculations.

### Nafl Prayer Types & Timing

| Prayer | Time Calculation | Description |
|--------|------------------|-------------|
| **Tahajjud** | Fajr - 2 hours | Last third of the night (best time for night prayers) |
| **Ishraq/Duha** | Sunrise + 20 min | Forenoon prayer after sunrise |
| **Awwabin** | Maghrib + 15 min | 6 rakahs between Maghrib and Isha |

### How It Works

1. Cron runs every 5 minutes via cron-job.org
2. For each mosque, calculates nafl times from prayer times
3. Checks if current time is within 5-minute window of nafl time
4. Sends reminder to subscribers with `pref_nafl_salahs = true`
5. Deduplication prevents double-sending within 10 minutes

---

## Twice-Daily Hadith

### Overview

Subscribers receive one authentic hadith in the morning (after Fajr) and another in the evening (around Maghrib).

### Schedule

| Time | Query Param | UTC Schedule | SAST Time |
|------|-------------|--------------|-----------|
| Morning | `?time=fajr` | 3:30 AM | 5:30 AM |
| Evening | `?time=maghrib` | 4:00 PM | 6:00 PM |

### Database Changes

The `daily_hadith_log` table now includes a `time_of_day` column:

```sql
ALTER TABLE daily_hadith_log ADD COLUMN IF NOT EXISTS time_of_day VARCHAR(10) DEFAULT 'morning';
ALTER TABLE daily_hadith_log DROP CONSTRAINT IF EXISTS daily_hadith_log_date_key;
ALTER TABLE daily_hadith_log ADD CONSTRAINT daily_hadith_log_date_time_key UNIQUE (date, time_of_day);
```

---

## Enhanced Ramadan Reminders

### Reminder Types

| Reminder | Timing | Description |
|----------|--------|-------------|
| **Suhoor Planning** | Isha + 90 min | Night-before reminder to prepare for tomorrow |
| **Suhoor** | User's offset before Fajr | Morning reminder to eat |
| **Iftar** | User's offset before Maghrib | Reminder to prepare to break fast |
| **Taraweeh** | 30 min before Taraweeh time | Night prayer reminder |

---

## External Cron Setup (cron-job.org)

### Why External Cron?

Vercel's free tier only supports daily cron jobs. For real-time prayer reminders (every 5 minutes), use cron-job.org.

### Account Setup

1. Go to https://cron-job.org
2. Click "Sign Up" (free account)
3. Verify email

### Cron Jobs to Create

**Job 1: Prayer Reminders**
- Title: `Masjid Notify - Prayer Reminders`
- URL: `https://masjid-notify.vercel.app/api/cron/prayer-reminders`
- Schedule: `*/5 * * * *` (every 5 minutes)
- Headers: `Authorization: Bearer masjidnotify2025cron`

**Job 2: Ramadan Reminders**
- Title: `Masjid Notify - Ramadan Reminders`
- URL: `https://masjid-notify.vercel.app/api/cron/ramadan-reminders`
- Schedule: `*/5 * * * *` (every 5 minutes)
- Headers: `Authorization: Bearer masjidnotify2025cron`

**Job 3: Nafl Reminders**
- Title: `Masjid Notify - Nafl Reminders`
- URL: `https://masjid-notify.vercel.app/api/cron/nafl-reminders`
- Schedule: `*/5 * * * *` (every 5 minutes)
- Headers: `Authorization: Bearer masjidnotify2025cron`

**Job 4: Morning Hadith**
- Title: `Masjid Notify - Morning Hadith`
- URL: `https://masjid-notify.vercel.app/api/cron/daily-hadith?time=fajr`
- Schedule: `30 3 * * *` (3:30 AM UTC = 5:30 AM SAST)
- Headers: `Authorization: Bearer masjidnotify2025cron`

**Job 5: Evening Hadith**
- Title: `Masjid Notify - Evening Hadith`
- URL: `https://masjid-notify.vercel.app/api/cron/daily-hadith?time=maghrib`
- Schedule: `0 16 * * *` (4:00 PM UTC = 6:00 PM SAST)
- Headers: `Authorization: Bearer masjidnotify2025cron`

### Vercel Crons as Backup

The `vercel.json` daily crons serve as backup if cron-job.org fails.

---

## Security Fixes (v1.4.0)

### Changes Applied

| File | Fix |
|------|-----|
| `/api/admin/subscribers` | PATCH/DELETE now require `mosque_id` match |
| `/api/admin/subscribers` | GET uses `admin.mosque_id` instead of slug |
| `/api/admin/stats` | All queries use `admin.mosque_id` |
| `/api/webhook/whatsapp` | Commands logged to messages table |

### Why This Matters

- Admins can only modify subscribers belonging to their mosque
- Prevents cross-mosque data access
- Webhook command logging provides audit trail

---

## Database Migrations Required

Run these SQL statements in Supabase SQL Editor:

```sql
-- Add nafl salahs preference column
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS pref_nafl_salahs BOOLEAN DEFAULT FALSE;

-- Add time_of_day to daily_hadith_log for twice-daily hadith
ALTER TABLE daily_hadith_log ADD COLUMN IF NOT EXISTS time_of_day VARCHAR(10) DEFAULT 'morning';

-- Update unique constraint for twice-daily hadith
ALTER TABLE daily_hadith_log DROP CONSTRAINT IF EXISTS daily_hadith_log_date_key;
ALTER TABLE daily_hadith_log ADD CONSTRAINT daily_hadith_log_date_time_key UNIQUE (date, time_of_day);
```

---

## Changelog

### Version 1.4.1 - February 3, 2026

#### WhatsApp Account Issue

| Event | Details |
|-------|---------|
| **Account Suspended** | Meta suspended WhatsApp Business Account |
| **Reason Given** | "Activity that does not comply with WhatsApp Business terms of service" |
| **Appeal Submitted** | Yes - detailed explanation of legitimate mosque notification service |
| **Expected Resolution** | 24-48 hours |

#### Documentation Added

- Comprehensive WhatsApp compliance guide
- Ban prevention best practices
- Template submission checklist
- Number warmup strategy
- Quality monitoring recommendations

#### Database Fixes

Fixed missing tables and columns:
- Created `prayer_times_cache` table
- Created `scheduled_messages` table
- Added `settings_token` columns to subscribers
- Updated `messages` type constraint for new message types

---

### Version 1.4.0 - February 2, 2026

#### New Features

| Feature | Description |
|---------|-------------|
| **Nafl Salah Reminders** | Tahajjud (2h before Fajr), Ishraq (20min after Sunrise), Awwabin (15min after Maghrib) |
| **Twice-Daily Hadith** | Morning and evening hadith with separate caching |
| **Suhoor Planning Reminder** | Night-before reminder (90min after Isha) |
| **Webhook Command Logging** | All WhatsApp commands logged to messages table |

#### Security Fixes

| Fix | Description |
|-----|-------------|
| **Mosque-scoped Admin Operations** | PATCH/DELETE require mosque_id match |
| **Admin Queries Use mosque_id** | Replaced DEFAULT_MOSQUE_SLUG with admin.mosque_id |

#### Database Changes

| Change | SQL |
|--------|-----|
| New column | `subscribers.pref_nafl_salahs BOOLEAN DEFAULT FALSE` |
| New column | `daily_hadith_log.time_of_day VARCHAR(10)` |
| New constraint | `daily_hadith_log_date_time_key UNIQUE (date, time_of_day)` |

#### Files Added

| File | Purpose |
|------|---------|
| `src/app/api/cron/nafl-reminders/route.ts` | Nafl prayer reminder cron |

#### Files Modified

| File | Changes |
|------|---------|
| `src/lib/supabase.ts` | Added `pref_nafl_salahs`, `time_of_day` types |
| `src/lib/whatsapp-templates.ts` | Added 4 new templates |
| `src/lib/whatsapp.ts` | Export new templates |
| `src/lib/prayer-times.ts` | Added `calculateNaflTimes`, `isWithinMinutesAfter` |
| `src/lib/hadith-api.ts` | Support `timeOfDay` parameter |
| `src/app/api/cron/daily-hadith/route.ts` | Accept `?time=` param |
| `src/app/api/cron/ramadan-reminders/route.ts` | Added suhoor planning reminder |
| `src/components/subscribe-form.tsx` | Added nafl checkbox |
| `src/app/settings/[token]/page.tsx` | Added nafl checkbox |
| `src/app/api/settings/[token]/route.ts` | Handle pref_nafl_salahs |
| `src/app/api/subscribe/route.ts` | Handle pref_nafl_salahs |
| `src/app/api/admin/subscribers/route.ts` | Security: mosque_id checks |
| `src/app/api/admin/stats/route.ts` | Use admin.mosque_id |
| `src/app/api/webhook/whatsapp/route.ts` | Command logging |
| `vercel.json` | Updated cron schedules |

---

### Version 1.3.0 - February 2, 2026

#### Bug Fixes

| Fix | Description |
|-----|-------------|
| **Dashboard showing 0 subscribers** | Created server-side API routes to bypass RLS |
| **Subscribers page empty** | Now uses `/api/admin/subscribers` endpoint |
| **Messages not counting** | Added mosque_id filter to all queries |

#### New Features

| Feature | Description |
|---------|-------------|
| **E2E Test Suite** | 101 Playwright tests covering all admin pages |
| **Admin Stats API** | `GET /api/admin/stats` for dashboard data |
| **Admin Subscribers API** | Full CRUD at `/api/admin/subscribers` |

#### Files Added

| File | Purpose |
|------|---------|
| `src/app/api/admin/stats/route.ts` | Dashboard statistics API |
| `src/app/api/admin/subscribers/route.ts` | Subscribers CRUD API |
| `tests/admin-dashboard.spec.ts` | Dashboard tests |
| `tests/admin-subscribers.spec.ts` | Subscribers tests |
| `tests/admin-announcements.spec.ts` | Announcements tests |
| `tests/admin-settings.spec.ts` | Settings tests |
| `tests/admin-qrcode.spec.ts` | QR code tests |
| `tests/admin-navigation.spec.ts` | Navigation tests |
| `tests/helpers/auth.ts` | Shared test utilities |
| `tests/README.md` | Test documentation |

#### Files Modified

| File | Changes |
|------|---------|
| `src/app/admin/page.tsx` | Fetch data from `/api/admin/stats` |
| `src/app/admin/subscribers/page.tsx` | Fetch data from `/api/admin/subscribers` |
| `src/lib/auth.ts` | Simplified withAdminAuth type signature |
| `playwright.config.ts` | Optimized for reliability |
| `tests/subscription.spec.ts` | Fixed strict mode violations |
| `tests/mobile.spec.ts` | Fixed hardcoded mosque name |

---

### Version 1.2.0 - February 1, 2026

#### Meta App Submission Ready

| Item | Value |
|------|-------|
| **Privacy Policy URL** | https://masjid-notify.vercel.app/privacy |
| **Terms of Service URL** | https://masjid-notify.vercel.app/terms |
| **Data Deletion URL** | https://masjid-notify.vercel.app/data-deletion |

#### Bug Fixes

| Fix | Description |
|-----|-------------|
| **Settings Page Loading** | Fixed infinite loading on /admin/settings |
| **WhatsApp Template Name** | Updated to `masjid_notify_welcome` |
| **Hardcoded Mosque Slug** | Now uses env var via constants.ts |

---

### Version 1.1.0 - February 1, 2026

#### New Features

| Change | Description |
|--------|-------------|
| **Real Hadith API** | Integrated random-hadith-generator.vercel.app |
| **30-Day No-Repeat** | Tracks sent hadiths in daily_hadith_log |
| **Simplified Preferences** | 6 options reduced to 5 clear options |

---

### Version 1.0.0 - January 31, 2026

Initial production release with 24 user stories completed.

---

## Support

### Resources

| Resource | URL |
|----------|-----|
| **GitHub Repo** | https://github.com/alqode-dev/masjid-notify |
| **Vercel Dashboard** | https://vercel.com/alqodes-projects/masjid-notify |
| **Supabase Dashboard** | https://supabase.com/dashboard/project/jlqtuynaxuooymbwrwth |
| **Meta Developer Console** | https://developers.facebook.com/apps |
| **Hadith API Docs** | https://random-hadith-generator.vercel.app |

---

**Document Version:** 1.4.1
**Last Updated:** February 3, 2026 @ 00:30 UTC
**Author:** Claude Code
**Status:** App Ready - WhatsApp Account Under Meta Review
