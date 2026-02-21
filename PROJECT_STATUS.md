# Masjid Notify - Project Status

> **Last Updated:** February 21, 2026 @ 12:00 SAST
> **Version:** 3.0.0
> **Status:** Production - Web Push PWA (WhatsApp completely removed, replaced with browser push notifications)
> **Production URL:** https://masjid-notify.vercel.app

---

## Quick Links

| Resource | URL |
|----------|-----|
| **Landing Page** | https://masjid-notify.vercel.app |
| **Subscriber Settings** | https://masjid-notify.vercel.app/settings |
| **Notification Center** | https://masjid-notify.vercel.app/notifications |
| **Admin Login** | https://masjid-notify.vercel.app/admin/login |
| **Admin Dashboard** | https://masjid-notify.vercel.app/admin |
| **Privacy Policy** | https://masjid-notify.vercel.app/privacy |
| **Terms of Service** | https://masjid-notify.vercel.app/terms |
| **Data Deletion** | https://masjid-notify.vercel.app/data-deletion |
| **GitHub Repo** | https://github.com/alqode-dev/masjid-notify |
| **Vercel Dashboard** | https://vercel.com/alqodes-projects/masjid-notify |
| **Supabase Dashboard** | https://supabase.com/dashboard/project/jlqtuynaxuooymbwrwth |
| **Audio Library** | https://masjid-notify.vercel.app/listen |

---

## Table of Contents

### Getting Started (Read First!)
1. [What Is This Project?](#what-is-this-project)
2. [How Everything Works Together](#how-everything-works-together)
3. [Quick Start for Developers](#quick-start-for-developers)

### Current Status
4. [System Status](#system-status)
5. [What's Working vs Not Working](#whats-working-vs-not-working)

### How To Do Things
6. [Common Tasks & How-To Guides](#common-tasks--how-to-guides)
7. [Testing the App](#testing-the-app)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Web Push & PWA Setup](#web-push--pwa-setup)
10. [How to Clean Up Meta / WhatsApp](#how-to-clean-up-meta--whatsapp)

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

**Masjid Notify** is a PWA (Progressive Web App) push notification platform for mosques. Here's how it works:

1. **Mosque puts up a QR code** (or shares a link)
2. **People scan it** and land on a website
3. **They enable browser notifications** and choose what reminders they want
4. **They automatically receive push notifications** for:
   - Prayer time reminders (5 daily prayers)
   - Friday (Jumu'ah) reminders
   - Daily hadith (Islamic teachings)
   - Ramadan reminders (Suhoor, Iftar, Taraweeh)
   - Voluntary prayer reminders (Tahajjud, Ishraq, Awwabin)
   - Mosque announcements

### Who Is This For?

- **Mosques** who want to send automated reminders to their community
- **Muslims** who want prayer time notifications directly on their phone or computer

### Why Web Push?

- **No app download needed** — works directly in the browser
- **Works on all modern browsers** — Chrome, Firefox, Edge, Safari (iOS 16.4+)
- **Installable as PWA** — users can add to home screen for an app-like experience
- **No phone number required** — just grant notification permission
- **Free to send** — no per-message costs (unlike WhatsApp Business API)
- **No third-party approval needed** — no Meta templates, no app review

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
│   3. Enables notifications       4. Push subscription saved             │
│        🔔 ──────────────────────> 🗄️ Supabase (PostgreSQL)              │
│                                                                          │
│   5. Welcome notification sent   6. User receives push notification     │
│        📤 ──────────────────────> 🔔 Browser / PWA                      │
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
│                           Push via   next check                          │
│                           Web Push API                                   │
│                           (concurrent, p-limit 10)                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### The Key Components

| Component | What It Does | Where It Lives |
|-----------|--------------|----------------|
| **Frontend** | The website users see (subscribe form, admin dashboard, settings, notifications) | Vercel (Next.js) |
| **Backend API** | Handles subscriptions, sends push notifications, processes cron jobs | Vercel (Next.js API routes) |
| **Database** | Stores subscribers, mosques, messages, notifications, settings | Supabase (PostgreSQL) |
| **Web Push API** | Actually delivers push notifications to browsers | Browser Push Services (FCM, Mozilla, APNs) |
| **Service Worker** | Receives push events, shows notifications, handles clicks | Browser (Serwist-compiled `sw.ts`) |
| **Prayer Times API** | Calculates accurate prayer times by location | Aladhan API |
| **Hadith API** | Provides authentic daily hadith | fawazahmed0/hadith-api (jsDelivr CDN) |
| **Cron Scheduler** | Triggers reminder checks every 5 minutes | cron-job.org |

### Data Flow Example: Prayer Reminder

1. **cron-job.org** calls `https://masjid-notify.vercel.app/api/cron/prayer-reminders` every 5 minutes
2. **Our API** authenticates the request using constant-time comparison (prevents timing attacks)
3. **Our API** fetches all mosques from **Supabase**
4. For each mosque, it calls **Aladhan API** to get today's prayer times (with caching)
5. It checks: "Is current time within 5 minutes of [prayer time minus user's offset]?" (timezone-aware)
6. If YES, it checks the **reminder lock** using `tryClaimReminderLock()` — atomic INSERT with UNIQUE constraint prevents duplicate sends
7. If lock acquired, it fetches subscribers who want that prayer reminder from **Supabase**
8. For each subscriber, it sends a **push notification** via `web-push` npm package with VAPID authentication (concurrent, max 10 at once)
9. If a push subscription returns **410 Gone**, the subscriber is auto-unsubscribed (expired subscription)
10. It logs the sent message to **Supabase** (messages table) and stores in-app notification (notifications table)
11. It updates `last_message_at` for successful sends (batch update, 100 per batch)
12. **AFTER** all prayers are processed, auxiliary tasks run in isolated try-catches: process scheduled messages, auto-resume paused subscribers

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
# Key additions for v3.0: NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT

# 4. Generate VAPID keys (if you don't have them yet)
npx web-push generate-vapid-keys
# Copy the public and private keys into .env.local

# 5. Run development server
npm run dev

# 6. Open http://localhost:3000
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
3. Browse tables: `subscribers`, `mosques`, `messages`, `notifications`, etc.

### If You Want to Check Logs

1. Go to https://vercel.com/alqodes-projects/masjid-notify
2. Click "Logs" tab
3. Filter by function name (e.g., `api/cron/prayer-reminders`)

---

## What's Working vs Not Working

### ✅ Currently Working

| Feature | Status | Notes |
|---------|--------|-------|
| Landing page | ✅ Works | Shows prayer times, subscribe form, dynamic location from DB |
| Subscribe form | ✅ Works | Enable notifications → choose preferences → subscribe (no phone number) |
| Web Push sending | ✅ Works | VAPID-authenticated push notifications to all major browsers |
| Welcome notifications | ✅ Works | Sent on subscription via push notification |
| Service Worker | ✅ Works | Handles push events, notification clicks, PWA offline support |
| PWA installable | ✅ Works | manifest.json, icons, standalone display mode |
| Subscriber Settings | ✅ Works | `/settings` page — update preferences, pause, unsubscribe (localStorage-based ID) |
| Notification Center | ✅ Works | `/notifications` page — view all received notifications in-app |
| Admin login | ✅ Works | Email: alqodez@gmail.com |
| Admin dashboard | ✅ Works | Stats cards, subscriber counts, analytics charts, **middleware-protected (v1.9.0)** |
| Admin subscribers | ✅ Works | Table with ARIA labels, search, filter, export, **delete confirmation** |
| Admin announcements | ✅ Works | Send now (concurrent push), schedule, templates |
| Admin settings | ✅ Works | Prayer settings save, **cache invalidated on change** |
| Admin QR code | ✅ Works | Generate and download QR codes |
| Admin analytics | ✅ Works | Subscriber growth, message types, status breakdown, **optimized queries (v1.9.0)** |
| Database | ✅ Works | All tables created and functional, **notifications table added (v3.0)** |
| Cron jobs | ✅ Works | All 5 jobs running, **core-first architecture (v1.9.1)**, auto-resume paused subs, scheduled msg processing, retry limits |
| Prayer times API | ✅ Works | Aladhan API, **timezone-aware**, **NaN-safe parsing**, **midnight wraparound** |
| Hadith API | ✅ Works | **jsDelivr CDN** (v1.6.2), 6 authentic collections, **Fisher-Yates shuffle** |
| Rate limiting | ✅ Works | **Secure IP detection** (x-vercel-forwarded-for, rightmost IP) |
| 404 page | ✅ Works | Branded not-found page, **no admin link exposed (v1.7.2)** |
| Error handling | ✅ Works | Comprehensive logging, **batch update error handling** |
| Social preview | ✅ Works | **Custom OG image** for social sharing (v1.6.1) |
| Audio Library | ✅ Works | Upload, manage, stream Islamic lectures/Quran recitations via Supabase Storage, public `/listen` page |
| Custom Prayer Times | ✅ Works | calculation_method=99 mode for manual prayer time entry, bypasses Aladhan API and cache |
| Eid Mode | ✅ Works | Admin can enable Eid mode with Khutbah + Salah times, displayed on landing page |
| Next Salah Countdown | ✅ Works | Live countdown timer on landing page showing time until next prayer |
| Admin Team Management | ✅ Works | Owner can add/remove team members with roles (admin/announcer), creates Supabase Auth users |
| Cron Diagnostics | ✅ Works | Real-time diagnostic endpoint `/api/cron/diagnostics` for debugging cron timing |

### ⚠️ Known Issues

| Issue | Status | Workaround |
|-------|--------|------------|
| ~~**PRODUCTION OUTAGE: Prayer reminders not sending**~~ | ✅ Fixed (v1.9.1) | v1.9.0 audit introduced broken optimistic locking (`status: "sending"` doesn't exist in DB schema) and placed auxiliary code BEFORE core prayer logic. processScheduledMessages crash blocked ALL prayer reminders. Fixed by rewriting route: core logic first, auxiliary after in isolated try-catches, removed broken locking, switched to shared `tryClaimReminderLock`. |
| **iOS requires "Add to Home Screen"** | ⚠️ By design | iOS Safari supports push notifications only after the user adds the PWA to their home screen (iOS 16.4+). This is an Apple platform restriction. |

### 📋 Required Database Migrations

| Migration | Purpose | Status |
|-----------|---------|--------|
| **Migration 009** | Fix messages CHECK constraints + prayer_times_cache RLS | ✅ **REQUIRED** - Run in Supabase SQL Editor |
| **Migration 010** | Unified reminder locks for duplicate prevention | ✅ **REQUIRED** - Run in Supabase SQL Editor |
| **Migration 011** | Add metadata JSONB column to messages table | ✅ **REQUIRED** - Run in Supabase SQL Editor |
| **Migration 012** | Audio collections and files tables for Audio Library | ✅ **REQUIRED** - Run in Supabase SQL Editor |
| **Migration 013** | Eid mode columns on mosques table | ✅ **REQUIRED** - Run in Supabase SQL Editor |
| **Migration 014** | Add eid_khutbah_time column to mosques table | ✅ **REQUIRED** - Run in Supabase SQL Editor |
| **Migration 015** | Make password_hash nullable for team member creation | ✅ **REQUIRED** - Run in Supabase SQL Editor |
| **Migration 016** | Web Push migration — add push columns, drop phone/token columns | ✅ **REQUIRED (v3.0)** - Run in Supabase SQL Editor |
| **Migration 017** | Notifications table for in-app notification center | ✅ **REQUIRED (v3.0)** - Run in Supabase SQL Editor |
| **Migration 018** | Drop legacy phone_number_old column, remove webhook_command type | ✅ **REQUIRED (v3.0)** - Run in Supabase SQL Editor |
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

**Migration 012 Details:**
- Creates `audio_collections` table (id, mosque_id, title, description, display_order)
- Creates `audio_files` table (id, collection_id, title, file_path, file_size, duration_seconds, display_order)
- Enables Supabase Storage for audio files in `audio-files` bucket

**Migration 013 Details:**
- Adds `eid_mode` BOOLEAN DEFAULT FALSE to mosques table
- Adds `eid_salah_time` TIME column to mosques table

**Migration 014 Details:**
- Adds `eid_khutbah_time` TIME column to mosques table
- Separates Khutbah time from Salah time for Eid display

**Migration 015 Details:**
- Alters `admins.password_hash` column to be nullable
- Required for team member creation via Supabase Auth (password stored in auth.users, not admins table)

**Migration 016 Details (v3.0 - Web Push):**
- Adds `push_endpoint`, `push_p256dh`, `push_auth`, `user_agent` columns to subscribers
- Creates UNIQUE index on `(push_endpoint, mosque_id)` for duplicate prevention
- Drops `settings_token` and `settings_token_expires` columns (no longer needed)
- Renames `phone_number` to `phone_number_old` (temporary, dropped in 018)
- Drops old phone unique constraints

**Migration 017 Details (v3.0 - Notifications):**
- Creates `notifications` table (subscriber_id, mosque_id, type, title, body, data, read)
- Indexes for subscriber + read status queries and mosque-wide queries
- RLS enabled with service role full access

**Migration 018 Details (v3.0 - Cleanup):**
- Drops `phone_number_old` column from subscribers
- Removes `webhook_command` from messages type CHECK constraint

---

# PART 2: CURRENT STATUS

---

## System Status

### Component Health Check

| Component | Status | Last Verified | Notes |
|-----------|--------|---------------|-------|
| **Frontend (Next.js)** | ✅ Operational | Feb 21, 2026 | All pages loading, PWA installable, Audio Library, Next Salah countdown, Eid mode, Team management |
| **Backend API** | ✅ Operational | Feb 21, 2026 | All admin endpoints use secure server-side routes, push + settings + notifications APIs added |
| **Database (Supabase)** | ✅ Connected | Feb 21, 2026 | PostgreSQL with RLS, audio tables, eid columns, notifications table, 18 migrations applied |
| **Admin Dashboard** | ✅ Operational | Feb 21, 2026 | All pages functional, accessible, **middleware-protected**, Audio + Team pages added |
| **Admin Settings** | ✅ Operational | Feb 21, 2026 | Custom prayer times, Eid mode, **cache invalidated on save** |
| **Web Push Service** | ✅ Active | Feb 21, 2026 | VAPID-authenticated, concurrent sending via `p-limit(10)`, auto-unsubscribe on 410 Gone |
| **Service Worker** | ✅ Active | Feb 21, 2026 | Serwist-compiled, handles push events + notification clicks, PWA manifest |
| **Notification Center** | ✅ Operational | Feb 21, 2026 | In-app notification history at `/notifications` |
| **Subscriber Settings** | ✅ Operational | Feb 21, 2026 | Preference management at `/settings` via localStorage subscriber ID |
| **Cron Jobs** | ✅ Running | Feb 21, 2026 | 5 jobs, **atomic locking**, **timezone-aware (v2.0.0)**, **core-first architecture**, **dynamic timing**, **cache cleanup** |
| **Hadith API** | ✅ Integrated | Feb 21, 2026 | jsDelivr CDN (6 collections), **dynamic timing**, **timezone-aware caching (v2.0.0)** |
| **Audio Library** | ✅ Operational | Feb 21, 2026 | Supabase Storage integration, public streaming page `/listen` |
| **Team Management** | ✅ Operational | Feb 21, 2026 | Owner-only add/delete admin team members with role-based access |
| **Cron Diagnostics** | ✅ Operational | Feb 21, 2026 | `/api/cron/diagnostics` endpoint for real-time debugging |
| **E2E Tests** | ✅ 101 Passing | Feb 2, 2026 | Full admin dashboard coverage |
| **Rate Limiting** | ✅ Secure | Feb 9, 2026 | **IP spoofing protection** |
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
| **Development Sprint** | January 31 - February 21, 2026 |
| **User Stories Completed** | 30/30 (100%) |
| **E2E Tests** | 101 tests (all passing) |
| **Bug Fixes (v1.6.x-v3.0.0)** | 100+ issues resolved |
| **Total Commits** | 95+ commits |
| **Lines of Code** | ~12,000+ lines |
| **Build Time** | ~4.7 seconds (Turbopack) |
| **Deployment Region** | Washington D.C. (iad1) |

### Key Achievements

- ✅ Full Web Push notification system with VAPID authentication
- ✅ Progressive Web App (PWA) — installable, offline-capable
- ✅ Service Worker for push events and notification clicks
- ✅ In-app Notification Center (`/notifications`)
- ✅ Subscriber Settings page (`/settings`) — no phone number or login required
- ✅ Automated prayer time reminders (timezone-aware)
- ✅ Admin dashboard with analytics
- ✅ Message scheduling system with **retry limits**
- ✅ **101 E2E tests** with Playwright
- ✅ Server-side API routes for admin data
- ✅ **Secure rate limiting** (IP spoofing protection)
- ✅ Real Hadith API Integration (**fair shuffle algorithm**)
- ✅ Legal pages (Privacy, Terms, Data Deletion)
- ✅ **Nafl Salah Reminders** (Tahajjud, Ishraq, Awwabin)
- ✅ **Twice-Daily Hadith** (morning and evening)
- ✅ **Enhanced Suhoor Reminders** (planning + morning)
- ✅ **Security Fixes** (mosque-scoped admin operations)
- ✅ **Accessibility improvements** (ARIA labels, proper form linking)
- ✅ **Prayer cache invalidation** on settings change
- ✅ **Concurrent push sending** for announcements
- ✅ **Branded 404 page**
- ✅ **Dynamic hadith timing** (follows prayer times, not fixed UTC)
- ✅ **Atomic reminder locking** (prevents duplicate messages)
- ✅ **Core-first cron architecture** (prayer reminders always execute first, auxiliary features isolated)
- ✅ **Shared reminder lock utility** (all 5 cron routes use same `tryClaimReminderLock`)
- ✅ **Production incident recovery** (v1.9.1 hotfix for prayer-reminders outage)
- ✅ **Audio Library** (upload, manage, stream Islamic lectures and Quran recitations)
- ✅ **Custom Prayer Times** (manual time entry mode, bypasses API for mosque-set times)
- ✅ **Eid Mode** (special landing page display with Khutbah and Salah times)
- ✅ **Next Salah Countdown** (live countdown timer on landing page)
- ✅ **Admin Team Management** (owner can add/remove admins with role-based permissions)
- ✅ **Cron Reliability Fix** (7 critical timezone handling bugs fixed)
- ✅ **Diagnostic Endpoint** (real-time cron timing and mosque configuration debugging)
- ✅ **Prayer cache auto-cleanup** (entries older than 7 days cleaned up automatically)
- ✅ **WhatsApp fully removed** (v3.0 — replaced with Web Push + PWA)

---

## Code Quality & Security

### Security Features (v1.6.0 - v3.0.0)

| Feature | Implementation | File |
|---------|----------------|------|
| **Constant-time auth comparison** | Prevents timing attacks on cron secret | `auth.ts` |
| **IP spoofing protection** | Uses `x-vercel-forwarded-for` or rightmost IP | `ratelimit.ts` |
| **Mosque-scoped operations** | Admins can only access their mosque's data | All admin routes |
| **Delete confirmation** | Prevents accidental subscriber deletion | `subscribers-table.tsx` |
| **XSS prevention in QR print** | HTML entity escaping in document.write() | `qr-code.tsx` |
| **Sanitized error messages** | Supabase errors not leaked to client | `admin/settings/route.ts` |
| **Generic login errors** | Auth details not leaked on failed login | `admin/login/page.tsx` |
| **No admin link on 404** | Public 404 page does not expose admin URL | `not-found.tsx` |
| **Status validation** | Status field validated on subscriber PATCH | `admin/subscribers/route.ts` |
| **PGRST204 fallback retry** | Message logging survives missing metadata column | `prayer-reminders`, `nafl-reminders` |
| **Edge middleware auth** | Admin routes protected at edge before page loads | `middleware.ts` |
| **Security headers** | HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy | `next.config.ts` |
| **Core-first cron architecture** | Prayer reminders execute FIRST; auxiliary code (scheduled msgs, auto-resume) runs AFTER in isolated try-catches so failures can't block core logic | `prayer-reminders/route.ts` |
| **Shared reminder locking** | All 5 cron routes use shared `tryClaimReminderLock()` from `reminder-locks.ts` with atomic INSERT + UNIQUE constraint; fails open safely | `reminder-locks.ts`, all cron routes |
| **Content length validation** | Announcements limited to 4096 chars server-side | `announcements/route.ts`, `schedule/route.ts` |
| **Token generation bias fix** | Rejection sampling eliminates modulo bias in generateToken() | `utils.ts` |
| **Consistent admin auth** | All admin routes standardized to `withAdminAuth` wrapper | All admin routes |
| **Push subscription validation** | Validates push endpoint, p256dh, auth keys on subscribe | `subscribe/route.ts` |
| **Auto-unsubscribe expired** | 410 Gone from push service triggers auto-unsubscribe | `push-sender.ts` |

### Code Quality Improvements (v1.6.0 - v3.0.0)

| Improvement | Description | Files |
|-------------|-------------|-------|
| **NaN-safe time parsing** | Validates parsed values before use | `prayer-times.ts` |
| **Midnight wraparound handling** | Proper modular arithmetic for time offsets | `prayer-times.ts` |
| **Fisher-Yates shuffle** | Unbiased randomization for hadith collections | `hadith-api.ts` |
| **Concurrent push sending** | 10 concurrent requests with p-limit | `push-sender.ts` |
| **Batch error handling** | Logs errors without throwing for non-critical updates | `push-sender.ts` |
| **Retry limits** | Scheduled messages fail after 5 retries | `prayer-reminders/route.ts` |
| **PostgreSQL error codes** | Uses error codes instead of fragile message matching | `admin/settings/route.ts` |
| **Constants extraction** | Magic numbers moved to constants file | `constants.ts` |
| **Core-first cron architecture** | Primary function runs before auxiliary code; auxiliary code isolated in try-catches (v1.9.1) | `prayer-reminders/route.ts` |
| **Shared lock utility** | All cron routes use same `tryClaimReminderLock()` instead of inline implementations (v1.9.1) | `reminder-locks.ts`, all cron routes |
| **`.maybeSingle()` for optional rows** | Never use `.single()` when 0 rows is a valid outcome (v1.9.1) | `prayer-reminders/route.ts` |

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
export const ISHRAQ_MINUTES_AFTER_SUNRISE = 20;     // 20 minutes after sunrise (Ishraq time per Sunnah)
export const AWWABIN_MINUTES_AFTER_MAGHRIB = 15;    // 15 mins after Maghrib

// Hadith timing (dynamically follows prayer times)
export const HADITH_MINUTES_AFTER_PRAYER = 15;      // 15 mins after Fajr/Maghrib

// Jamaat timing
export const JAMAAT_DELAY_MINUTES = 15;              // 15 mins after Adhaan for congregation (except Maghrib)

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

# PART 3: HOW TO DO THINGS

---

## Common Tasks & How-To Guides

### How to Test If Subscriptions Work

1. Go to https://masjid-notify.vercel.app
2. Click "Enable Notifications" and grant browser permission
3. Choose your notification preferences and subscribe
4. Check Supabase > Table Editor > `subscribers` table
5. Your entry should appear with `status: active` and `push_endpoint` populated
6. You should receive a welcome push notification in your browser

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
   - `push_endpoint`: The subscriber's push subscription endpoint URL
   - `push_p256dh`: The p256dh key from the push subscription
   - `push_auth`: The auth key from the push subscription
   - `mosque_id`: Copy from `mosques` table
   - `status`: `active`
   - `pref_daily_prayers`: `true` (or false)
   - Other preferences as needed
4. Click "Save"
5. **Note:** In practice, subscribers self-register via the subscribe form. Manual insertion is only for testing.

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
5. **Messages are sent as push notifications concurrently** for better performance

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

## How to Clean Up Meta / WhatsApp

> **Context:** As of v3.0.0, WhatsApp has been completely removed from the codebase and replaced with Web Push + PWA. The steps below guide you through cleaning up the Meta/WhatsApp resources that are no longer needed.

### Step 1: Remove Vercel Environment Variables

1. Go to https://vercel.com/alqodes-projects/masjid-notify/settings/environment-variables
2. Delete these variables (one by one):
   - `WHATSAPP_ACCESS_TOKEN`
   - `WHATSAPP_PHONE_NUMBER_ID`
   - `WHATSAPP_BUSINESS_ACCOUNT_ID`
   - `WHATSAPP_APP_SECRET`
   - `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
   - `WHATSAPP_API_VERSION`
3. Add these new variables (if not already set):
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — your VAPID public key
   - `VAPID_PRIVATE_KEY` — your VAPID private key
   - `VAPID_SUBJECT` — `mailto:alqodez@gmail.com`
4. Trigger a redeploy

### Step 2: Delete WhatsApp Message Templates (Meta Business Manager)

1. Go to https://business.facebook.com
2. Navigate to: WhatsApp Manager > Account Tools > Message Templates
3. Delete each template one by one:
   - `masjid_notify_welcome`
   - `salah_reminder` (if submitted)
   - Any other templates you submitted
4. Note: You can only delete templates that are not currently in use

### Step 3: Remove Webhook Configuration (Meta Developer Console)

1. Go to https://developers.facebook.com
2. Select your app (Masjid Notify)
3. Navigate to: WhatsApp > Configuration
4. Under "Webhook", click "Edit" and remove the callback URL
5. Unsubscribe from all webhook fields (messages, etc.)

### Step 4: Unsubscribe WABA from App

1. This prevents the app from receiving any further webhook events
2. You can leave it or run:
   ```bash
   curl -X DELETE "https://graph.facebook.com/v21.0/{WABA_ID}/subscribed_apps" \
     -H "Authorization: Bearer {TOKEN}"
   ```

### Step 5: (Optional) Delete the WhatsApp Business Number

1. Go to Meta Business Manager > WhatsApp Manager > Phone Numbers
2. If you want to release the number, you can delete it here
3. Note: Once deleted, the number cannot be recovered for WhatsApp Business use

### Step 6: (Optional) Delete the Meta App Entirely

1. Go to https://developers.facebook.com/apps/
2. Select your app > Settings > Basic
3. Scroll to bottom > "Delete App"
4. Note: Only do this if you're 100% sure you won't need WhatsApp again

### Step 7: Update cron-job.org (No changes needed)

- The 5 cron jobs stay exactly the same — same URLs, same schedule, same auth header
- They now send push notifications instead of WhatsApp messages

### Step 8: Run Database Migrations

1. Go to https://supabase.com/dashboard/project/jlqtuynaxuooymbwrwth
2. Open SQL Editor
3. Run these migrations in order:
   - `016_web_push_migration.sql` — Adds push columns, drops phone/token columns
   - `017_notifications_table.sql` — Creates notifications table
   - `018_drop_phone_column.sql` — Drops legacy phone_number_old column

### Step 9: Verify Everything Works

1. Visit https://masjid-notify.vercel.app
2. Click "Enable Notifications" > grant permission > choose preferences > subscribe
3. Check Supabase `subscribers` table — should see `push_endpoint` populated
4. Go to `/settings` — should load your preferences
5. Go to `/notifications` — should show notification history
6. Send a test announcement from admin dashboard — should receive push notification

### Order of Operations

**Order matters**: Do Vercel env vars first (Step 1), then deploy the code, then run migrations (Step 8), then clean up Meta (Steps 2-6). The Meta cleanup can happen anytime after — WhatsApp is already disconnected from the code.

---

## Testing the App

### Test Subscription Flow

1. Go to landing page
2. Click "Enable Notifications" and grant browser notification permission
3. Choose your preferences and subscribe
4. Check database — subscriber should be created with `push_endpoint` populated
5. Check Vercel logs for any errors
6. Check if you receive welcome push notification

### Test Prayer Reminder Flow

1. Subscribe with `pref_daily_prayers: true`
2. Wait until near a prayer time (within your offset, e.g., 15 mins before)
3. Manually trigger prayer reminders cron (see above)
4. Check Vercel logs for "messages sent" count
5. Check if you receive the push notification

### Test Admin Dashboard

1. Login at /admin/login
2. Check dashboard shows correct subscriber count
3. Go to Subscribers - should show all subscribers
4. Go to Settings - should load mosque settings
5. All navigation should work

### Test Settings Page

1. Subscribe to get a subscriber ID (stored in localStorage)
2. Go to `/settings`
3. Should load your current preferences
4. Update a preference and save
5. Verify the change in Supabase

### Test Notification Center

1. Go to `/notifications`
2. Should show your notification history
3. Unread notifications should be marked differently

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

### Problem: Push notifications not arriving

**Checklist:**
1. Did the user grant notification permission? (Check browser settings)
2. Is the service worker registered? (DevTools > Application > Service Workers)
3. Is the push subscription saved? (Check `subscribers` table for `push_endpoint`)
4. Are VAPID keys correct? (Check Vercel env vars match what's in the code)
5. Is the subscriber `status: active`?
6. Check Vercel logs for the cron job — look for errors or 500 responses
7. Check if push endpoint is returning 410 (expired subscription — subscriber needs to re-subscribe)

**Common causes:**
| Symptom | Cause | Fix |
|---------|-------|-----|
| No notifications at all | Notification permission denied | User must re-enable in browser settings |
| 410 Gone errors in logs | Push subscription expired | Subscriber needs to re-subscribe (auto-unsubscribed) |
| Notifications work on desktop but not mobile | Mobile browser closed | Some browsers stop service worker when closed. Using PWA (Add to Home Screen) helps. |
| No notifications on iOS | Not installed as PWA | iOS requires Add to Home Screen for push support (iOS 16.4+) |

### Problem: Service worker not registering

**Checklist:**
1. Is the site served over HTTPS? (required for service workers)
2. Check DevTools > Application > Service Workers for errors
3. Is `withSerwist()` configured in `next.config.ts`?
4. Check browser console for registration errors

### Problem: VAPID key mismatch

**Symptoms:** Push sends fail with 401 or "UnauthorizedRegistration" errors.

**Fix:**
1. Ensure `NEXT_PUBLIC_VAPID_PUBLIC_KEY` in Vercel matches what was used when subscribers registered
2. If you regenerate VAPID keys, ALL existing push subscriptions become invalid — subscribers must re-subscribe
3. Generate keys: `npx web-push generate-vapid-keys`

### Problem: Subscribers page shows 0 subscribers

**Cause:** Usually a database query issue or RLS policy problem.

**Fix:**
1. Check Supabase > `subscribers` table has data
2. Check the `mosque_id` matches the admin's mosque
3. Check Vercel logs for errors on `/api/admin/subscribers`

### Problem: Prayer reminders not sending

**Cause:** Could be many things. See the v1.9.1 incident below for the most recent cause.

**Checklist:**
1. Is it actually near prayer time?
2. Does subscriber have `pref_daily_prayers: true`?
3. Is subscriber `status: active`?
4. Does subscriber have a valid `push_endpoint`?
5. Check Vercel logs for the cron job — look for errors or 500 responses
6. Check cron-job.org - is the job running?
7. Check `prayer_reminder_locks` table in Supabase — if locks exist for today's prayers but `messages` table has no corresponding entries, the messages were attempted but logging failed
8. **CRITICAL (v1.9.1 lesson):** Check if ANY auxiliary code (processScheduledMessages, autoResumeSubscribers) is running BEFORE the core prayer logic. If auxiliary code crashes, it can block ALL prayer reminders. Core prayer logic MUST run first, auxiliary code MUST be in isolated try-catches AFTER.

**Production Incident (v1.9.1):**
The v1.9.0 deep audit accidentally introduced broken optimistic locking (`status: "sending"` doesn't exist in the DB schema — only `pending|sent|cancelled|failed` are allowed). This caused `processScheduledMessages()` to crash, and because it ran BEFORE prayer reminders in the route handler, the outer try-catch caught the error and returned 500 before prayer reminders ever executed. The fix was a complete rewrite of the route: core prayer logic first, auxiliary features after in isolated try-catches.

### Problem: Cron job returning errors

**Common errors and fixes:**

| Error | Cause | Fix |
|-------|-------|-----|
| `Unauthorized` | Wrong or missing auth header | Check cron-job.org has correct `Authorization: Bearer masjidnotify2025cron` |
| `Could not find table X` | Database table missing | Run the SQL migrations (see Database Schema section) |
| `column X does not exist` | Database column missing | Run ALTER TABLE to add column |

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

---

## Web Push & PWA Setup

### VAPID Key Generation

VAPID (Voluntary Application Server Identification) keys authenticate your server with browser push services.

```bash
# Generate VAPID keys (run once, save permanently)
npx web-push generate-vapid-keys

# Output will look like:
# Public Key: BNx...abc (use for NEXT_PUBLIC_VAPID_PUBLIC_KEY)
# Private Key: abc...xyz (use for VAPID_PRIVATE_KEY)
```

**Add to Vercel:**

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | The public key from above |
| `VAPID_PRIVATE_KEY` | The private key from above |
| `VAPID_SUBJECT` | `mailto:alqodez@gmail.com` |

**IMPORTANT:** If you regenerate VAPID keys, ALL existing push subscriptions become invalid. Every subscriber will need to re-subscribe.

### Service Worker (`src/sw.ts`)

The service worker is compiled by Serwist (via `withSerwist()` in `next.config.ts`). It handles:

- **`push` event** — Receives push notification payload and shows it using `self.registration.showNotification()`
- **`notificationclick` event** — Opens the app URL from notification data, focuses existing window or opens new one

The service worker source is **excluded from tsconfig** because it's compiled separately by Serwist, not by the Next.js TypeScript compiler.

### PWA Manifest (`public/manifest.json`)

```json
{
  "name": "Masjid Notify",
  "short_name": "Masjid Notify",
  "description": "Prayer time reminders and mosque notifications",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0a",
  "theme_color": "#10b981",
  "icons": [
    { "src": "/icon-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512x512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### Browser Push Service Flow

```
1. User clicks "Enable Notifications"
2. Browser asks for notification permission
3. If granted, browser contacts its push service (FCM for Chrome, Mozilla for Firefox, APNs for Safari)
4. Push service returns a PushSubscription object (endpoint URL + encryption keys)
5. Our app sends this subscription to /api/subscribe
6. We save push_endpoint, push_p256dh, push_auth to the subscribers table
7. When sending: our server POSTs encrypted payload to the endpoint URL using VAPID auth
8. Push service delivers it to the user's browser
9. Service worker's `push` event fires → shows notification
```

### iOS Considerations

- iOS supports Web Push only from iOS 16.4+
- The user MUST install the PWA by using "Add to Home Screen" in Safari
- Push notifications do NOT work in regular Safari — only in the installed PWA
- This is an Apple platform restriction, not something we can work around

---

# PART 4: TECHNICAL REFERENCE

---

## All Features

### Core Features (27 Total)

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 1 | Landing Page | ✅ Live | Prayer times display, mosque info, subscribe CTA |
| 2 | Subscribe Form | ✅ Live | Enable notifications → choose preferences → subscribe (no phone number) |
| 3 | Push Welcome | ✅ Live | Automated welcome push notification on subscription |
| 4 | Subscriber Settings | ✅ Live | `/settings` page — update preferences, pause, unsubscribe (localStorage ID) |
| 5 | Notification Center | ✅ Live | `/notifications` — view all received notifications in-app |
| 6 | Admin Login | ✅ Live | Supabase Auth email/password |
| 7 | Admin Dashboard | ✅ Live | Stats cards, quick actions, analytics |
| 8 | Subscribers Table | ✅ Live | Search, filter, pagination, **delete confirmation** |
| 9 | CSV Export | ✅ Live | Download subscriber list |
| 10 | Announcements | ✅ Live | **Concurrent push sending**, message composer with preview |
| 11 | Message Templates | ✅ Live | Pre-built announcement templates |
| 12 | Message Scheduling | ✅ Live | Schedule for future delivery, **retry limits** |
| 13 | Mosque Settings | ✅ Live | Prayer calculation, Jumu'ah times, **cache invalidation** |
| 14 | Ramadan Mode | ✅ Live | Toggle Suhoor/Iftar/Taraweeh reminders |
| 15 | QR Code Generator | ✅ Live | Generate, download, print QR codes |
| 16 | Prayer Reminders | ✅ Live | **Timezone-aware**, **NaN-safe**, push notifications |
| 17 | Daily Hadith | ✅ Live | Real API - 6 authentic collections, **fair shuffle**, **dynamic timing** (15 min after Fajr/Maghrib) |
| 18 | Jumu'ah Reminder | ✅ Live | Friday morning reminder via push |
| 19 | Analytics Charts | ✅ Live | Subscriber growth, message breakdown |
| 20 | 404 Page | ✅ Live | **Branded not-found page** (v1.6.0) |
| 21 | Audio Library | ✅ Live | Upload, manage, stream Islamic lectures/Quran, public `/listen` page (v2.0.0) |
| 22 | Custom Prayer Times | ✅ Live | Manual prayer time entry mode (calculation_method=99) (v2.0.0) |
| 23 | Eid Mode | ✅ Live | Eid Khutbah + Salah time display on landing page (v2.0.0) |
| 24 | Next Salah Countdown | ✅ Live | Live countdown timer to next prayer on landing page (v2.0.0) |
| 25 | Admin Team Management | ✅ Live | Owner can add/remove admins with role-based access (v2.0.0) |
| 26 | Cron Diagnostics | ✅ Live | Real-time diagnostic endpoint for debugging (v2.0.0) |
| 27 | PWA / Service Worker | ✅ Live | Installable web app, offline support, push handler (v3.0.0) |

### Subscriber Preferences (6 Options)

| Option | Database Field | Description |
|--------|----------------|-------------|
| All 5 Daily Prayers | `pref_daily_prayers` | Fajr, Dhuhr, Asr, Maghrib, Isha reminders |
| Jumu'ah Khutbah Reminder | `pref_jumuah` | Friday prayer notification |
| Ramadan Mode | `pref_ramadan` | Suhoor, Iftar, Taraweeh reminders |
| Voluntary Prayers (Nafl) | `pref_nafl_salahs` | Tahajjud, Ishraq, Awwabin reminders |
| Daily Hadith | `pref_hadith` | Authentic hadith twice daily (morning & evening) |
| Announcements & Events | `pref_announcements` | Programs, Eid, special events |

### Subscriber Self-Service

| Feature | How | Code Location |
|---------|-----|---------------|
| **Update preferences** | `/settings` page (localStorage subscriber ID) | `settings/page.tsx`, `api/settings/route.ts` |
| **Pause notifications** | `/settings` page — pause for 1-30 days | `api/settings/route.ts` |
| **Unsubscribe** | `/settings` page — unsubscribe button | `api/settings/unsubscribe/route.ts` |
| **View notifications** | `/notifications` page — all received notifications | `notifications/page.tsx`, `api/notifications/route.ts` |

---

## API Reference

### Public Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/subscribe` | Subscribe new user (saves push subscription + preferences) |
| `GET` | `/api/settings` | Get subscriber preferences (by subscriber ID query param) |
| `PUT` | `/api/settings` | Update subscriber preferences |
| `POST` | `/api/settings/unsubscribe` | Unsubscribe a subscriber |
| `GET` | `/api/notifications` | Get subscriber's notification history |
| `GET` | `/api/audio` | List public audio collections |
| `GET` | `/api/audio/[collectionId]` | Get audio files in collection |

### Admin Endpoints (Requires Auth via `withAdminAuth`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/admin/stats` | Dashboard statistics (subscriber counts, message counts) |
| `GET` | `/api/admin/subscribers` | List subscribers with optional status filter |
| `PATCH` | `/api/admin/subscribers` | Update subscriber status |
| `DELETE` | `/api/admin/subscribers?id=` | Delete subscriber |
| `GET` | `/api/admin/settings` | Get mosque settings |
| `PUT` | `/api/admin/settings` | Update mosque settings (**invalidates prayer cache**) |
| `GET` | `/api/admin/announcements/data` | Announcements page data (mosque, active count, recent) |
| `POST` | `/api/admin/announcements` | Send announcement immediately (**concurrent push**) |
| `GET` | `/api/admin/announcements/schedule` | List scheduled messages |
| `POST` | `/api/admin/announcements/schedule` | Create scheduled message |
| `DELETE` | `/api/admin/announcements/schedule/[id]` | Cancel scheduled message |
| `GET` | `/api/admin/analytics` | Analytics data (subscriber growth, message types, status) |
| `GET/POST` | `/api/admin/audio/collections` | Manage audio collections |
| `DELETE` | `/api/admin/audio/collections/[id]` | Delete audio collection |
| `GET/POST` | `/api/admin/audio/files` | Manage audio files |
| `DELETE` | `/api/admin/audio/files/[id]` | Delete audio file |
| `POST` | `/api/admin/audio/upload-url` | Get signed upload URL for Supabase Storage |
| `GET/POST/DELETE` | `/api/admin/team` | Manage admin team members (owner-only) |

### Cron Endpoints (Requires CRON_SECRET)

| Method | Endpoint | Schedule | Purpose |
|--------|----------|----------|---------|
| `GET` | `/api/cron/prayer-reminders` | Every 5 mins | Prayer reminders (core, runs first) + scheduled messages + auto-resume (auxiliary, isolated) |
| `GET` | `/api/cron/daily-hadith` | Every 5 mins | **Dynamic:** Sends 15 min after Fajr (morning) and Maghrib (evening) |
| `GET` | `/api/cron/jumuah-reminder` | Every 5 mins | Friday reminder (checks if 2 hours before khutbah) |
| `GET` | `/api/cron/ramadan-reminders` | Every 5 mins | Suhoor/Iftar/Taraweeh |
| `GET` | `/api/cron/nafl-reminders` | Every 5 mins | Tahajjud/Ishraq/Awwabin |
| `GET` | `/api/cron/diagnostics` | Any time | Real-time diagnostic info for debugging cron timing |

> **Note:** As of v1.7.1, all cron jobs run every 5 minutes and use **dynamic prayer-time-based scheduling**. Fixed UTC times are no longer used. Each job checks the current time against mosque prayer times and only sends when appropriate.
>
> **Architecture (v1.9.1):** The `prayer-reminders` route handles 3 responsibilities: (1) core prayer reminders (runs FIRST), (2) scheduled message processing (runs AFTER in isolated try-catch), and (3) auto-resume of paused subscribers (runs AFTER in isolated try-catch). This core-first architecture ensures auxiliary features can never block the primary function. All 5 cron routes use the shared `tryClaimReminderLock()` from `reminder-locks.ts` for atomic duplicate prevention.

---

## Database Schema

### Tables Overview

| Table | Purpose | RLS |
|-------|---------|-----|
| `mosques` | Mosque configuration | ✅ |
| `subscribers` | User subscriptions (push endpoint + preferences) | ✅ |
| `admins` | Admin users | ✅ |
| `messages` | Message log (all notification types) | ✅ |
| `notifications` | In-app notification center (per subscriber) | ✅ |
| `daily_hadith_log` | Tracks sent hadiths | ✅ |
| `prayer_times_cache` | API response cache (with INSERT/UPDATE policies) | ✅ |
| `scheduled_messages` | Scheduled announcements | ✅ |
| `prayer_reminder_locks` | Atomic dedup locks for all reminder types (v1.7.0) | ✅ |
| `audio_collections` | Audio content organization (v2.0.0) | ✅ |
| `audio_files` | Audio file metadata (v2.0.0) | ✅ |

### Key Table: subscribers (v3.0 — Web Push)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `mosque_id` | UUID | Foreign key to mosques |
| `push_endpoint` | TEXT | Push subscription endpoint URL |
| `push_p256dh` | TEXT | Push subscription p256dh encryption key |
| `push_auth` | TEXT | Push subscription auth key |
| `user_agent` | TEXT | Subscriber's browser user agent |
| `status` | TEXT | active / paused / unsubscribed |
| `pref_daily_prayers` | BOOLEAN | All 5 daily prayers opt-in |
| `pref_jumuah` | BOOLEAN | Jumu'ah reminder opt-in |
| `pref_ramadan` | BOOLEAN | Ramadan reminders opt-in |
| `pref_nafl_salahs` | BOOLEAN | Voluntary prayers opt-in (Tahajjud, Ishraq, Awwabin) |
| `pref_hadith` | BOOLEAN | Daily hadith opt-in |
| `pref_announcements` | BOOLEAN | Announcements opt-in |
| `reminder_offset` | INT | Minutes before prayer |
| `pause_until` | TIMESTAMP | When PAUSE expires (null if not paused) |
| `last_message_at` | TIMESTAMP | Last successful message delivery |
| `subscribed_at` | TIMESTAMP | First subscription date |

**UNIQUE constraint:** `(push_endpoint, mosque_id)` — prevents duplicate push subscriptions per mosque.

### Key Table: notifications (v3.0 — New)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `subscriber_id` | UUID | Foreign key to subscribers (CASCADE delete) |
| `mosque_id` | UUID | Foreign key to mosques (CASCADE delete) |
| `type` | TEXT | Notification type (prayer, hadith, announcement, etc.) |
| `title` | TEXT | Notification title |
| `body` | TEXT | Notification body text |
| `data` | JSONB | Additional data (prayer name, hadith source, etc.) |
| `read` | BOOLEAN | Whether subscriber has read this notification |
| `created_at` | TIMESTAMPTZ | When notification was created |

### Key Table: messages (v1.8.0 - Added metadata column)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `mosque_id` | UUID | Foreign key to mosques |
| `type` | TEXT | **prayer / hadith / announcement / ramadan / welcome / jumuah / nafl** |
| `content` | TEXT | Message content |
| `sent_to_count` | INT | Number of recipients |
| `sent_at` | TIMESTAMP | When sent |
| `sent_by` | UUID | Admin who sent (null for automated) |
| `status` | TEXT | **pending / sent / failed / received** |
| `metadata` | JSONB | Additional data (prayer name, hadith source, etc.) |

### Key Table: prayer_reminder_locks (v1.7.0)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `mosque_id` | UUID | Foreign key to mosques |
| `prayer_key` | TEXT | Reminder type (fajr, dhuhr, hadith_morning, jumuah, tahajjud, suhoor, etc.) |
| `reminder_date` | DATE | Date of the reminder |
| `reminder_offset` | INT | Subscriber's offset in minutes |
| `created_at` | TIMESTAMP | Lock creation time |

**UNIQUE constraint:** `(mosque_id, prayer_key, reminder_date, reminder_offset)` - prevents duplicate sends via atomic INSERT.

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
│   ├── sw.ts                            # Service worker source (push events, notification clicks)
│   │                                    # Compiled by Serwist, excluded from tsconfig
│   ├── app/
│   │   ├── page.tsx                    # Landing page
│   │   ├── layout.tsx                  # Root layout
│   │   ├── landing-page.tsx            # Landing page component
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
│   │   │   ├── settings/page.tsx       # Mosque settings (custom times, Eid mode)
│   │   │   ├── audio/page.tsx          # Audio Library management
│   │   │   └── team/page.tsx           # Team management (owner-only)
│   │   │
│   │   ├── settings/page.tsx           # Subscriber notification preferences (localStorage ID)
│   │   ├── notifications/page.tsx      # In-app notification center
│   │   ├── privacy/page.tsx            # Privacy policy
│   │   ├── terms/page.tsx              # Terms of service
│   │   ├── data-deletion/page.tsx      # Data deletion instructions
│   │   ├── listen/page.tsx             # Public audio streaming page
│   │   │
│   │   └── api/
│   │       ├── subscribe/route.ts      # Subscription endpoint (push subscription + preferences)
│   │       ├── settings/route.ts       # Subscriber settings (GET/PUT by subscriber ID)
│   │       ├── settings/unsubscribe/route.ts  # Unsubscribe endpoint
│   │       ├── notifications/route.ts  # In-app notification center API
│   │       ├── audio/                  # Public audio collections + files API
│   │       │
│   │       ├── admin/
│   │       │   ├── stats/route.ts          # Dashboard stats
│   │       │   ├── subscribers/route.ts    # Subscribers CRUD
│   │       │   ├── settings/route.ts       # Mosque settings GET/PUT (cache invalidation)
│   │       │   ├── analytics/route.ts      # Analytics charts data
│   │       │   └── announcements/
│   │       │       ├── route.ts            # Send announcement (concurrent push)
│   │       │       ├── data/route.ts       # Announcements page data
│   │       │       └── schedule/           # Scheduled messages
│   │       │   ├── audio/
│   │       │   │   ├── collections/        # Audio collections CRUD + [id] delete
│   │       │   │   ├── files/              # Audio files CRUD + [id] delete
│   │       │   │   └── upload-url/         # Signed upload URL
│   │       │   └── team/route.ts           # Team management (owner-only)
│   │       │
│   │       └── cron/
│   │           ├── prayer-reminders/route.ts    # Prayer reminders (core-first, shared locks, retry limits) (v1.9.1)
│   │           ├── daily-hadith/route.ts
│   │           ├── jumuah-reminder/route.ts
│   │           ├── ramadan-reminders/route.ts   # Uses isWithinMinutesAfter
│   │           ├── nafl-reminders/route.ts
│   │           └── diagnostics/route.ts       # Diagnostic endpoint
│   │
│   ├── components/
│   │   ├── ui/                         # shadcn components
│   │   │   └── checkbox.tsx            # Accessible checkbox (v1.6.0)
│   │   ├── footer.tsx                  # "Powered by Alqode"
│   │   ├── prayer-times.tsx
│   │   ├── next-salah-countdown.tsx    # Live countdown to next prayer
│   │   ├── qr-code.tsx
│   │   ├── subscribe-form.tsx          # Enable notifications + preferences form
│   │   └── admin/
│   │       ├── sidebar.tsx
│   │       ├── stats-card.tsx
│   │       ├── analytics-charts.tsx
│   │       ├── announcement-form.tsx
│   │       ├── message-templates.tsx
│   │       └── subscribers-table.tsx   # Delete confirmation, ARIA labels (v1.6.0)
│   │
│   └── lib/
│       ├── supabase.ts                 # Database clients + types (Subscriber, Notification, etc.)
│       ├── web-push.ts                 # Web Push API client (VAPID-based)
│       ├── push-sender.ts             # Batch push sending with concurrency control (p-limit 10)
│       ├── prayer-times.ts             # Aladhan API + cache (NaN-safe, timezone-aware)
│       ├── hadith-api.ts               # External hadith API (Fisher-Yates shuffle)
│       ├── ratelimit.ts                # Rate limiting (IP spoofing protection)
│       ├── auth.ts                     # Auth utilities (constant-time comparison)
│       ├── constants.ts                # Time constants (v1.6.0, updated v1.7.1)
│       ├── reminder-locks.ts           # Atomic reminder locking utility (v1.7.0)
│       ├── time-format.ts              # Client-safe time formatting utilities (v2.0.0)
│       ├── logger.ts                   # Structured logging
│       └── utils.ts                    # Helpers
│
├── public/
│   ├── manifest.json                   # PWA manifest (standalone, icons, theme)
│   ├── icon-192x192.png               # PWA icon (192x192)
│   ├── icon-512x512.png               # PWA icon (512x512)
│   └── og-image.png                   # Social preview image
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
│       ├── 010_unified_reminder_locks.sql    # (v1.7.0) Unified atomic locking
│       ├── 011_add_messages_metadata.sql     # (v1.8.0) Add metadata JSONB column
│       ├── 012_add_audio_tables.sql         # (v2.0.0) Audio collections and files tables
│       ├── 013_add_eid_mode.sql             # (v2.0.0) Eid mode columns
│       ├── 014_add_eid_khutbah_time.sql     # (v2.0.0) Eid khutbah time column
│       ├── 015_fix_admins_password_hash.sql # (v2.0.0) Make password_hash nullable
│       ├── 016_web_push_migration.sql       # (v3.0.0) Add push columns, drop phone/token
│       ├── 017_notifications_table.sql      # (v3.0.0) In-app notification center
│       └── 018_drop_phone_column.sql        # (v3.0.0) Drop legacy phone column, clean types
│
├── playwright.config.ts               # Test configuration
├── package.json
├── tsconfig.json
├── next.config.ts                      # Wrapped with withSerwist() for service worker
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
| **cron-job.org** | Runs scheduled jobs every 5 mins | https://cron-job.org | alqodez@gmail.com |
| **GitHub** | Code repository | https://github.com/alqode-dev/masjid-notify | alqodez@gmail.com |

> **Note:** Browser push services (FCM for Chrome, Mozilla Push for Firefox, APNs for Safari) are used automatically — no account or setup needed. The VAPID keys authenticate our server with these services.

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
- `subscribers` - All subscribed users (push endpoints, preferences)
- `messages` - Log of all sent messages
- `notifications` - In-app notification center (per subscriber)
- `admins` - Admin users linked to mosques
- `daily_hadith_log` - Tracks which hadith was sent each day
- `prayer_times_cache` - Caches prayer times to reduce API calls (**invalidated on settings change**)
- `scheduled_messages` - Future scheduled announcements (**with retry tracking**)

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

### Supabase Service Role Key
- **Location:** Vercel environment variables
- **Name:** `SUPABASE_SERVICE_ROLE_KEY`
- **Used for:** Server-side database operations that bypass RLS

### VAPID Keys
- **Location:** Vercel environment variables
- **Public Key:** `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (also used client-side for push subscription)
- **Private Key:** `VAPID_PRIVATE_KEY` (server-side only for signing push requests)
- **Subject:** `VAPID_SUBJECT` = `mailto:alqodez@gmail.com`
- **Generate:** `npx web-push generate-vapid-keys`

---

## Environment Variables

### Production Variables (Vercel)

| Variable | Status | Description |
|----------|--------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Set | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Set | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Set | Supabase service role (admin access) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | ✅ Set | VAPID public key for push subscriptions |
| `VAPID_PRIVATE_KEY` | ✅ Set | VAPID private key for signing push requests |
| `VAPID_SUBJECT` | ✅ Set | `mailto:alqodez@gmail.com` |
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

### Removed Variables (v3.0 — WhatsApp removed)

These variables are no longer needed and should be deleted from Vercel:

| Variable | Reason |
|----------|--------|
| `WHATSAPP_ACCESS_TOKEN` | WhatsApp API removed |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp API removed |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | WhatsApp API removed |
| `WHATSAPP_APP_SECRET` | WhatsApp webhook removed |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | WhatsApp webhook removed |
| `WHATSAPP_API_VERSION` | WhatsApp API removed |

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
| **Announcements** | `/admin/announcements` | Send immediate or scheduled push notifications |
| **QR Code** | `/admin/qr-code` | Generate and download QR codes |
| **Settings** | `/admin/settings` | Mosque configuration, prayer times, Ramadan mode, Eid mode, custom times |
| **Audio Library** | `/admin/audio` | Upload and manage Islamic lectures, Quran recitations |
| **Team** | `/admin/team` | Manage admin team members (owner-only) |

### Admin Capabilities

- View subscriber statistics and growth charts
- Send announcements to all active subscribers (concurrent push sending)
- Schedule messages for future delivery
- Cancel pending scheduled messages
- Export subscriber list to CSV
- Configure prayer time calculation method
- Set Jumu'ah times
- Enable/disable Ramadan mode
- Configure Taraweeh time
- Upload and manage audio collections and files
- Add/remove admin team members with roles (owner-only)
- Set custom prayer times (calculation_method=99 mode)
- Enable Eid mode with Khutbah and Salah times
- View in-app notification center

---

# PART 5: HISTORY

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
| **Sequential message sending in announcements** | Timeout risk on large subscriber bases | Converted to concurrent sending | ✅ Fixed |
| **Biased shuffle algorithm** | `Math.random() - 0.5` produces non-uniform distribution | Replaced with proper Fisher-Yates shuffle | ✅ Fixed |
| **Confusing negative offset usage** | `isWithinMinutes(-90)` for "after" logic | Changed to use `isWithinMinutesAfter(90)` | ✅ Fixed |
| **Fragile error message matching** | Checked error message text instead of codes | Now checks PostgreSQL error codes (`42703`, `PGRST204`) | ✅ Fixed |
| **No input validation for boolean preferences** | Accepted any value for preference fields | Added type validation for all boolean prefs | ✅ Fixed |
| **Magic numbers scattered in code** | `720`, `1440`, `10 * 60 * 1000` repeated | Extracted to `constants.ts` | ✅ Fixed |
| **No branded 404 page** | Generic Next.js 404 | Created `src/app/not-found.tsx` | ✅ Fixed |

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

## Changelog

### Version 3.0.0 - February 21, 2026

**MAJOR: Web Push PWA Migration — WhatsApp Completely Removed**

This is a complete platform migration from WhatsApp Business API to Web Push notifications with a Progressive Web App. No phone numbers required — users simply enable browser notifications.

#### What Changed

| Area | Before (v2.0) | After (v3.0) |
|------|---------------|--------------|
| **Notification delivery** | WhatsApp messages via Meta Cloud API | Push notifications via Web Push API (VAPID) |
| **Subscriber identification** | Phone number (+27...) | Push subscription endpoint + encryption keys |
| **Subscription flow** | Enter phone number → receive WhatsApp message | Enable notifications → grant permission → subscribe |
| **Settings access** | WhatsApp SETTINGS command → 24h token link | `/settings` page via localStorage subscriber ID |
| **Notification history** | No history (WhatsApp messages disappear) | `/notifications` page — in-app notification center |
| **Self-service** | WhatsApp commands (STOP, PAUSE, etc.) | `/settings` page (pause, unsubscribe, update prefs) |
| **App experience** | Just a website | PWA — installable, standalone display, offline support |
| **Service Worker** | None | Serwist-compiled SW handles push events + clicks |
| **Cost** | Per-message charges (Meta API) | Free (Web Push is free to send) |
| **Approval needed** | Meta template approval (24-48h each) | None — send any message instantly |

#### New Files

| File | Purpose |
|------|---------|
| `src/sw.ts` | Service worker — handles push events, notification clicks |
| `src/lib/web-push.ts` | Web Push API client with VAPID authentication |
| `src/lib/push-sender.ts` | Batch push sending with p-limit(10) concurrency |
| `src/app/settings/page.tsx` | Subscriber settings page (localStorage-based) |
| `src/app/notifications/page.tsx` | In-app notification center |
| `src/app/api/settings/route.ts` | Subscriber settings API (GET/PUT) |
| `src/app/api/settings/unsubscribe/route.ts` | Unsubscribe endpoint |
| `src/app/api/notifications/route.ts` | Notification center API |
| `public/manifest.json` | PWA manifest |
| `public/icon-192x192.png` | PWA icon (192x192) |
| `public/icon-512x512.png` | PWA icon (512x512) |
| `supabase/migrations/016_web_push_migration.sql` | Add push columns, drop phone/token |
| `supabase/migrations/017_notifications_table.sql` | Create notifications table |
| `supabase/migrations/018_drop_phone_column.sql` | Drop legacy phone column |

#### Deleted Files

| File | Reason |
|------|--------|
| `src/lib/whatsapp.ts` | WhatsApp API removed |
| `src/lib/whatsapp-templates.ts` | Meta templates no longer used |
| `src/lib/message-sender.ts` | Replaced by `push-sender.ts` |
| `src/app/api/webhook/whatsapp/route.ts` | WhatsApp webhook removed |
| `src/app/settings/[token]/page.tsx` | Replaced by `settings/page.tsx` (localStorage) |
| `src/app/api/settings/[token]/route.ts` | Replaced by `api/settings/route.ts` |
| `src/components/admin/subscriber-import.tsx` | CSV import removed (no phone numbers) |
| `src/app/api/admin/subscribers/import/route.ts` | CSV import API removed |

#### New Database Migrations

| Migration | Purpose |
|-----------|---------|
| **016** | Add push_endpoint, push_p256dh, push_auth, user_agent to subscribers. Drop settings_token, settings_token_expires. Rename phone_number to phone_number_old. |
| **017** | Create notifications table with subscriber_id, mosque_id, type, title, body, data, read columns. Indexed for subscriber + read status queries. |
| **018** | Drop phone_number_old column. Remove webhook_command from messages type constraint. |

#### New Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | ✅ Yes | VAPID public key for push subscriptions |
| `VAPID_PRIVATE_KEY` | ✅ Yes | VAPID private key for signing push requests |
| `VAPID_SUBJECT` | ✅ Yes | Contact URI (e.g., `mailto:alqodez@gmail.com`) |

#### Removed Environment Variables

| Variable | Reason |
|----------|--------|
| `WHATSAPP_ACCESS_TOKEN` | WhatsApp removed |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp removed |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | WhatsApp removed |
| `WHATSAPP_APP_SECRET` | WhatsApp removed |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | WhatsApp removed |
| `WHATSAPP_API_VERSION` | WhatsApp removed |

---

### Version 2.0.0 - February 15, 2026

**MAJOR: Feature Release - Audio Library, Custom Prayer Times, Eid Mode, Team Management**

This is a major feature release adding six new capabilities to the platform, along with critical cron reliability fixes.

#### New Features

| Feature | Description |
|---------|-------------|
| **Audio Library** | Upload, manage, and stream Islamic lectures and Quran recitations. Admin creates collections, uploads files to Supabase Storage. Public `/listen` page for streaming. |
| **Custom Prayer Times** | `calculation_method=99` mode allows admins to manually enter exact prayer times instead of using Aladhan API. Bypasses prayer cache entirely. Falls back to MWL (method 3) if custom times are incomplete. |
| **Eid Mode** | Admin can enable Eid mode in settings with separate Khutbah and Salah time fields. Displayed on landing page. |
| **Next Salah Countdown** | Live countdown timer on landing page showing time remaining until next prayer. Updates in real-time. |
| **Announcement Preview** | Show/hide preview for announcement messages in admin dashboard. |
| **Admin Team Management** | Owner can add/remove admin team members with roles (admin/announcer). Creates Supabase Auth users. |
| **Cron Diagnostics** | Endpoint at `/api/cron/diagnostics` for real-time debugging of cron timing and configuration. |

#### Critical Cron Reliability Fixes (7 bugs - Feb 11)

| Bug | Severity | Fix |
|-----|----------|-----|
| **`tryClaimReminderLock` used UTC date** | CRITICAL | Now passes `mosque.timezone` for correct lock date |
| **`getNowInTimezone` missing hourCycle** | CRITICAL | Added explicit `hourCycle: 'h23'` (V8/ICU bug workaround) |
| **`fetchPrayerTimesFromAPI` used UTC date** | CRITICAL | Uses timezone-aware date components for API calls |
| **Minute comparison overflow** | HIGH | `isWithinMinutes`/`isWithinMinutesAfter` now normalize negative/overflow minutes |
| **nafl-reminders lacked per-prayer try-catch** | HIGH | Each nafl prayer wrapped in isolated try-catch |
| **`cleanupOldLocks` never called** | MEDIUM | Now called in prayer-reminders cron |
| **No diagnostic tooling** | IMPROVEMENT | Comprehensive logging + diagnostic endpoint |

#### Other Bug Fixes (Feb 13-15)

| Fix | Description |
|-----|-------------|
| **Scheduled message retry_count** | Now properly written back to DB on failure |
| **HADITH_MINUTES_AFTER_PRAYER duplication** | Imported from constants.ts instead of local duplicate |
| **getTodaysHadith timezone** | Uses mosque timezone instead of UTC date |
| **toLocaleDateString locale** | Fixed 3 calls to use "en-ZA" locale (team page, subscribers CSV, webhook pause) |
| **Prayer times cache cleanup** | Old entries (>7 days) cleaned up by prayer-reminders cron |
| **Landing page caching** | Added `fetchCache = "force-no-store"` to prevent stale prayer times |
| **Team member creation** | Migration 015 makes password_hash nullable, error messages surface actual Supabase errors |
| **Custom prayer times validation** | Settings API validates all 6 fields when method=99 |

#### New Database Migrations

| Migration | Purpose |
|-----------|---------|
| **012** | Audio collections and files tables with RLS policies |
| **013** | Eid mode columns (`eid_mode`, `eid_salah_time`) on mosques table |
| **014** | Eid khutbah time column on mosques table |
| **015** | Make `password_hash` nullable for team member creation |

#### Architecture: Custom Prayer Times

```
Admin sets calculation_method = 99 → enters all 6 times (HH:MM)
  → getMosquePrayerTimes() detects method=99
  → returns custom times directly (bypasses API + cache)
  → falls back to MWL (method 3) if custom_prayer_times is null
```

#### Architecture: Audio Library

```
Admin uploads audio → signed URL from /api/admin/audio/upload-url
  → file stored in Supabase Storage (audio-files bucket)
  → metadata tracked in audio_collections + audio_files tables
  → public streaming via /listen page → /api/audio/* endpoints
```

#### Build Status

- **Build:** PASS (0 errors, ~4.7s Turbopack)
- **TypeScript:** PASS (0 errors)
- **Lint:** 0 new warnings

---

### Version 1.9.1 - February 10, 2026

**HOTFIX: Prayer Reminders Production Outage - Core Logic Must Run First**

This is an emergency hotfix for a production outage where **no prayer reminders were being sent to any subscribers**. The nafl-reminders cron (Tahajjud, Ishraq, Awwabin) continued working because it has a simpler architecture without auxiliary code.

#### What Broke (Root Cause Analysis)

The v1.9.0 deep audit introduced three bugs into `prayer-reminders/route.ts` that combined to cause a total outage:

| Bug | Severity | Explanation |
|-----|----------|-------------|
| **Broken optimistic locking** | CRITICAL | Added `status: "sending" as string` to update scheduled messages before processing. The `as string` TypeScript cast hid the bug at compile time, but the database CHECK constraint only allows `pending|sent|cancelled|failed`. The UPDATE failed silently, and `.single()` on 0 matched rows threw PGRST116 error. |
| **Auxiliary code ran BEFORE core logic** | CRITICAL | `processScheduledMessages()` and `autoResumeSubscribers()` were placed BEFORE the prayer reminder loop in the GET handler. When `processScheduledMessages()` crashed (due to the "sending" status bug), the outer try-catch caught the error and returned HTTP 500 — meaning the core prayer reminder code **never executed**. |
| **Inline lock function** | HIGH | Used an inline `tryClaimReminderLock` with fragile legacy fallback (`.contains("metadata", ...)` JSON query) instead of the battle-tested shared version from `reminder-locks.ts` that all other cron routes use. |

#### What Was Fixed

| Change | Description |
|--------|-------------|
| **Core-first architecture** | Prayer reminders now run FIRST in the GET handler. Scheduled messages and auto-resume run AFTER in isolated try-catches. If they fail, prayer reminders have already been sent. |
| **Removed broken locking** | Removed the `status: "sending"` optimistic lock that doesn't match DB schema. Scheduled messages are now processed without the broken status transition. |
| **Shared lock function** | Replaced inline `tryClaimReminderLock` with import from `reminder-locks.ts` — the same battle-tested function used by nafl-reminders, daily-hadith, jumuah-reminder, and ramadan-reminders. |
| **`.single()` → `.maybeSingle()`** | Changed mosque lookup in `processScheduledMessages()` from `.single()` (errors on 0 rows) to `.maybeSingle()` (returns null on 0 rows). |
| **Safe retry_count handling** | Changed `scheduled.retry_count ?? 0` to `((scheduled.retry_count as number) || 0)` for NaN safety. |

#### Architecture: Core-First Pattern (CRITICAL LESSON)

```
// prayer-reminders/route.ts - CORRECT architecture (v1.9.1)
export async function GET(request: NextRequest) {
  // Auth check...
  try {
    // =========================================================
    // CORE: Prayer Reminders — this MUST run, it's the primary function
    // =========================================================
    // Get mosques → get prayer times → check timing → send reminders
    // Uses shared tryClaimReminderLock() for atomic dedup

    // =========================================================
    // AUXILIARY: These run AFTER prayer reminders, in isolated try-catches.
    // If they fail, prayer reminders have already been sent.
    // =========================================================
    try {
      await processScheduledMessages(logger);
    } catch (err) {
      console.error("[prayer-reminders] processScheduledMessages failed:", err);
    }

    try {
      await autoResumeSubscribers(logger);
    } catch (err) {
      console.error("[prayer-reminders] autoResumeSubscribers failed:", err);
    }
  } catch (error) {
    // Only the core prayer logic failure reaches here
  }
}
```

**Rule: NEVER put auxiliary logic BEFORE core logic in cron routes. Auxiliary code must be in isolated try-catches AFTER the core function completes.**

#### Lessons Learned (Production Incident Post-Mortem)

| Lesson | Details |
|--------|---------|
| **Never use `as string` to bypass TypeScript** | If the DB schema doesn't have that status value, the constraint error silently breaks the flow. TypeScript type assertions hide bugs. |
| **Core logic MUST run first** | In any cron route that has a primary function plus auxiliary features, the primary function MUST execute before any auxiliary code. Auxiliary code MUST be in isolated try-catches. |
| **Never use `.single()` when 0 rows is valid** | `.single()` throws PGRST116 error when 0 rows match. Use `.maybeSingle()` instead when the query might return no results. |
| **Use shared, tested utilities** | The shared `tryClaimReminderLock()` in `reminder-locks.ts` has proper error handling (fail-open, table-not-found recovery). Inline reimplementations miss these edge cases. |
| **Test with the actual database** | The `as string` cast passed TypeScript compilation and `npm run build` with 0 errors. Only the database constraint caught the bug at runtime. |

---

### Version 1.9.0 - February 9, 2026

**MAJOR: Deep Audit - 47 Findings Fixed Across Security, Performance, Architecture & Code Quality**

> **WARNING:** This version introduced a critical bug in `prayer-reminders/route.ts` that caused a production outage. The broken optimistic locking (`status: "sending"`) and auxiliary-before-core architecture were fixed in v1.9.1. See v1.9.1 changelog above for details.

Comprehensive deep audit of the entire codebase identified 47 issues across 5 severity levels. All fixes implemented, build passes with 0 errors, lint passes with 0 new warnings.

#### Critical Fixes (5)

| Issue | Root Cause | Solution |
|-------|------------|----------|
| **Admin pages unprotected at edge** | No `middleware.ts` existed - admin UI loaded before auth checked | Created `src/middleware.ts` with Supabase `getUser()` verification for all `/admin/*` routes |
| ~~**Scheduled messages sent twice**~~ | No locking in `processScheduledMessages()` - concurrent cron runs process same message | ~~Added optimistic locking: atomically update `status: pending→sending` before processing~~ **BROKEN** — "sending" status doesn't exist in DB schema. **Reverted in v1.9.1** |
| **Paused subscribers stuck forever** | No code checked `pause_until` expiry - users stayed paused unless they texted RESUME | Added auto-resume logic to prayer-reminders cron: updates `status→active` when `pause_until` has passed |
| **Analytics/stats OOM risk** | `analytics/route.ts` and `stats/route.ts` fetched ALL rows into memory for aggregation | Replaced with `count: "exact", head: true` for status breakdown; removed full-table scan |
| **Import timeout at 250+ subscribers** | N+1 individual INSERT calls in a `for` loop | Replaced with batched upsert (50 per batch) using `ignoreDuplicates: true` |

#### High Severity Fixes (6)

| Issue | Fix |
|-------|-----|
| **Prayer cache date uses UTC** | `getDateString()` now accepts timezone; all 5 cron routes pass `mosque.timezone` |
| **Settings tokens reusable** | Token + expiry set to `null` after successful preference update (one-time use) |
| **Admin layout uses unverified `getSession()`** | Changed to verified `getUser()`; removed redundant `pathname` dependency |
| **`previewTemplate()` only replaces first occurrence** | Changed `.replace()` to `.replaceAll()` |
| **Ishraq timing contradiction** | Fixed `ISHRAQ_MINUTES_AFTER_SUNRISE` to 20 (was 180); `calculateNaflTimes()` now uses constants |

#### Medium Severity Fixes (7)

| Issue | Fix |
|-------|-----|
| **Auth pattern inconsistency** | All 4 announcement routes converted from manual `verifyAdminAuth()` to `withAdminAuth` wrapper |
| **No content length validation** | Added 4096-char server-side limit to announcements and schedule routes |
| **Hardcoded "Rondebosch East"** | Replaced with `{mosque.city}, {mosque.country}` from database |
| **No batch size limit on `batchUpdateLastMessageAt`** | Now processes in batches of 100 to avoid oversized SQL `IN()` clauses |
| **Duplicate utility functions** | `formatPhoneNumber` is now an alias for `normalizePhoneNumber` |

#### Low Severity / Code Quality Fixes (5)

| Issue | Fix |
|-------|-----|
| **No security headers** | Added HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy in `next.config.ts` |
| **`generateToken()` modulo bias** | Replaced `array[i] % 62` with rejection sampling (eliminates bias for 62-char alphabet) |
| **Dead `getMonthlyPrayerTimes()`** | Removed from prayer-times.ts (never imported anywhere) |
| **Unused imports and variables** | Cleaned up `previewTemplate` import, unused `message` variable, middleware `options` param |
| **Scheduled date validation** | Added `isNaN()` check for `scheduled_at` dates in schedule route |

---

### Version 1.8.0 - February 8, 2026

**CRITICAL: Fix Webhook Message Reception & Message Logging**

This release fixes two critical production issues: WhatsApp webhook commands (STOP, PAUSE, SETTINGS, HELP) not working because the WABA was not subscribed to the app, and all prayer/nafl message logging silently failing because the `metadata` JSONB column didn't exist on the `messages` table.

> **Note:** The WhatsApp webhook and commands were later removed entirely in v3.0.0 (Web Push migration). This changelog entry is preserved for historical reference.

#### Message Logging Fixed

| Issue | Root Cause | Solution |
|-------|------------|----------|
| **Prayer messages not logged in dashboard** | `messages` table was missing `metadata` JSONB column | Created migration 011 to add the column |
| **Nafl messages not logged** | Same - all inserts with `metadata` field failed with PGRST204 | Same migration fix |
| **Scheduled message logging failing** | Same root cause | Same migration fix |

#### Vercel Environment Variables Fixed (CRITICAL)

**9 of 11 environment variables** had invisible trailing `\n` (newline) characters, causing multiple cascading failures. Fixed by deleting and re-adding via CLI.

**Root cause:** When pasting values into Vercel's environment variable web UI, a trailing newline is silently appended.

**How to fix (CLI method - prevents newlines):**
```bash
# Remove old value
npx vercel env rm VARIABLE_NAME production -y

# Add clean value (printf prevents trailing newline)
printf 'clean_value_here' | npx vercel env add VARIABLE_NAME production
```

---

### Version 1.7.2 - February 6, 2026

**Comprehensive Codebase Audit - Security, Accessibility & Bug Fixes**

This release addresses 40+ issues identified through a thorough codebase audit, covering security vulnerabilities, accessibility gaps, CSS bugs, and code quality improvements across 22 files.

---

### Version 1.7.1 - February 6, 2026

**MAJOR: Dynamic Hadith Timing & Ishraq Fix**

This release changes hadith notifications from fixed UTC times to dynamic prayer-based timing.

#### Dynamic Hadith Timing (BREAKING CHANGE)

Hadith notifications now send **15 minutes after prayer times** instead of at fixed UTC times:

| Hadith | Old (Fixed UTC) | New (Dynamic) |
|--------|-----------------|---------------|
| Morning hadith | 3:30 AM UTC (5:30 AM SAST) | **15 min after Fajr** (~6:00 AM in summer, ~7:00 AM in winter) |
| Evening hadith | 4:00 PM UTC (6:00 PM SAST) | **15 min after Maghrib** (~6:30 PM in summer, ~8:00 PM in winter) |

---

### Version 1.7.0 - February 6, 2026

**MAJOR: Fix Duplicate Reminders & Improve Reliability**

All reminder types now use atomic database locking to prevent duplicates when cron runs overlap.

---

### Version 1.6.3 - February 5, 2026

**CRITICAL: Fix Empty Messages & Prayer Times Cache Tables**

The `messages` and `prayer_times_cache` tables were always empty because database CHECK constraints and RLS policies were blocking inserts.

---

### Version 1.6.2 - February 5, 2026

**CRITICAL: Hadith API Migration**

Replaced dead random-hadith-generator.vercel.app with fawazahmed0/hadith-api hosted on jsDelivr CDN.

---

### Version 1.6.1 - February 5, 2026

**P3 Fixes + Social Preview Image**

---

### Version 1.6.0 - February 5, 2026

**Comprehensive Bug Fix & Security Release**

Addresses 22 issues including 2 critical security fixes, 5 high-priority fixes, and numerous code quality improvements.

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
| **Hadith API Docs** | https://github.com/fawazahmed0/hadith-api |
| **Web Push Docs** | https://web.dev/articles/push-notifications-overview |
| **Serwist Docs** | https://serwist.pages.dev/ |

---

**Document Version:** 3.0.0
**Last Updated:** February 21, 2026 @ 12:00 SAST
**Author:** Claude Code
**Status:** Production - Web Push PWA. WhatsApp fully removed and replaced with browser push notifications. All cron jobs, admin dashboard, and subscriber features fully operational via Web Push.
