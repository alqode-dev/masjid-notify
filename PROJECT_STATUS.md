# Masjid Notify - Project Status

> **Last Updated:** February 8, 2026 @ 18:00 SAST
> **Version:** 1.8.0
> **Status:** Production - All systems operational
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

### Getting Started (Read First!)
1. [What Is This Project?](#what-is-this-project)
2. [How Everything Works Together](#how-everything-works-together)
3. [Quick Start for Developers](#quick-start-for-developers)

### Current Status
4. [System Status](#system-status)
5. [WhatsApp Account Status](#whatsapp-account-status--compliance)
6. [What's Working vs Not Working](#whats-working-vs-not-working)

### How To Do Things
7. [Common Tasks & How-To Guides](#common-tasks--how-to-guides)
8. [Testing the App](#testing-the-app)
9. [Troubleshooting Guide](#troubleshooting-guide)
10. [Meta Webhook Configuration](#meta-webhook-configuration)

### Technical Reference
11. [All Features](#all-features)
12. [API Reference](#api-reference)
13. [Database Schema](#database-schema)
14. [Cron Jobs Explained](#cron-jobs-explained)
15. [Environment Variables](#environment-variables)
16. [Project Structure](#project-structure)
17. [Code Quality & Security](#code-quality--security)

### Infrastructure & Accounts
18. [Production Infrastructure](#production-infrastructure)
19. [Admin Access & Credentials](#admin-access)
20. [External Services & Accounts](#external-services--accounts)

### History
21. [Changelog](#changelog)

---

# PART 1: GETTING STARTED (READ THIS FIRST!)

---

## What Is This Project?

### The Simple Explanation

**Masjid Notify** is a WhatsApp notification app for mosques. Here's how it works:

1. **Mosque puts up a QR code** (or shares a link)
2. **People scan it** and land on a website
3. **They enter their phone number** and choose what notifications they want
4. **They automatically receive WhatsApp messages** for:
   - Prayer time reminders (5 daily prayers)
   - Friday (Jumu'ah) reminders
   - Daily hadith (Islamic teachings)
   - Ramadan reminders (Suhoor, Iftar, Taraweeh)
   - Voluntary prayer reminders (Tahajjud, Ishraq, Awwabin)
   - Mosque announcements

### Who Is This For?

- **Mosques** who want to send automated reminders to their community
- **Muslims** who want prayer time notifications on WhatsApp (not another app)

### Why WhatsApp?

In South Africa (and many countries), **everyone uses WhatsApp**. People don't want to download another app just for prayer times. This sends reminders directly to WhatsApp.

---

## How Everything Works Together

### The Big Picture (System Architecture)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER JOURNEY                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   1. User scans QR code          2. Lands on website                    │
│        📱 ──────────────────────> 🌐 masjid-notify.vercel.app           │
│                                                                          │
│   3. Fills subscribe form        4. Saved to database                   │
│        📝 ──────────────────────> 🗄️ Supabase (PostgreSQL)              │
│                                                                          │
│   5. Welcome message sent        6. User receives on WhatsApp           │
│        📤 ──────────────────────> 💬 WhatsApp                           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                        AUTOMATED REMINDERS                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Every 5 minutes, cron-job.org pings our server:                       │
│                                                                          │
│   ⏰ cron-job.org ──────> 🖥️ Vercel API ──────> 🗄️ Get subscribers     │
│                                    │                                     │
│                                    ▼                                     │
│                           🕐 Check prayer times                          │
│                           (from Aladhan API, cached)                     │
│                                    │                                     │
│                                    ▼                                     │
│                           ❓ Is it time to send?                         │
│                           (timezone-aware comparison)                    │
│                                    │                                     │
│                              YES   │   NO                                │
│                                ▼       ▼                                 │
│                           📤 Send    🔄 Wait for                         │
│                           WhatsApp   next check                          │
│                           (concurrent, rate-limited)                     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### The Key Components

| Component | What It Does | Where It Lives |
|-----------|--------------|----------------|
| **Frontend** | The website users see (subscribe form, admin dashboard) | Vercel (Next.js) |
| **Backend API** | Handles subscriptions, sends messages, processes webhooks | Vercel (Next.js API routes) |
| **Database** | Stores subscribers, mosques, messages, settings | Supabase (PostgreSQL) |
| **WhatsApp API** | Actually sends the WhatsApp messages | Meta Cloud API |
| **Prayer Times API** | Calculates accurate prayer times by location | Aladhan API |
| **Hadith API** | Provides authentic daily hadith | fawazahmed0/hadith-api (jsDelivr CDN) |
| **Cron Scheduler** | Triggers reminder checks every 5 minutes | cron-job.org |

### Data Flow Example: Prayer Reminder

1. **cron-job.org** calls `https://masjid-notify.vercel.app/api/cron/prayer-reminders` every 5 minutes
2. **Our API** authenticates the request using constant-time comparison (prevents timing attacks)
3. **Our API** fetches all mosques from **Supabase**
4. For each mosque, it calls **Aladhan API** to get today's prayer times (with caching)
5. It checks: "Is current time within 5 minutes of [prayer time minus user's offset]?" (timezone-aware)
6. If YES, it fetches subscribers who want that prayer reminder from **Supabase**
7. For each subscriber, it calls **WhatsApp Cloud API** to send the message (concurrent, max 10 at once)
8. It logs the sent message to **Supabase** (messages table)
9. It updates `last_message_at` for successful sends (batch update)

---

## Quick Start for Developers

### If You Want to Run This Locally

```bash
# 1. Clone the repo
git clone https://github.com/alqode-dev/masjid-notify.git
cd masjid-notify

# 2. Install dependencies
npm install

# 3. Copy environment variables
cp .env.local.example .env.local
# Then edit .env.local with your credentials (see Environment Variables section)

# 4. Run development server
npm run dev

# 5. Open http://localhost:3000
```

### If You Want to Deploy Changes

```bash
# 1. Make your changes
# 2. Test locally
npm run dev

# 3. Run TypeScript check
npx tsc --noEmit

# 4. Run build to catch any issues
npm run build

# 5. Commit
git add .
git commit -m "description of changes"

# 6. Push to GitHub (auto-deploys to Vercel)
git push origin master

# 7. Check Vercel dashboard for deployment status
# https://vercel.com/alqodes-projects/masjid-notify
```

### If You Want to Check Database

1. Go to https://supabase.com/dashboard/project/jlqtuynaxuooymbwrwth
2. Click "Table Editor" in sidebar
3. Browse tables: `subscribers`, `mosques`, `messages`, etc.

### If You Want to Check Logs

1. Go to https://vercel.com/alqodes-projects/masjid-notify
2. Click "Logs" tab
3. Filter by function name (e.g., `api/cron/prayer-reminders`)

---

## What's Working vs Not Working

### ✅ Currently Working

| Feature | Status | Notes |
|---------|--------|-------|
| Landing page | ✅ Works | Shows prayer times, subscribe form, correct location (Rondebosch East) |
| Subscribe form | ✅ Works | Saves to database correctly, accessible checkbox labels |
| WhatsApp sending | ✅ Works | Account restored, welcome messages sending |
| Welcome messages | ✅ Works | Sent on subscription via `masjid_notify_welcome` template |
| Admin login | ✅ Works | Email: alqodez@gmail.com |
| Admin dashboard | ✅ Works | Stats cards, subscriber counts, analytics charts |
| Admin subscribers | ✅ Works | Table with ARIA labels, search, filter, export, import, **delete confirmation** |
| Admin announcements | ✅ Works | Send now (concurrent), schedule, templates, WhatsApp policy notice |
| Admin settings | ✅ Works | Prayer settings save, **cache invalidated on change** |
| Admin QR code | ✅ Works | Generate and download QR codes |
| Admin analytics | ✅ Works | Subscriber growth, message types, status breakdown |
| Database | ✅ Works | All tables created and functional, **metadata JSONB column added (v1.8.0)** |
| Cron jobs | ✅ Works | All 5 jobs running, **retry limits** on scheduled messages, **metadata fallback (v1.8.0)** |
| Prayer times API | ✅ Works | Aladhan API, **timezone-aware**, **NaN-safe parsing**, **midnight wraparound** |
| Hadith API | ✅ Works | **jsDelivr CDN** (v1.6.2), 6 authentic collections, **Fisher-Yates shuffle** |
| Rate limiting | ✅ Works | **Secure IP detection** (x-vercel-forwarded-for, rightmost IP) |
| 404 page | ✅ Works | Branded not-found page, **no admin link exposed (v1.7.2)** |
| Error handling | ✅ Works | Comprehensive logging, **batch update error handling** |
| Social preview | ✅ Works | **Custom OG image** for WhatsApp/social sharing (v1.6.1) |
| WhatsApp webhook | ✅ Works | **Fixed (v1.8.0):** WABA subscribed, commands (STOP/PAUSE/SETTINGS/HELP) fully operational |
| Message logging | ✅ Works | **Fixed (v1.8.0):** metadata column added, all prayer/nafl messages now recorded |

### ⚠️ Pending Meta Approval

| Feature | Status | Why | Fix |
|---------|--------|-----|-----|
| Meta message templates | ⚠️ Not approved | 11 of 12 templates never submitted to Meta | Submit all templates for Meta approval (see Template Guide below) |

### ⚠️ Known Issues

| Issue | Status | Workaround |
|-------|--------|------------|
| ~~Webhook not receiving messages from Meta~~ | ✅ Fixed (v1.8.0) | WABA was not subscribed to app. Fixed by calling POST /v18.0/{WABA_ID}/subscribed_apps. |
| ~~Prayer/nafl messages not logged in dashboard~~ | ✅ Fixed (v1.8.0) | messages table was missing metadata JSONB column. Fixed via migration 011. |

### 📋 TODO: Next Steps

1. [ ] **Submit ALL 12 Meta templates** for approval (see Template Guide section below for exact body text)
2. [ ] Wait for template approval (24-48h each)
3. [ ] Apply for Meta Business Verification
4. [ ] Get a test phone number for testing
5. [ ] Implement number warmup (start slow)
6. [ ] Test prayer reminder flow end-to-end
7. [ ] Go live with real users
8. [x] ~~Resolve webhook message reception issue~~ - Fixed in v1.8.0 (WABA subscribed to app)

### 📋 Required Database Migrations

| Migration | Purpose | Status |
|-----------|---------|--------|
| **Migration 009** | Fix messages CHECK constraints + prayer_times_cache RLS | ✅ **REQUIRED** - Run in Supabase SQL Editor |
| **Migration 010** | Unified reminder locks for duplicate prevention | ✅ **REQUIRED** - Run in Supabase SQL Editor |
| **Migration 011** | Add metadata JSONB column to messages table | ✅ **REQUIRED** - Run in Supabase SQL Editor |
| Migration 007 | Adds Ramadan columns to mosques table | Optional - settings page has fallback |
| Add retry_count | For scheduled message retry tracking | Optional - code handles missing column |

**Migration 009 Details:**
- Adds `nafl` and `webhook_command` to allowed message types
- Adds `received` to allowed message statuses
- Adds `status` column to messages table if missing
- Adds RLS INSERT/UPDATE policies for `prayer_times_cache`

**Migration 010 Details:**
- Creates `prayer_reminder_locks` table for atomic duplicate prevention
- Uses UNIQUE constraint on `(mosque_id, prayer_key, reminder_date, reminder_offset)`
- Supports all reminder types: prayers, hadith_morning, hadith_evening, jumuah, nafl types, ramadan types

---

# PART 2: CURRENT STATUS

---

## System Status

### Component Health Check

| Component | Status | Last Verified | Notes |
|-----------|--------|---------------|-------|
| **Frontend (Next.js)** | ✅ Operational | Feb 8, 2026 | All pages loading correctly, branded 404 page, XSS-safe QR print |
| **Backend API** | ✅ Operational | Feb 8, 2026 | All admin endpoints use secure server-side routes |
| **Database (Supabase)** | ✅ Connected | Feb 8, 2026 | PostgreSQL with RLS, coordinates correct, **metadata column added** |
| **Admin Dashboard** | ✅ Operational | Feb 8, 2026 | All pages functional, accessible |
| **Admin Settings** | ✅ Operational | Feb 8, 2026 | **Cache invalidated on save** |
| **WhatsApp Sending** | ✅ Active | Feb 8, 2026 | Account restored, **concurrent sending** |
| **WhatsApp Webhook** | ✅ Operational | Feb 8, 2026 | **Fixed (v1.8.0):** WABA subscribed to app, commands (STOP/PAUSE/SETTINGS/HELP) fully working. See [Meta Webhook Configuration](#meta-webhook-configuration). |
| **Cron Jobs** | ✅ Running | Feb 8, 2026 | 5 jobs, **atomic locking**, **dynamic timing**, **metadata fallback** |
| **Hadith API** | ✅ Integrated | Feb 8, 2026 | jsDelivr CDN (6 collections), **dynamic timing** (15 min after Fajr/Maghrib) |
| **E2E Tests** | ✅ 101 Passing | Feb 2, 2026 | Full admin dashboard coverage |
| **Rate Limiting** | ✅ Secure | Feb 8, 2026 | **IP spoofing protection** |
| **Error Tracking** | ⚠️ Optional | - | Requires Sentry DSN |

### Active Mosque

| Property | Value |
|----------|-------|
| **Name** | Anwaarul Islam Rondebosch East |
| **Slug** | anwaarul-islam-rondebosch-east |
| **Address** | 123 2nd Ave, Rondebosch East, Cape Town, 7780 |
| **Coordinates** | -33.9769192, 18.5006926 |
| **City** | Cape Town |
| **Country** | South Africa |
| **Madhab** | Hanafi |
| **Timezone** | Africa/Johannesburg (SAST, UTC+2) |
| **Jumu'ah Khutbah** | 13:20 |

### Project Metrics

| Metric | Value |
|--------|-------|
| **Development Sprint** | January 31 - February 8, 2026 |
| **User Stories Completed** | 24/24 (100%) |
| **E2E Tests** | 101 tests (all passing) |
| **Bug Fixes (v1.6.x-v1.8.0)** | 80+ issues resolved |
| **Total Commits** | 35+ commits |
| **Lines of Code** | ~9,000+ lines |
| **Build Time** | ~3.5 seconds (Turbopack) |
| **Deployment Region** | Washington D.C. (iad1) |

### Key Achievements

- ✅ Full WhatsApp Cloud API integration
- ✅ Automated prayer time reminders (timezone-aware)
- ✅ Admin dashboard with analytics
- ✅ Message scheduling system with **retry limits**
- ✅ **101 E2E tests** with Playwright
- ✅ Server-side API routes for admin data
- ✅ **Secure rate limiting** (IP spoofing protection)
- ✅ Webhook signature verification (constant-time)
- ✅ Real Hadith API Integration (**fair shuffle algorithm**)
- ✅ South African phone number validation
- ✅ Legal pages (Privacy, Terms, Data Deletion)
- ✅ **Nafl Salah Reminders** (Tahajjud, Ishraq, Awwabin)
- ✅ **Twice-Daily Hadith** (morning and evening)
- ✅ **Enhanced Suhoor Reminders** (planning + morning)
- ✅ **Security Fixes** (mosque-scoped admin operations)
- ✅ **Accessibility improvements** (ARIA labels, proper form linking)
- ✅ **Prayer cache invalidation** on settings change
- ✅ **Concurrent message sending** for announcements
- ✅ **Branded 404 page**
- ✅ **Dynamic hadith timing** (follows prayer times, not fixed UTC)
- ✅ **Atomic reminder locking** (prevents duplicate messages)

---

## Code Quality & Security

### Security Features (v1.6.0 - v1.7.2)

| Feature | Implementation | File |
|---------|----------------|------|
| **Constant-time auth comparison** | Prevents timing attacks on cron secret | `auth.ts:116-140` |
| **IP spoofing protection** | Uses `x-vercel-forwarded-for` or rightmost IP | `ratelimit.ts:63-93` |
| **Webhook signature verification** | HMAC-SHA256 with constant-time comparison | `webhook/route.ts:14-49` |
| **Mosque-scoped operations** | Admins can only access their mosque's data | All admin routes |
| **Input validation** | Boolean preference validation | `settings/[token]/route.ts:136-153` |
| **Delete confirmation** | Prevents accidental subscriber deletion | `subscribers-table.tsx:158-170` |
| **XSS prevention in QR print** | HTML entity escaping in document.write() | qr-code.tsx (v1.7.2) |
| **Sanitized error messages** | Supabase errors not leaked to client | admin/settings/route.ts (v1.7.2) |
| **Generic login errors** | Auth details not leaked on failed login | admin/login/page.tsx (v1.7.2) |
| **No admin link on 404** | Public 404 page does not expose admin URL | not-found.tsx (v1.7.2) |
| **Import validation** | Phone validation + size limits on import | admin/subscribers/import/route.ts (v1.7.2) |
| **Status validation** | Status field validated on subscriber PATCH | admin/subscribers/route.ts (v1.7.2) |

### Code Quality Improvements (v1.6.0)

| Improvement | Description | Files |
|-------------|-------------|-------|
| **NaN-safe time parsing** | Validates parsed values before use | `prayer-times.ts` |
| **Midnight wraparound handling** | Proper modular arithmetic for time offsets | `prayer-times.ts:291-298` |
| **Fisher-Yates shuffle** | Unbiased randomization for hadith collections | `hadith-api.ts:155-165` |
| **Concurrent message sending** | 10 concurrent requests with p-limit | `announcements/route.ts` |
| **Batch error handling** | Logs errors without throwing for non-critical updates | `message-sender.ts:172-184` |
| **Retry limits** | Scheduled messages fail after 5 retries | `prayer-reminders/route.ts` |
| **PostgreSQL error codes** | Uses error codes instead of fragile message matching | `admin/settings/route.ts:57-60` |
| **Constants extraction** | Magic numbers moved to constants file | `constants.ts` |

### Accessibility Improvements (v1.6.0 - v1.7.2)

| Component | Improvement |
|-----------|-------------|
| **Checkbox** | Added `id`, `htmlFor`, `aria-describedby` linking |
| **Subscribers Table** | Added `aria-label` to table and action buttons |
| **Action Buttons** | Added descriptive `aria-label` attributes |
| **Login page** | Added form labels and autoComplete attributes (v1.7.2) |
| **Sidebar** | Added aria-label to hamburger button and mobile nav dialog (v1.7.2) |
| **Error states** | Added role=alert to error messages (v1.7.2) |
| **Decorative elements** | Added aria-hidden to decorative icons (v1.7.2) |
| **Subscriber search** | Added accessible label for search input (v1.7.2) |

### Constants Defined (`src/lib/constants.ts`)

```typescript
// Time constants (in minutes)
export const MINUTES_IN_HOUR = 60;
export const MINUTES_IN_DAY = 1440;      // 24 * 60
export const MINUTES_HALF_DAY = 720;     // 12 * 60

// Cron job timing
export const CRON_WINDOW_MINUTES = 5;    // Cron runs every 5 minutes
export const DUPLICATE_CHECK_MINUTES = 10;

// Milliseconds constants
export const MS_PER_MINUTE = 60 * 1000;
export const MS_PER_HOUR = 60 * MS_PER_MINUTE;
export const TEN_MINUTES_MS = 10 * MS_PER_MINUTE;
export const HADITH_API_DELAY_MS = 200;  // Delay between hadith API retries

// Ramadan reminder timing (in minutes)
export const TARAWEEH_REMINDER_MINUTES = 30;        // 30 mins before Taraweeh
export const SUHOOR_PLANNING_OFFSET_MINUTES = 90;   // 90 mins after Isha

// Nafl salah timing (in minutes)
export const TAHAJJUD_MINUTES_BEFORE_FAJR = 120;    // 2 hours before Fajr
export const ISHRAQ_MINUTES_AFTER_SUNRISE = 180;    // 3 hours after sunrise (~9 AM when users can pray at work)
export const AWWABIN_MINUTES_AFTER_MAGHRIB = 15;    // 15 mins after Maghrib

// Hadith timing (dynamically follows prayer times)
export const HADITH_MINUTES_AFTER_PRAYER = 15;      // 15 mins after Fajr/Maghrib

// Subscriber preferences
export const VALID_REMINDER_OFFSETS = [5, 10, 15, 30] as const;

// Shared reminder options for UI components
export const REMINDER_OPTIONS = [
  { value: "5", label: "5 minutes before" },
  { value: "10", label: "10 minutes before" },
  { value: "15", label: "15 minutes before" },
  { value: "30", label: "30 minutes before" },
];
```

---

## WhatsApp Account Status & Compliance

### Current Status: ✅ ACTIVE

| Item | Status | Details |
|------|--------|---------|
| **Account Status** | ✅ Active | Restored after appeal — business name was updated |
| **Appeal Result** | ✅ Approved | February 4, 2026 |
| **Business Name** | Masjid Notify | Updated from "Bochi" (name issue caused original suspension) |
| **Welcome Messages** | ✅ Sending | `masjid_notify_welcome` template working |
| **Message Templates** | ⚠️ Need approval | All other templates must be submitted to Meta for approval |

### Why the Original Ban Occurred (Resolved)

The WhatsApp Business account was suspended on Feb 2, 2026 and restored on Feb 4, 2026. Root cause was the business name ("Bochi") not matching the service. After updating to "Masjid Notify" and appealing, Meta restored the account.

| Cause | Explanation | Prevention |
|-------|-------------|------------|
| **Business name mismatch** | Name "Bochi" didn't match mosque notification service | Updated to "Masjid Notify" |
| **New unverified account** | Meta is suspicious of new WhatsApp Business accounts | Get Meta Business Verified |
| **No approved templates** | Messages sent without Meta-approved templates | Submit templates for approval FIRST |
| **Testing pattern** | Repeatedly deleting/re-adding numbers looks like spam testing | Use dedicated test numbers |

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

## WhatsApp Template Guide

### IMPORTANT: Two Different Types of "Templates"

This project uses the word "template" in two completely different ways:

#### 1. Meta WhatsApp Templates (submitted to Meta for approval)

- **What:** Message structures registered with Meta's WhatsApp Business API
- **Why:** Required to send messages outside the 24-hour conversation window
- **Where defined:** `src/lib/whatsapp-templates.ts`
- **How many:** 12 templates total (all category: MARKETING per Meta's latest guidance)
- **Admin interaction:** None — these work automatically behind the scenes
- **Key point:** ALL automated messages (cron reminders, welcome) use these

#### 2. Dashboard Announcement Templates (UI helpers in admin panel)

- **What:** Pre-written text snippets the admin can pick from when composing announcements
- **Why:** Convenience — admin clicks "Use a template" and gets pre-filled text
- **Where defined:** `src/components/admin/message-templates.tsx`
- **How many:** 11 templates (Eid, Juma, lectures, fundraiser, Ramadan, etc.)
- **Admin interaction:** Yes — admin selects one, edits the `[PLACEHOLDERS]`, and sends
- **Key point:** ALL of these are sent through ONE Meta template: `mosque_announcement`

#### How They Connect

```
Admin picks "Eid ul-Fitr" dashboard template
  → Text fills the announcement box
  → Admin edits [TIME] placeholders
  → Clicks "Send Now"
  → System sends via Meta's "mosque_announcement" template
  → {{1}} = mosque name, {{2}} = the announcement text
```

So 11 dashboard templates all flow through 1 Meta template. The admin never needs to think about Meta templates — they just work.

### Meta Template Approval Status

| # | Template Name | Category | Meta Status | Used By | Variables |
|---|--------------|----------|-------------|---------|-----------|
| 1 | `masjid_notify_welcome` | MARKETING | ✅ Approved | Auto: on subscribe | `{{1}}` = mosque name |
| 2 | `salah_reminder` | MARKETING | ❌ Not submitted | Auto: cron every 5 min | `{{1}}` = prayer, `{{2}}` = time, `{{3}}` = mosque |
| 3 | `jumuah_reminder` | MARKETING | ❌ Not submitted | Auto: Friday cron | `{{1}}` = adhaan, `{{2}}` = khutbah, `{{3}}` = mosque |
| 4 | `daily_hadith` | MARKETING | ❌ Not submitted | Auto: morning + evening cron | `{{1}}` = text, `{{2}}` = source, `{{3}}` = ref, `{{4}}` = mosque |
| 5 | `mosque_announcement` | MARKETING | ❌ Not submitted | Admin dashboard (powers ALL 11 announcement templates) | `{{1}}` = mosque, `{{2}}` = content |
| 6 | `ramadan_suhoor` | MARKETING | ❌ Not submitted | Auto: Ramadan cron | `{{1}}` = fajr time, `{{2}}` = mosque |
| 7 | `ramadan_iftar` | MARKETING | ❌ Not submitted | Auto: Ramadan cron | `{{1}}` = mins, `{{2}}` = maghrib, `{{3}}` = mosque |
| 8 | `ramadan_taraweeh` | MARKETING | ❌ Not submitted | Auto: Ramadan cron | `{{1}}` = time, `{{2}}` = mosque |
| 9 | `tahajjud_reminder` | MARKETING | ❌ Not submitted | Auto: nafl cron | `{{1}}` = fajr time, `{{2}}` = mosque |
| 10 | `ishraq_reminder` | MARKETING | ❌ Not submitted | Auto: nafl cron | `{{1}}` = mosque |
| 11 | `awwabin_reminder` | MARKETING | ❌ Not submitted | Auto: nafl cron | `{{1}}` = mosque |
| 12 | `suhoor_planning` | MARKETING | ❌ Not submitted | Auto: Ramadan cron | `{{1}}` = fajr time, `{{2}}` = mosque |

### WhatsApp Commands (Available to Subscribers)

Users can text these commands to the WhatsApp number at any time:

| Command | What It Does | Code Location |
|---------|-------------|---------------|
| **STOP** | Unsubscribe from all messages | `webhook/whatsapp/route.ts` → `handleStop()` |
| **START** | Resubscribe after STOP | `webhook/whatsapp/route.ts` → `handleResume()` |
| **RESUME** | Resume after PAUSE | `webhook/whatsapp/route.ts` → `handleResume()` |
| **PAUSE [days]** | Pause notifications for 1-30 days (default 7) | `webhook/whatsapp/route.ts` → `handlePause()` |
| **SETTINGS** | Get a 24-hour link to update preferences on the web | `webhook/whatsapp/route.ts` → `handleSettings()` |
| **HELP** | Show all available commands | `webhook/whatsapp/route.ts` → `handleHelp()` |

Any unrecognized text also returns the commands list.

### How to Submit Templates to Meta

1. Go to **Meta Business Manager**: https://business.facebook.com/
2. Navigate to: **WhatsApp Manager > Account Tools > Message Templates**
3. Click **"Create Template"**
4. Select Category: **MARKETING** (Meta's latest guidance for all notification types)
5. Enter template name (use underscore format, e.g., `salah_reminder`)
6. Select language: **English (en)**
7. Enter the template body text exactly as specified in `src/lib/whatsapp-templates.ts`
8. For variables (`{{1}}`, `{{2}}`, etc.) — add sample values when prompted
9. Submit for review (typically 24-48 hours)

### Ban Prevention Best Practices

| Practice | What They Do | Our Implementation |
|----------|--------------|-------------------|
| **Business Verification** | Get Meta Business verified (blue checkmark) | ❌ TODO: Apply for verification |
| **Template Approval** | ONLY send pre-approved templates, never plain text for first contact | ⚠️ 1 of 12 approved, 11 remaining |
| **Double Opt-in** | Send "Reply YES to confirm" after signup | ❌ TODO: Future feature |
| **Number Warmup** | Start 50 msgs/day, increase 20% weekly | ❌ TODO: Implement rate scaling |
| **Quality Monitoring** | Track blocks/reports, auto-pause if quality drops | ❌ TODO: Future feature |
| **Dedicated Test Numbers** | Use separate numbers for testing | ❌ TODO: Get test number |
| **Message Spacing** | Min 1 second between messages | ✅ Implemented (p-limit) |
| **Opt-out Compliance** | Process STOP within 24 hours | ✅ Implemented (instant) |

---

# PART 3: HOW TO DO THINGS

---

## Common Tasks & How-To Guides

### How to Test If Subscriptions Work

1. Go to https://masjid-notify.vercel.app
2. Enter a phone number and click Subscribe
3. Check Supabase > Table Editor > `subscribers` table
4. Your number should appear with `status: active`
5. Check if you receive the WhatsApp welcome message

### How to Check If Cron Jobs Are Running

1. Go to https://cron-job.org and login
2. Click on each job to see execution history
3. Green = success, Red = failed
4. Or check Vercel logs: https://vercel.com/alqodes-projects/masjid-notify/logs

### How to Manually Trigger a Cron Job (for testing)

```bash
# Prayer reminders
curl -H "Authorization: Bearer masjidnotify2025cron" \
  https://masjid-notify.vercel.app/api/cron/prayer-reminders

# Nafl reminders
curl -H "Authorization: Bearer masjidnotify2025cron" \
  https://masjid-notify.vercel.app/api/cron/nafl-reminders

# Daily hadith (v1.7.1: now checks prayer times automatically)
# Will only send if current time is within 5 minutes after Fajr or Maghrib
curl -H "Authorization: Bearer masjidnotify2025cron" \
  https://masjid-notify.vercel.app/api/cron/daily-hadith

# Ramadan reminders
curl -H "Authorization: Bearer masjidnotify2025cron" \
  https://masjid-notify.vercel.app/api/cron/ramadan-reminders

# Jumu'ah reminder (only works on Fridays, 2 hours before khutbah)
curl -H "Authorization: Bearer masjidnotify2025cron" \
  https://masjid-notify.vercel.app/api/cron/jumuah-reminder
```

### How to Add a New Subscriber Manually (via Database)

1. Go to Supabase > Table Editor > `subscribers`
2. Click "Insert row"
3. Fill in:
   - `phone_number`: `+27XXXXXXXXX` (must include country code)
   - `mosque_id`: Copy from `mosques` table
   - `status`: `active`
   - `pref_daily_prayers`: `true` (or false)
   - Other preferences as needed
4. Click "Save"

### How to Delete a Subscriber

**Option 1: Via Admin Dashboard**
1. Login at https://masjid-notify.vercel.app/admin/login
2. Go to Subscribers
3. Find the subscriber and click Delete
4. **Confirm the deletion** in the dialog (added in v1.6.0)

**Option 2: Via Database**
1. Go to Supabase > Table Editor > `subscribers`
2. Find the row and delete it

### How to Change Mosque Settings

1. Login to admin dashboard
2. Go to Settings
3. Change calculation method, Jumu'ah times, Ramadan mode, etc.
4. Click Save
5. **Prayer cache is automatically invalidated** (v1.6.0)

**Or via database:**
1. Go to Supabase > Table Editor > `mosques`
2. Edit the row directly
3. **Note:** You may need to manually clear `prayer_times_cache` if editing directly

### How to Enable/Disable Ramadan Mode

1. Login to admin dashboard > Settings
2. Toggle "Ramadan Mode" on/off
3. Set Suhoor reminder minutes (e.g., 30 = 30 mins before Fajr)
4. Set Iftar reminder minutes (e.g., 15 = 15 mins before Maghrib)
5. Set Taraweeh time (e.g., 20:30)
6. Save

### How to Send an Announcement

1. Login to admin dashboard
2. Go to Announcements
3. Type your message (or select a template)
4. Click "Send Now" or schedule for later
5. **Messages are sent concurrently** for better performance (v1.6.0)

### How to Check Vercel Deployment Status

1. Go to https://vercel.com/alqodes-projects/masjid-notify
2. Click "Deployments" tab
3. Latest deployment shows build status
4. Click on a deployment to see build logs

### How to View Error Logs

1. Go to https://vercel.com/alqodes-projects/masjid-notify
2. Click "Logs" tab
3. Look for red entries (errors)
4. Click on an entry to see full details

---

## Testing the App

### Test Subscription Flow

1. Delete your number from Supabase `subscribers` table (if exists)
2. Go to landing page and subscribe
3. Check database - subscriber should be created
4. Check Vercel logs for any errors
5. Check if you receive welcome message on WhatsApp

### Test Prayer Reminder Flow

1. Subscribe with `pref_daily_prayers: true`
2. Wait until near a prayer time (within your offset, e.g., 15 mins before)
3. Manually trigger prayer reminders cron (see above)
4. Check Vercel logs for "messages sent" count
5. Check if you receive the reminder

### Test Admin Dashboard

1. Login at /admin/login
2. Check dashboard shows correct subscriber count
3. Go to Subscribers - should show all subscribers
4. Go to Settings - should load mosque settings
5. All navigation should work

### Run Automated E2E Tests

```bash
# Set test credentials
export TEST_ADMIN_EMAIL="alqodez@gmail.com"
export TEST_ADMIN_PASSWORD="your-password"

# Run all tests
npm test

# Run specific test file
npx playwright test admin-dashboard

# Run with visible browser
npx playwright test --headed
```

---

## Troubleshooting Guide

### Problem: Subscribers page shows 0 subscribers

**Cause:** Usually a database query issue or RLS policy problem.

**Fix:**
1. Check Supabase > `subscribers` table has data
2. Check the `mosque_id` matches the admin's mosque
3. Check Vercel logs for errors on `/api/admin/subscribers`

### Problem: Prayer reminders not sending

**Cause:** Could be many things.

**Checklist:**
1. Is WhatsApp account active? (Currently YES)
2. Is it actually near prayer time?
3. Does subscriber have `pref_daily_prayers: true`?
4. Is subscriber `status: active`?
5. Check Vercel logs for the cron job
6. Check cron-job.org - is the job running?

### Problem: Cron job returning errors

**Common errors and fixes:**

| Error | Cause | Fix |
|-------|-------|-----|
| `Unauthorized` | Wrong or missing auth header | Check cron-job.org has correct `Authorization: Bearer masjidnotify2025cron` |
| `Could not find table X` | Database table missing | Run the SQL migrations (see Database Schema section) |
| `column X does not exist` | Database column missing | Run ALTER TABLE to add column |
| WhatsApp API error | Token expired or template not approved | Check Meta Business Manager |

### Problem: WhatsApp messages not sending

**General checklist:**
1. Is the access token valid? (Check Meta Business Manager)
2. Is the phone number ID correct?
3. Are message templates approved?
4. Is the recipient's number in correct format (+27...)?
5. Check Vercel logs for WhatsApp API error messages

### Problem: Admin can't login

**Checklist:**
1. Is the email correct? (`alqodez@gmail.com`)
2. Is the password correct?
3. Does the user exist in Supabase Auth?
4. Does an `admins` table entry exist linking user to mosque?

### Problem: Database connection errors

**Checklist:**
1. Check Supabase dashboard - is project running?
2. Check environment variables are set correctly in Vercel
3. Try redeploying on Vercel

### Problem: Prayer times seem wrong after changing settings

**Fix:** As of v1.6.0, prayer cache is automatically invalidated when settings are saved. If you edited the database directly, manually delete rows from `prayer_times_cache` for your mosque.

### Problem: STOP/PAUSE/SETTINGS commands not working

Users send commands but nothing happens. This is a multi-step issue:

**Step 1: Check WHATSAPP_APP_SECRET**
```
Go to: Meta Developer Console > Your App > App Settings > Basic > App Secret
Copy the secret and set it in Vercel Dashboard > Settings > Environment Variables
The value should be: c426370968ddf41c9adf0c3c5a1d2aae
```

**Step 2: Check Webhook Subscription in Meta**
```
Go to: Meta Developer Console > Your App > WhatsApp > Configuration
Under "Webhook fields", ensure "messages" is SUBSCRIBED (toggled ON)
This is separate from webhook verification - the webhook can verify but still not receive messages!
```

**Step 3: Check Vercel Logs**
```
Go to: Vercel Dashboard > Your Project > Logs
Filter by: api/webhook/whatsapp
Look for: "[webhook] Signature verified successfully" or error messages
```

**Common Issues:**
| Symptom | Cause | Fix |
|---------|-------|-----|
| No logs at all | "messages" not subscribed in Meta | Subscribe to "messages" webhook field |
| "Signature verification failed" | Wrong WHATSAPP_APP_SECRET | Update env var with correct secret |
| "CRITICAL: WHATSAPP_APP_SECRET is not configured" | Env var missing | Add WHATSAPP_APP_SECRET to Vercel |

---

## Meta Webhook Configuration

### Required Webhook Fields

In Meta Developer Console > WhatsApp > Configuration, ensure these webhook fields are **SUBSCRIBED**:

| Field | Required | Purpose |
|-------|----------|---------|
| `messages` | ✅ **YES** | Receives incoming user messages (STOP, PAUSE, SETTINGS, etc.) |
| `message_status` | Optional | Delivery receipts |

**CRITICAL:** The `messages` field subscription is separate from webhook URL verification. Your webhook can pass verification but still not receive messages if `messages` is not subscribed.

### Webhook URL Configuration

| Setting | Value |
|---------|-------|
| **Callback URL** | `https://masjid-notify.vercel.app/api/webhook/whatsapp` |
| **Verify Token** | `masjidnotifywebhook2025` |

### Verifying Webhook Works

1. **Check subscription:** Meta Console > WhatsApp > Configuration > Webhook fields > "messages" should be ON
2. **Send a test message:** Text "HELP" to your WhatsApp number from any phone
3. **Check Vercel logs:** Should see `[webhook] Signature verified successfully` and `[webhook] Processing command 'HELP'`

---

## Recent Bug Fixes

### February 5, 2026 (v1.6.0) - Comprehensive Bug Fix Release

This release addresses 22 issues identified through thorough code review, including critical security fixes, performance improvements, and accessibility enhancements.

#### Critical Fixes (P0)

| Issue | Root Cause | Solution | Status |
|-------|------------|----------|--------|
| **IP spoofing bypass in rate limiter** | `x-forwarded-for` header can be spoofed by clients | Now uses `x-vercel-forwarded-for` (Vercel's trusted header) or rightmost IP from chain | ✅ Fixed |
| **Scheduled messages stuck forever on failure** | No retry limit — failed messages retried infinitely | Added `retry_count` tracking, max 5 retries, then marked as `failed` | ✅ Fixed |

#### High Priority Fixes (P1)

| Issue | Root Cause | Solution | Status |
|-------|------------|----------|--------|
| **No delete confirmation for subscribers** | One misclick could delete subscriber | Added `window.confirm()` before deletion | ✅ Fixed |
| **Prayer cache not invalidated on settings change** | Stale prayer times after admin changes calculation method | Added `invalidatePrayerCache()` called after settings save | ✅ Fixed |
| **Missing ARIA labels** | Accessibility issues for screen readers | Added `aria-label` to table, action buttons; proper `id`/`htmlFor` in Checkbox | ✅ Fixed |

#### Code Quality Fixes (P2)

| Issue | Root Cause | Solution | Status |
|-------|------------|----------|--------|
| **Timing-safe comparison result discarded** | Auth check result never used | Fixed to properly return comparison result | ✅ Fixed |
| **NaN in formatTime output** | No validation of parsed time values | Added `isNaN()` check before using parsed values | ✅ Fixed |
| **Midnight wraparound edge case** | `applyOffset()` could produce invalid times | Rewrote with modular arithmetic for proper wraparound | ✅ Fixed |
| **Missing error handling in batchUpdateLastMessageAt** | Silent failures in subscriber updates | Added error check with logging | ✅ Fixed |
| **Sequential message sending in announcements** | Timeout risk on large subscriber bases | Converted to use `sendTemplatesConcurrently()` | ✅ Fixed |
| **Biased shuffle algorithm** | `Math.random() - 0.5` produces non-uniform distribution | Replaced with proper Fisher-Yates shuffle | ✅ Fixed |
| **Confusing negative offset usage** | `isWithinMinutes(-90)` for "after" logic | Changed to use `isWithinMinutesAfter(90)` | ✅ Fixed |
| **Fragile error message matching** | Checked error message text instead of codes | Now checks PostgreSQL error codes (`42703`, `PGRST204`) | ✅ Fixed |
| **No input validation for boolean preferences** | Accepted any value for preference fields | Added type validation for all boolean prefs | ✅ Fixed |
| **Missing message structure validation in webhook** | Could throw on malformed messages | Added null check for `from` field with warning log | ✅ Fixed |
| **Magic numbers scattered in code** | `720`, `1440`, `10 * 60 * 1000` repeated | Extracted to `constants.ts` | ✅ Fixed |
| **No branded 404 page** | Generic Next.js 404 | Created `src/app/not-found.tsx` | ✅ Fixed |

#### P3 Fixes (Code Quality & Hardening)

| Issue | Root Cause | Solution | Status |
|-------|------------|----------|--------|
| **Webhook GET timing attack** | Direct string comparison for verify token | Added constant-time comparison using `timingSafeEqual` | ✅ Fixed |
| **Subscribe route missing reminder_offset validation** | Accepted any numeric value | Added validation against `VALID_REMINDER_OFFSETS` (5, 10, 15, 30) | ✅ Fixed |
| **logCommand error handling** | Silent failures when logging webhook commands | Added try/catch with error logging | ✅ Fixed |
| **parseInt missing radix** | `parseInt(value)` without base could misbehave | Added `, 10` radix to all parseInt calls | ✅ Fixed |
| **nafl-reminders hardcoded milliseconds** | `10 * 60 * 1000` instead of constant | Now uses `TEN_MINUTES_MS` from constants | ✅ Fixed |
| **Mosque type assertion unsafe** | No null check before using mosque data | Added null check with early return | ✅ Fixed |
| **daily-hadith missing error handling** | Message insert had no error check | Added error handling with console logging | ✅ Fixed |
| **jumuah-reminder missing error handling** | Message insert had no error check | Added error handling with console logging | ✅ Fixed |
| **Random hadith fallback ID** | `Math.random() * 10000` could cause duplicates | Replaced with stable hash-based ID generation | ✅ Fixed |
| **Token param validation** | `params.token as string` without check | Added type validation for token param | ✅ Fixed |
| **Taraweeh magic number 30** | Hardcoded in ramadan-reminders | Extracted to `TARAWEEH_REMINDER_MINUTES` constant | ✅ Fixed |
| **Suhoor planning magic number 90** | Hardcoded in ramadan-reminders | Extracted to `SUHOOR_PLANNING_OFFSET_MINUTES` constant | ✅ Fixed |
| **Hadith API delay magic number 200** | Hardcoded milliseconds | Extracted to `HADITH_API_DELAY_MS` constant | ✅ Fixed |
| **Duplicate REMINDER_OPTIONS** | Same array in multiple files | Centralized in `constants.ts` | ✅ Fixed |
| **Nafl timing magic numbers** | 120, 20, 15 hardcoded | Extracted to `TAHAJJUD_MINUTES_BEFORE_FAJR`, `ISHRAQ_MINUTES_AFTER_SUNRISE`, `AWWABIN_MINUTES_AFTER_MAGHRIB` | ✅ Fixed |

#### Files Modified in v1.6.0 and v1.6.1

| File | Changes |
|------|---------|
| `src/lib/auth.ts` | Fixed timing-safe comparison to properly return result |
| `src/lib/prayer-times.ts` | NaN validation, midnight wraparound fix, constants usage |
| `src/lib/message-sender.ts` | Error handling for batch update |
| `src/lib/hadith-api.ts` | Fisher-Yates shuffle algorithm, stable hash ID fallback, constant delay |
| `src/lib/ratelimit.ts` | Secure IP detection |
| `src/lib/constants.ts` | Added 15+ constants for time, validation, and UI |
| `src/lib/supabase.ts` | Added `retry_count` and `failed` status to ScheduledMessage |
| `src/app/api/cron/prayer-reminders/route.ts` | Retry limit logic |
| `src/app/api/cron/ramadan-reminders/route.ts` | Use `isWithinMinutesAfter()`, timing constants |
| `src/app/api/cron/nafl-reminders/route.ts` | Use timing constants |
| `src/app/api/cron/daily-hadith/route.ts` | Added error handling for message insert |
| `src/app/api/cron/jumuah-reminder/route.ts` | Added error handling for message insert |
| `src/app/api/admin/announcements/route.ts` | Concurrent sending |
| `src/app/api/admin/settings/route.ts` | Cache invalidation, error code checking |
| `src/app/api/settings/[token]/route.ts` | Boolean preference validation |
| `src/app/api/subscribe/route.ts` | Added reminder_offset validation |
| `src/app/api/webhook/whatsapp/route.ts` | Timing-safe verify, message validation, mosque null check, radix fix |
| `src/app/settings/[token]/page.tsx` | Token validation, parseInt radix, shared constants |
| `src/components/subscribe-form.tsx` | Use shared REMINDER_OPTIONS, parseInt radix |
| `src/components/admin/subscribers-table.tsx` | Delete confirmation, ARIA labels |
| `src/components/ui/checkbox.tsx` | Accessibility improvements |
| `src/app/not-found.tsx` | New branded 404 page |
| `src/app/layout.tsx` | Added OG image metadata for social sharing (v1.6.1) |
| `public/og-image.png` | Custom social preview image (v1.6.1) |

---

### February 4, 2026 (v1.5.1)

#### Mosque Coordinates & Location Fix

Updated mosque coordinates from Cape Town city center to actual mosque location in Rondebosch East.

#### Changes

| Change | Description |
|--------|-------------|
| **Coordinates updated** | -33.9249, 18.4241 → -33.9769192, 18.5006926 (via Supabase SQL) |
| **Landing page location** | "Cape Town, South Africa" → "Rondebosch East, Cape Town" |
| **Prayer times cache** | Cleared to force recalculation with correct coordinates |
| **WhatsApp status** | Account restored and active after Meta appeal |

---

### February 3, 2026 (v1.5.0)

#### Complete Admin Dashboard API Migration

All admin pages now use secure server-side API routes instead of client-side Supabase queries.

#### Bug Fixes

| Fix | Description |
|-----|-------------|
| **Announcements page: 0 subscribers** | Created `/api/admin/announcements/data` route |
| **Analytics charts: empty** | Created `/api/admin/analytics` route |
| **Settings: client-side queries** | Created `/api/admin/settings` route (GET + PUT) |
| **QR code page: client-side queries** | Now uses existing `/api/admin/stats` |
| **Subscriber import: client-side insert** | Created `/api/admin/subscribers/import` route |
| **Search bar not working** | Replaced Input component with raw `<input>` |
| **Settings save: missing columns** | Created migration 007 + fallback in PUT route |
| **Missing preference badges** | Added Ramadan (teal) and Nafl Salahs (indigo) badges |
| **WhatsApp policy not visible** | Added 24-hour messaging window notice |

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
- Send announcements to all active subscribers (concurrent sending)
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
| `WHATSAPP_APP_SECRET` | ✅ Set | **CRITICAL:** For webhook signature verification. Get from Meta > App Dashboard > App Settings > Basic > App Secret. Value: `c426370968ddf41c9adf0c3c5a1d2aae` |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | ✅ Set | `masjidnotifywebhook2025` - Must match Meta webhook configuration |
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
| 2 | Subscribe Form | ✅ Live | Multi-step form with SA phone validation (+27), accessible |
| 3 | WhatsApp Welcome | ✅ Live | Automated welcome message on subscription |
| 4 | Admin Login | ✅ Live | Supabase Auth email/password |
| 5 | Admin Dashboard | ✅ Live | Stats cards, quick actions, analytics |
| 6 | Subscribers Table | ✅ Live | Search, filter, pagination, **delete confirmation** |
| 7 | CSV Export | ✅ Live | Download subscriber list |
| 8 | CSV Import | ✅ Live | Bulk import with validation preview |
| 9 | Announcements | ✅ Live | **Concurrent sending**, message composer with preview |
| 10 | Message Templates | ✅ Live | Pre-built announcement templates |
| 11 | Message Scheduling | ✅ Live | Schedule for future delivery, **retry limits** |
| 12 | Mosque Settings | ✅ Live | Prayer calculation, Jumu'ah times, **cache invalidation** |
| 13 | Ramadan Mode | ✅ Live | Toggle Suhoor/Iftar/Taraweeh reminders |
| 14 | QR Code Generator | ✅ Live | Generate, download, print QR codes |
| 15 | Prayer Reminders | ✅ Live | **Timezone-aware**, **NaN-safe** |
| 16 | Daily Hadith | ✅ Live | Real API - 6 authentic collections, **fair shuffle**, **dynamic timing** (15 min after Fajr/Maghrib) |
| 17 | Jumu'ah Reminder | ✅ Live | Friday morning reminder |
| 18 | Analytics Charts | ✅ Live | Subscriber growth, message breakdown |
| 19 | 404 Page | ✅ Live | **Branded not-found page** (v1.6.0) |

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
| `PUT` | `/api/settings/[token]` | Update user preferences |

### Admin Endpoints (Requires Auth via `withAdminAuth`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/admin/stats` | Dashboard statistics (subscriber counts, message counts) |
| `GET` | `/api/admin/subscribers` | List subscribers with optional status filter |
| `PATCH` | `/api/admin/subscribers` | Update subscriber status |
| `DELETE` | `/api/admin/subscribers?id=` | Delete subscriber |
| `POST` | `/api/admin/subscribers/import` | Bulk import subscribers from CSV |
| `GET` | `/api/admin/settings` | Get mosque settings |
| `PUT` | `/api/admin/settings` | Update mosque settings (**invalidates prayer cache**) |
| `GET` | `/api/admin/announcements/data` | Announcements page data (mosque, active count, recent) |
| `POST` | `/api/admin/announcements` | Send announcement immediately (**concurrent**) |
| `GET` | `/api/admin/announcements/schedule` | List scheduled messages |
| `POST` | `/api/admin/announcements/schedule` | Create scheduled message |
| `DELETE` | `/api/admin/announcements/schedule/[id]` | Cancel scheduled message |
| `GET` | `/api/admin/analytics` | Analytics data (subscriber growth, message types, status) |

### Cron Endpoints (Requires CRON_SECRET)

| Method | Endpoint | Schedule | Purpose |
|--------|----------|----------|---------|
| `GET` | `/api/cron/prayer-reminders` | Every 5 mins | Prayer reminders + scheduled messages |
| `GET` | `/api/cron/daily-hadith` | Every 5 mins | **Dynamic:** Sends 15 min after Fajr (morning) and Maghrib (evening) |
| `GET` | `/api/cron/jumuah-reminder` | Every 5 mins | Friday reminder (checks if 2 hours before khutbah) |
| `GET` | `/api/cron/ramadan-reminders` | Every 5 mins | Suhoor/Iftar/Taraweeh |
| `GET` | `/api/cron/nafl-reminders` | Every 5 mins | Tahajjud/Ishraq/Awwabin |

> **Note:** As of v1.7.1, all cron jobs run every 5 minutes and use **dynamic prayer-time-based scheduling**. Fixed UTC times are no longer used. Each job checks the current time against mosque prayer times and only sends when appropriate.

---

## Database Schema

### Tables Overview

| Table | Purpose | RLS |
|-------|---------|-----|
| `mosques` | Mosque configuration | ✅ |
| `subscribers` | User subscriptions | ✅ |
| `admins` | Admin users | ✅ |
| `messages` | Message log (all notification types) | ✅ |
| `daily_hadith_log` | Tracks sent hadiths | ✅ |
| `prayer_times_cache` | API response cache (with INSERT/UPDATE policies) | ✅ |
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

### Key Table: messages (v1.8.0 - Added metadata column)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `mosque_id` | UUID | Foreign key to mosques |
| `type` | TEXT | **prayer / hadith / announcement / ramadan / welcome / jumuah / nafl / webhook_command** |
| `content` | TEXT | Message content |
| `sent_to_count` | INT | Number of recipients |
| `sent_at` | TIMESTAMP | When sent |
| `sent_by` | UUID | Admin who sent (null for automated) |
| `status` | TEXT | **pending / sent / failed / received** |
| `metadata` | JSONB | Additional data (prayer name, hadith source, etc.) |

### Key Table: scheduled_messages

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `mosque_id` | UUID | Foreign key to mosques |
| `content` | TEXT | Message content |
| `scheduled_at` | TIMESTAMP | When to send |
| `status` | TEXT | pending / sent / cancelled / **failed** |
| `sent_at` | TIMESTAMP | When actually sent |
| `retry_count` | INT | **Number of failed attempts** (v1.6.0) |
| `created_at` | TIMESTAMP | Creation time |
| `created_by` | TEXT | Admin who created |

---

## Project Structure

```
masjid-notify/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing page
│   │   ├── layout.tsx                  # Root layout
│   │   ├── not-found.tsx               # Branded 404 page (v1.6.0)
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
│   │       │   ├── stats/route.ts          # Dashboard stats
│   │       │   ├── subscribers/route.ts    # Subscribers CRUD
│   │       │   ├── subscribers/import/route.ts # CSV bulk import
│   │       │   ├── settings/route.ts       # Mosque settings GET/PUT (cache invalidation)
│   │       │   ├── analytics/route.ts      # Analytics charts data
│   │       │   └── announcements/
│   │       │       ├── route.ts            # Send announcement (concurrent)
│   │       │       ├── data/route.ts       # Announcements page data
│   │       │       └── schedule/           # Scheduled messages
│   │       │
│   │       ├── cron/
│   │       │   ├── prayer-reminders/route.ts    # Prayer reminders (retry limits)
│   │       │   ├── daily-hadith/route.ts
│   │       │   ├── jumuah-reminder/route.ts
│   │       │   ├── ramadan-reminders/route.ts   # Uses isWithinMinutesAfter
│   │       │   └── nafl-reminders/route.ts
│   │       │
│   │       ├── settings/[token]/route.ts        # User preferences (validation)
│   │       │
│   │       └── webhook/whatsapp/route.ts        # WhatsApp webhook (structure validation)
│   │
│   ├── components/
│   │   ├── ui/                         # shadcn components
│   │   │   └── checkbox.tsx            # Accessible checkbox (v1.6.0)
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
│   │       ├── subscribers-table.tsx   # Delete confirmation, ARIA labels (v1.6.0)
│   │       └── subscriber-import.tsx
│   │
│   └── lib/
│       ├── supabase.ts                 # Database clients + types
│       ├── whatsapp.ts                 # WhatsApp API
│       ├── whatsapp-templates.ts       # Template definitions
│       ├── prayer-times.ts             # Aladhan API + cache (NaN-safe, timezone-aware)
│       ├── hadith-api.ts               # External hadith API (Fisher-Yates shuffle)
│       ├── message-sender.ts           # Concurrent sending (error handling)
│       ├── ratelimit.ts                # Rate limiting (IP spoofing protection)
│       ├── auth.ts                     # Auth utilities (constant-time comparison)
│       ├── constants.ts                # Time constants (v1.6.0, updated v1.7.1)
│       ├── reminder-locks.ts           # Atomic reminder locking utility (v1.7.0)
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
│       ├── 006_simplify_preferences.sql
│       ├── 007_add_ramadan_columns.sql
│       ├── 008_prayer_reminder_locks.sql
│       ├── 009_fix_messages_constraints.sql  # (v1.6.3) Fix CHECK constraints
│       └── 010_unified_reminder_locks.sql    # (v1.7.0) Unified atomic locking
│       ├── 011_add_messages_metadata.sql  # (v1.8.0) Add metadata JSONB column
│
├── playwright.config.ts               # Test configuration
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
├── vercel.json
├── CLAUDE.md                          # AI assistant instructions
└── .env.local.example
```

---

## External Cron Setup (cron-job.org)

### Why External Cron?

Vercel's free tier only supports daily cron jobs. For real-time prayer reminders (every 5 minutes), use cron-job.org.

### Account Setup

1. Go to https://cron-job.org
2. Click "Sign Up" (free account)
3. Verify email

### Cron Jobs to Create (5 Jobs - All Every 5 Minutes)

> **IMPORTANT (v1.7.1):** As of v1.7.1, ALL cron jobs run every 5 minutes. The old fixed-time hadith jobs have been replaced with a single dynamic job that checks prayer times.

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

**Job 4: Daily Hadith (Dynamic Timing)**
- Title: `Masjid Notify - Daily Hadith`
- URL: `https://masjid-notify.vercel.app/api/cron/daily-hadith`
- Schedule: `*/5 * * * *` (every 5 minutes)
- Headers: `Authorization: Bearer masjidnotify2025cron`
- **Note:** This replaces the old morning/evening hadith jobs. The endpoint now checks prayer times and sends:
  - Morning hadith: 15 minutes after Fajr
  - Evening hadith: 15 minutes after Maghrib

**Job 5: Jumu'ah Reminder**
- Title: `Masjid Notify - Jumu'ah Reminder`
- URL: `https://masjid-notify.vercel.app/api/cron/jumuah-reminder`
- Schedule: `*/5 * * * *` (every 5 minutes)
- Headers: `Authorization: Bearer masjidnotify2025cron`
- **Note:** Only sends on Fridays, 2 hours before khutbah time

### Migration from Old Cron Configuration

If you have the old cron configuration with separate morning/evening hadith jobs:

| Old Job | Action |
|---------|--------|
| `Morning Hadith` (3:30 AM UTC) | **DELETE** |
| `Evening Hadith` (4:00 PM UTC) | **DELETE** |

Then create the new `Daily Hadith` job as shown above (runs every 5 minutes).

---

## External Services & Accounts

### All The Services We Use

| Service | What It Does | Dashboard URL | Account |
|---------|--------------|---------------|---------|
| **Vercel** | Hosts the website and API | https://vercel.com/alqodes-projects/masjid-notify | alqodez@gmail.com |
| **Supabase** | Database + Authentication | https://supabase.com/dashboard/project/jlqtuynaxuooymbwrwth | alqodez@gmail.com |
| **Meta Business** | WhatsApp API access | https://business.facebook.com | alqodez@gmail.com |
| **cron-job.org** | Runs scheduled jobs every 5 mins | https://cron-job.org | alqodez@gmail.com |
| **GitHub** | Code repository | https://github.com/alqode-dev/masjid-notify | alqodez@gmail.com |

### Vercel (Website Hosting)

**What it is:** Vercel hosts our Next.js website. When you push to GitHub, it automatically deploys.

**Key things to know:**
- Free tier (Hobby plan)
- Auto-deploys on every `git push`
- Has its own cron jobs (daily only on free tier - that's why we use cron-job.org)
- Logs available for debugging

### Supabase (Database)

**What it is:** Supabase is our PostgreSQL database with a nice UI. It also handles user authentication for the admin login.

**Key things to know:**
- Project ID: `jlqtuynaxuooymbwrwth`
- Has Row Level Security (RLS) - some queries need admin privileges
- Free tier has limits but we're well under them

**Important tables:**
- `mosques` - Mosque settings (prayer calculation, times, etc.)
- `subscribers` - All subscribed users
- `messages` - Log of all sent messages
- `admins` - Admin users linked to mosques
- `daily_hadith_log` - Tracks which hadith was sent each day
- `prayer_times_cache` - Caches prayer times to reduce API calls (**invalidated on settings change**)
- `scheduled_messages` - Future scheduled announcements (**with retry tracking**)

### Meta Business / WhatsApp Cloud API

**What it is:** Meta (Facebook) provides the WhatsApp Business API. We use it to send messages.

**Key things to know:**
- Currently ACTIVE (restored after appeal)
- Need to submit message templates for approval
- Has rate limits and quality scores
- Phone Number ID: `895363247004714`
- Business Account ID: `1443752210724410`

**How to access:**
1. Go to https://business.facebook.com
2. Login
3. Go to WhatsApp Manager

### cron-job.org (Scheduled Tasks)

**What it is:** A free service that calls our API endpoints on a schedule.

**Key things to know:**
- Free tier allows many jobs
- Each job calls a URL with headers on a schedule
- We have 5 jobs set up

**Our jobs (all every 5 minutes since v1.7.1):**
1. Prayer Reminders - every 5 mins
2. Ramadan Reminders - every 5 mins
3. Nafl Reminders - every 5 mins
4. Daily Hadith - every 5 mins (dynamic: sends 15 min after Fajr/Maghrib)
5. Jumu'ah Reminder - every 5 mins (sends on Fridays, 2 hours before khutbah)

### GitHub (Code Repository)

**What it is:** Where all the code lives. Push here to deploy.

**Key things to know:**
- Main branch: `master`
- Push to master = auto-deploy to Vercel

---

## Credentials Quick Reference

### Admin Dashboard Login
- **URL:** https://masjid-notify.vercel.app/admin/login
- **Email:** alqodez@gmail.com
- **Password:** (your Supabase auth password)

### Cron Job Authentication
- **Header:** `Authorization: Bearer masjidnotify2025cron`
- **Used by:** cron-job.org when calling our API

### WhatsApp Webhook Verification
- **Token:** `masjidnotifywebhook2025`
- **Used by:** Meta when verifying our webhook

### Supabase Service Role Key
- **Location:** Vercel environment variables
- **Name:** `SUPABASE_SERVICE_ROLE_KEY`
- **Used for:** Server-side database operations that bypass RLS

---

## Changelog

### Version 1.8.0 - February 8, 2026

**CRITICAL: Fix Webhook Message Reception & Message Logging**

This release fixes two critical production issues: WhatsApp webhook commands (STOP, PAUSE, SETTINGS, HELP) not working because the WABA was not subscribed to the app, and all prayer/nafl message logging silently failing because the `metadata` JSONB column didn't exist on the `messages` table.

#### WhatsApp Webhook Fixed

| Issue | Root Cause | Solution |
|-------|------------|----------|
| **Commands not working (STOP, PAUSE, SETTINGS, HELP)** | WhatsApp Business Account (WABA) was subscribed to "WANotifier App" but NOT to our own "Alqode Masjid Notify" app | Subscribed WABA to app via Graph API: `POST /v18.0/1443752210724410/subscribed_apps` |
| **No POST requests reaching webhook** | Without WABA subscription, Meta never delivers incoming messages to our webhook endpoint | WABA subscription fixed this - POST requests now appear in Vercel logs |
| **Signature verification failing** | `WHATSAPP_APP_SECRET` in Vercel must match Meta App Secret exactly | User must verify: Meta > App Dashboard > App Settings > Basic > App Secret matches Vercel env var |

**How WABA subscription works:**
- The WhatsApp Business Account must be explicitly subscribed to your app via the Graph API
- This is separate from webhook URL verification (which only proves your server can respond)
- Without this subscription, Meta will not deliver any incoming messages to your webhook
- Command: `curl -X POST "https://graph.facebook.com/v18.0/{WABA_ID}/subscribed_apps" -H "Authorization: Bearer {ACCESS_TOKEN}"`

#### Message Logging Fixed

| Issue | Root Cause | Solution |
|-------|------------|----------|
| **Prayer messages not logged in dashboard** | `messages` table was missing `metadata` JSONB column | Created migration 011 to add the column |
| **Nafl messages not logged** | Same - all inserts with `metadata` field failed with PGRST204 | Same migration fix |
| **Scheduled message logging failing** | Same root cause | Same migration fix |
| **Database evidence** | `prayer_reminder_locks` had entries for ALL prayers but `messages` table had ZERO entries | Confirms messages were sent to WhatsApp but DB logging failed |

**Additional resilience:** Added PGRST204 fallback retry in prayer-reminders and nafl-reminders routes. If the metadata column doesn't exist, the insert is retried without metadata so messages are still logged.

#### Migration Required

Run `supabase/migrations/011_add_messages_metadata.sql` in Supabase SQL Editor:

```sql
ALTER TABLE messages ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_metadata ON messages USING gin (metadata);
```

#### Files Changed

| File | Change |
|------|--------|
| `supabase/migrations/011_add_messages_metadata.sql` | **NEW** - Adds metadata JSONB column to messages table |
| `src/app/api/cron/prayer-reminders/route.ts` | Added PGRST204 fallback retry for prayer + scheduled message inserts |
| `src/app/api/cron/nafl-reminders/route.ts` | Added PGRST204 fallback retry for tahajjud, ishraq, awwabin message inserts |

---

### Version 1.7.2 - February 6, 2026

**Comprehensive Codebase Audit - Security, Accessibility & Bug Fixes**

This release addresses 40+ issues identified through a thorough codebase audit, covering security vulnerabilities, accessibility gaps, CSS bugs, and code quality improvements across 22 files.

#### Security Fixes

| Issue | Fix | File |
|-------|-----|------|
| **XSS in QR print** | HTML entity escaping in `document.write()` | `qr-code.tsx` |
| **Supabase errors leaked to client** | Sanitized error messages in settings API | `admin/settings/route.ts` |
| **Auth details leaked on failed login** | Generic "Invalid credentials" error message | `admin/login/page.tsx` |
| **Admin URL exposed on 404 page** | Removed admin link from public 404 page | `not-found.tsx` |
| **Import missing validation** | Phone validation + size limits on CSV import | `admin/subscribers/import/route.ts` |
| **Status field not validated** | Status validated on subscriber PATCH | `admin/subscribers/route.ts` |

#### Accessibility Fixes

| Issue | Fix | File |
|-------|-----|------|
| **Login form missing labels** | Added form labels and autoComplete attributes | `admin/login/page.tsx` |
| **Sidebar missing ARIA** | Added aria-label to hamburger button and mobile nav | `sidebar.tsx` |
| **Error states not announced** | Added role=alert to error messages | Multiple files |
| **Decorative icons read aloud** | Added aria-hidden to decorative icons | Multiple files |
| **Search input missing label** | Added accessible label for subscriber search | `subscribers-table.tsx` |

#### CSS & UI Fixes

| Issue | Fix | File |
|-------|-----|------|
| **`hsl(oklch(...))` invalid** | Use `var(--css-var)` directly (Tailwind CSS 4 uses oklch) | Multiple files |
| **Framer Motion 25s delay** | Capped animation delay with `Math.min()` for large lists | `subscribers-table.tsx` |
| **`URL.createObjectURL()` leak** | Added `revokeObjectURL()` cleanup | `qr-code.tsx` |
| **Clipboard API unhandled rejection** | Added await + catch to `navigator.clipboard.writeText()` | Multiple files |

#### Code Quality Fixes

| Issue | Fix | File |
|-------|-----|------|
| **`parseInt("")` returns NaN** | Added fallback: `parseInt(val, 10) \|\| default` | Multiple files |
| **`??` defaults reset fields** | Use conditional object building for updates | `admin/settings/route.ts` |
| **Missing mosque null checks** | Added early return on null mosque data | Multiple cron routes |

#### Files Changed (22 files)

See git commit `8b022a8` for full diff.

---

### Version 1.7.1 - February 6, 2026

**MAJOR: Dynamic Hadith Timing & Ishraq Fix**

This release changes hadith notifications from fixed UTC times to dynamic prayer-based timing, and fixes Ishraq reminder to a practical time.

#### Dynamic Hadith Timing (BREAKING CHANGE)

Hadith notifications now send **15 minutes after prayer times** instead of at fixed UTC times:

| Hadith | Old (Fixed UTC) | New (Dynamic) |
|--------|-----------------|---------------|
| Morning hadith | 3:30 AM UTC (5:30 AM SAST) | **15 min after Fajr** (~6:00 AM in summer, ~7:00 AM in winter) |
| Evening hadith | 4:00 PM UTC (6:00 PM SAST) | **15 min after Maghrib** (~6:30 PM in summer, ~8:00 PM in winter) |

**Benefits:**
- Hadith timing follows actual prayer times throughout the year
- No more out-of-context timing (old evening hadith at 6 PM was before Maghrib in summer)
- Consistent user experience regardless of season

#### Ishraq Reminder Timing Fixed

Changed from 20 minutes after sunrise (~6:30 AM) to **3 hours after sunrise (~9:00 AM)** so users can actually act on the reminder during work hours.

| Setting | Old Value | New Value |
|---------|-----------|-----------|
| `ISHRAQ_MINUTES_AFTER_SUNRISE` | 20 | **180** |

#### cron-job.org Migration Required

**DELETE these old jobs:**
- Morning Hadith (3:30 AM UTC)
- Evening Hadith (4:00 PM UTC)

**CREATE this new job:**
- Daily Hadith - `*/5 * * * *` - `https://masjid-notify.vercel.app/api/cron/daily-hadith`

See [External Cron Setup](#external-cron-setup-cron-joborg) for full configuration.

#### Files Changed

| File | Change |
|------|--------|
| `src/app/api/cron/daily-hadith/route.ts` | Completely rewritten to use dynamic prayer-based timing |
| `src/lib/constants.ts` | Added `HADITH_MINUTES_AFTER_PRAYER = 15`, fixed `ISHRAQ_MINUTES_AFTER_SUNRISE = 180` |

---

### Version 1.7.0 - February 6, 2026

**MAJOR: Fix Duplicate Reminders & Improve Reliability**

This release fixes critical duplicate message issues reported by users and improves webhook command handling.

#### Duplicate Reminders Fixed (CRITICAL)

All reminder types now use atomic database locking to prevent duplicates when cron runs overlap:

| Component | Issue | Solution |
|-----------|-------|----------|
| **Nafl Reminders** | Tahajjud/Ishraq/Awwabin sent 2x | Added atomic locking via `tryClaimReminderLock()` |
| **Jumu'ah Reminder** | Sent multiple times on Friday | Added atomic locking (was ZERO protection before!) |
| **Daily Hadith** | Could send twice | Added atomic locking with `hadith_morning`/`hadith_evening` keys |
| **Ramadan Reminders** | Suhoor/Iftar/Taraweeh could duplicate | Replaced time-based check with atomic locking |

#### New Files

| File | Purpose |
|------|---------|
| `src/lib/reminder-locks.ts` | Shared utility for atomic reminder locking across all cron jobs |
| `supabase/migrations/010_unified_reminder_locks.sql` | Ensures lock table exists and is properly configured |

#### Supported Lock Types

The `ReminderType` in `reminder-locks.ts` supports:
- **Prayers:** `fajr`, `dhuhr`, `asr`, `maghrib`, `isha`
- **Hadith:** `hadith_morning`, `hadith_evening`
- **Jumu'ah:** `jumuah`
- **Nafl:** `tahajjud`, `ishraq`, `awwabin`
- **Ramadan:** `suhoor`, `suhoor_planning`, `iftar`, `taraweeh`

#### Ishraq Timing Fixed

Changed from 20 minutes after sunrise (~6:30 AM) to 3 hours after sunrise (~9:00 AM) so users can actually act on the reminder during work hours.

#### Webhook Command Logging Improved

Added comprehensive logging to help diagnose STOP/PAUSE/SETTINGS command issues:
- Clear error messages when `WHATSAPP_APP_SECRET` is not configured
- Success/failure logging for all commands
- Database update error handling with user feedback

#### Migration Required

Run `supabase/migrations/010_unified_reminder_locks.sql` in Supabase SQL Editor.

#### cron-job.org Configuration (v1.7.0)

> **Note:** This was later superseded by v1.7.1 which uses dynamic prayer-based timing. See the v1.7.1 changelog for the current configuration.

#### Verify WHATSAPP_APP_SECRET

If STOP/SETTINGS/PAUSE commands are not working, check Vercel Dashboard > Settings > Environment Variables and ensure `WHATSAPP_APP_SECRET` is set to your Meta App Secret.

---

### Version 1.6.3 - February 5, 2026

**CRITICAL: Fix Empty Messages & Prayer Times Cache Tables**

The `messages` and `prayer_times_cache` tables were always empty because database CHECK constraints and RLS policies were blocking inserts.

#### Root Causes Fixed

| Issue | Cause | Solution |
|-------|-------|----------|
| **Messages table empty** | CHECK constraint only allowed types: `prayer`, `hadith`, `announcement`, `ramadan`, `welcome`, `jumuah` | Added `nafl` and `webhook_command` to allowed types |
| **Messages table empty** | CHECK constraint only allowed statuses: `pending`, `sent`, `failed` | Added `received` to allowed statuses |
| **Messages missing status column** | Column didn't exist in production database | Migration adds column if missing |
| **Prayer times cache empty** | RLS enabled but no INSERT/UPDATE policies | Added permissive policies for service role |

#### Migration Required

Run `supabase/migrations/009_fix_messages_constraints.sql` in Supabase SQL Editor:

```sql
-- Updates messages type constraint
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_type_check;
ALTER TABLE messages ADD CONSTRAINT messages_type_check
  CHECK (type IN ('prayer', 'hadith', 'announcement', 'ramadan', 'welcome', 'jumuah', 'nafl', 'webhook_command'));

-- Adds status column if missing, updates constraint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'status') THEN
    ALTER TABLE messages ADD COLUMN status VARCHAR(20) DEFAULT 'sent';
  END IF;
END $$;

ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_status_check;
ALTER TABLE messages ADD CONSTRAINT messages_status_check
  CHECK (status IN ('pending', 'sent', 'failed', 'received'));

-- Adds RLS policies for prayer_times_cache
CREATE POLICY "Service role can insert prayer times cache" ON prayer_times_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can update prayer times cache" ON prayer_times_cache FOR UPDATE USING (true) WITH CHECK (true);
```

#### Files Changed

| File | Change |
|------|--------|
| `supabase/migrations/009_fix_messages_constraints.sql` | **NEW** - Migration to fix constraints |
| `src/lib/supabase.ts` | Updated `Message` type to include `nafl`, `webhook_command` types and `received` status |

#### Impact

- ✅ Nafl reminder cron (`/api/cron/nafl-reminders`) can now log messages
- ✅ Webhook commands (STOP, START, PAUSE, etc.) can now be logged
- ✅ Prayer times will be cached, reducing Aladhan API calls
- ✅ Messages table will populate with all notification types

---

### Version 1.6.2 - February 5, 2026

**CRITICAL: Hadith API Migration**

The original hadith API (random-hadith-generator.vercel.app) was down/returning 404 errors. This release completely rewrites the hadith integration using a reliable CDN-hosted alternative.

#### Changes

| Category | Description |
|----------|-------------|
| **API Migration** | Replaced dead random-hadith-generator.vercel.app with fawazahmed0/hadith-api hosted on jsDelivr CDN |
| **6 Collections** | Now supports Bukhari, Muslim, Abu Dawud, Tirmidhi, Ibn Majah, Nasai |
| **Reliability** | jsDelivr CDN provides high availability and caching |
| **Retry Logic** | 5 attempts per collection to find valid hadith |
| **Rate Limiting** | Uses HADITH_API_DELAY_MS constant between retries |
| **TypeScript** | Full type definitions for API responses |

#### API Details

```typescript
const HADITH_CDN_BASE = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1";

export const HADITH_COLLECTIONS = [
  { name: "bukhari", source: "Sahih al-Bukhari", edition: "eng-bukhari", maxHadith: 7563 },
  { name: "muslim", source: "Sahih Muslim", edition: "eng-muslim", maxHadith: 7563 },
  { name: "abudawud", source: "Sunan Abu Dawud", edition: "eng-abudawud", maxHadith: 5274 },
  { name: "tirmidhi", source: "Jami at-Tirmidhi", edition: "eng-tirmidhi", maxHadith: 3956 },
  { name: "ibnmajah", source: "Sunan Ibn Majah", edition: "eng-ibnmajah", maxHadith: 4341 },
  { name: "nasai", source: "Sunan an-Nasa'i", edition: "eng-nasai", maxHadith: 5758 },
];
```

**Impact:** Daily hadith notifications now work reliably. Without this fix, all hadith-related features were broken.

---

### Version 1.6.1 - February 5, 2026

**P3 Fixes + Social Preview Image**

This release completes the comprehensive bug fix initiative with 15 additional P3 fixes and adds custom OG image for social sharing.

#### Highlights

- **Social Sharing:** Custom OG image for WhatsApp/social media previews
- **Security:** Timing-safe comparison for webhook verify token
- **Validation:** reminder_offset validation, token param validation
- **Constants:** 15+ magic numbers extracted to constants.ts
- **Error Handling:** All cron job message inserts now have error handling
- **Code Quality:** Stable hash ID for hadith fallback, shared REMINDER_OPTIONS

#### Changes

| Category | Count |
|----------|-------|
| Security fixes | 2 |
| Validation fixes | 3 |
| Error handling | 4 |
| Constants extraction | 6 |
| Social/SEO | 1 |

---

### Version 1.6.0 - February 5, 2026

**Comprehensive Bug Fix & Security Release**

This release addresses 22 issues identified through thorough code review, including 2 critical security fixes, 5 high-priority fixes, and numerous code quality improvements.

#### Highlights

- **Security:** Fixed IP spoofing vulnerability in rate limiting
- **Reliability:** Scheduled messages now have retry limits (max 5 attempts)
- **Performance:** Announcements now send concurrently (10 at a time)
- **UX:** Delete confirmation prevents accidental subscriber deletion
- **Accessibility:** ARIA labels and proper form linking throughout
- **Code Quality:** Constants extracted, NaN-safe parsing, proper algorithms

#### Full Change List

See [Recent Bug Fixes](#recent-bug-fixes) section for complete details.

---

### Version 1.5.1 - February 4, 2026

- Fixed mosque coordinates (Cape Town → Rondebosch East)
- WhatsApp account restored after Meta appeal
- Enhanced error logging for message inserts

---

### Version 1.5.0 - February 3, 2026

- Complete admin dashboard API migration (RLS fix)
- 9 admin pages migrated to server-side routes
- Migration 007 for Ramadan columns
- WhatsApp 24-hour policy notice added

---

### Version 1.4.0 - February 2, 2026

- Nafl Salah Reminders (Tahajjud, Ishraq, Awwabin)
- Twice-Daily Hadith (morning & evening)
- Enhanced Suhoor Planning Reminder
- Security: Mosque-scoped admin operations

---

### Version 1.3.0 - February 2, 2026

- 101 E2E tests with Playwright
- Server-side API routes for admin dashboard
- Fixed "0 subscribers" bug

---

### Version 1.0.0 - January 31, 2026

- Initial production release
- 24 user stories completed

---

## Support

### Resources

| Resource | URL |
|----------|-----|
| **GitHub Repo** | https://github.com/alqode-dev/masjid-notify |
| **Vercel Dashboard** | https://vercel.com/alqodes-projects/masjid-notify |
| **Supabase Dashboard** | https://supabase.com/dashboard/project/jlqtuynaxuooymbwrwth |
| **Meta Developer Console** | https://developers.facebook.com/apps |
| **Hadith API Docs** | https://github.com/fawazahmed0/hadith-api |

---

**Document Version:** 1.8.0
**Last Updated:** February 8, 2026 @ 18:00 SAST
**Author:** Claude Code
**Status:** Production-Ready - WhatsApp templates pending Meta approval, Webhook WABA subscription fixed (v1.8.0), Message logging fixed (v1.8.0)
