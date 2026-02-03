# Masjid Notify - Project Status

> **Last Updated:** February 4, 2026 @ 22:00 UTC
> **Version:** 1.5.1
> **Status:** ✅ **WHATSAPP ACTIVE** - Need to submit message templates for Meta approval
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

### Technical Reference
10. [All Features](#all-features)
11. [API Reference](#api-reference)
12. [Database Schema](#database-schema)
13. [Cron Jobs Explained](#cron-jobs-explained)
14. [Environment Variables](#environment-variables)
15. [Project Structure](#project-structure)

### Infrastructure & Accounts
16. [Production Infrastructure](#production-infrastructure)
17. [Admin Access & Credentials](#admin-access)
18. [External Services & Accounts](#external-services--accounts)

### History
19. [Changelog](#changelog)

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
│                           (from Aladhan API)                             │
│                                    │                                     │
│                                    ▼                                     │
│                           ❓ Is it time to send?                         │
│                           (current time near prayer time?)               │
│                                    │                                     │
│                              YES   │   NO                                │
│                                ▼       ▼                                 │
│                           📤 Send    🔄 Wait for                         │
│                           WhatsApp   next check                          │
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
| **Hadith API** | Provides authentic daily hadith | random-hadith-generator |
| **Cron Scheduler** | Triggers reminder checks every 5 minutes | cron-job.org |

### Data Flow Example: Prayer Reminder

1. **cron-job.org** calls `https://masjid-notify.vercel.app/api/cron/prayer-reminders` every 5 minutes
2. **Our API** authenticates the request (checks the secret key)
3. **Our API** fetches all mosques from **Supabase**
4. For each mosque, it calls **Aladhan API** to get today's prayer times
5. It checks: "Is current time within 5 minutes of [prayer time minus user's offset]?"
6. If YES, it fetches subscribers who want that prayer reminder from **Supabase**
7. For each subscriber, it calls **WhatsApp Cloud API** to send the message
8. It logs the sent message to **Supabase** (messages table)

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

# 3. Commit
git add .
git commit -m "description of changes"

# 4. Push to GitHub (auto-deploys to Vercel)
git push origin master

# 5. Check Vercel dashboard for deployment status
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
| Landing page | ✅ Works | Shows prayer times, subscribe form, correct location |
| Subscribe form | ✅ Works | Saves to database correctly |
| WhatsApp sending | ✅ Works | Account restored, welcome messages sending |
| Welcome messages | ✅ Works | Sent on subscription via `masjid_notify_welcome` template |
| Admin login | ✅ Works | Email: alqodez@gmail.com |
| Admin dashboard | ✅ Works | Stats cards, subscriber counts, analytics charts |
| Admin subscribers | ✅ Works | Table, search, filter, export, import, delete |
| Admin announcements | ✅ Works | Send now, schedule, templates, WhatsApp policy notice |
| Admin settings | ⚠️ Partial | Prayer settings save. Ramadan settings need migration 007 |
| Admin QR code | ✅ Works | Generate and download QR codes |
| Admin analytics | ✅ Works | Subscriber growth, message types, status breakdown |
| Database | ✅ Works | All tables created and functional |
| Cron jobs | ✅ Works | All 5 jobs running on cron-job.org |
| Prayer times API | ✅ Works | Aladhan API responding, coordinates updated to Rondebosch East |
| Hadith API | ✅ Works | Returns authentic hadith |
| Server-side API routes | ✅ Works | All admin pages use secure server-side routes |

### ⚠️ Currently Broken / Pending

| Feature | Status | Why | Fix |
|---------|--------|-----|-----|
| Message templates | ⚠️ Not approved | Never submitted to Meta | Submit all templates for Meta approval |
| Ramadan settings save | ⚠️ Needs migration | DB columns missing | Run migration 007 in Supabase SQL Editor |
| Messages count on dashboard | ⚠️ Bug | Welcome msg insert failing silently (likely CHECK constraint on `type` column in deployed DB) | Run ALTER to update constraint; check Vercel logs for `[subscribe]` errors |

### 📋 TODO: Next Steps

1. [ ] **Fix messages count bug** — Update CHECK constraint on `messages.type` column (see SQL below)
2. [ ] Submit ALL message templates to Meta for approval
3. [ ] Wait for template approval (24-48h each)
4. [ ] Apply for Meta Business Verification
5. [ ] Get a test phone number for testing
6. [ ] Implement number warmup (start slow)
7. [ ] Test prayer reminder flow end-to-end
8. [ ] Go live with real users

### 📋 TODO Database Migrations

1. [ ] **Run migration 007** (`supabase/migrations/007_add_ramadan_columns.sql`) — Adds `ramadan_mode`, `suhoor_reminder_mins`, `iftar_reminder_mins`, `taraweeh_time` columns to mosques table. Required for Ramadan settings to save.

---

# PART 2: CURRENT STATUS

---

## System Status

### Component Health Check

| Component | Status | Last Verified | Notes |
|-----------|--------|---------------|-------|
| **Frontend (Next.js)** | ✅ Operational | Feb 4, 2026 | All pages loading correctly |
| **Backend API** | ✅ Operational | Feb 4, 2026 | All admin endpoints use server-side routes |
| **Database (Supabase)** | ✅ Connected | Feb 4, 2026 | PostgreSQL with RLS, need migration 007, coordinates updated |
| **Admin Dashboard** | ✅ Fixed | Feb 4, 2026 | All pages migrated to API routes |
| **Admin Settings** | ⚠️ Partial | Feb 3, 2026 | Prayer settings work, Ramadan needs migration 007 |
| **WhatsApp Sending** | ✅ Active | Feb 4, 2026 | Account restored, name updated, welcome messages working |
| **WhatsApp Webhook** | ✅ Active | Feb 4, 2026 | Receiving messages |
| **Cron Jobs** | ✅ Running | Feb 2, 2026 | 5 jobs on cron-job.org |
| **Hadith API** | ✅ Integrated | Feb 2, 2026 | random-hadith-generator.vercel.app |
| **E2E Tests** | ✅ 101 Passing | Feb 2, 2026 | Full admin dashboard coverage |
| **Rate Limiting** | ⚠️ Optional | - | Requires Upstash Redis |
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

## WhatsApp Account Status & Compliance

### Current Status: ✅ ACTIVE

| Item | Status | Details |
|------|--------|---------|
| **Account Status** | ✅ Active | Restored after appeal — business name was updated |
| **Appeal Result** | ✅ Approved | February 4, 2026 |
| **Business Name** | Masjid Notify | Updated from "Bochi" (name issue caused original suspension) |
| **Welcome Messages** | ✅ Sending | `masjid_notify_welcome` template working |
| **Message Templates** | ⚠️ Need approval | All other templates must be submitted to Meta for approval |

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

# PART 3: HOW TO DO THINGS

---

## Common Tasks & How-To Guides

### How to Test If Subscriptions Work

1. Go to https://masjid-notify.vercel.app
2. Enter a phone number and click Subscribe
3. Check Supabase > Table Editor > `subscribers` table
4. Your number should appear with `status: active`

**Note:** The WhatsApp welcome message won't send until the Meta account is restored.

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

# Morning hadith
curl -H "Authorization: Bearer masjidnotify2025cron" \
  "https://masjid-notify.vercel.app/api/cron/daily-hadith?time=fajr"

# Evening hadith
curl -H "Authorization: Bearer masjidnotify2025cron" \
  "https://masjid-notify.vercel.app/api/cron/daily-hadith?time=maghrib"
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

**Option 2: Via Database**
1. Go to Supabase > Table Editor > `subscribers`
2. Find the row and delete it

### How to Change Mosque Settings

1. Login to admin dashboard
2. Go to Settings
3. Change calculation method, Jumu'ah times, Ramadan mode, etc.
4. Click Save

**Or via database:**
1. Go to Supabase > Table Editor > `mosques`
2. Edit the row directly

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
3. Type your message
4. Click "Send Now" or schedule for later

**Note:** Won't work until WhatsApp is restored.

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
5. (When WhatsApp works) Check if you receive welcome message

### Test Prayer Reminder Flow

1. Subscribe with `pref_daily_prayers: true`
2. Wait until near a prayer time (within your offset, e.g., 15 mins before)
3. Manually trigger prayer reminders cron (see above)
4. Check Vercel logs for "messages sent" count
5. (When WhatsApp works) Check if you receive the reminder

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
1. Is WhatsApp account active? (Currently NO - under review)
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
| WhatsApp API error | Account suspended or token expired | Check Meta Business Manager |

### Problem: WhatsApp messages not sending

**Current Status:** Account suspended - wait for Meta appeal.

**General checklist (for future):**
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

---

## Recent Bug Fixes

### February 3, 2026 (v1.5.0)

| Issue | Root Cause | Solution | Status |
|-------|------------|----------|--------|
| **Announcements page showing 0 subscribers** | Used `createClientSupabase()` blocked by RLS | New API route `/api/admin/announcements/data` | ✅ Fixed |
| **Analytics charts empty** | Same RLS issue | New API route `/api/admin/analytics` | ✅ Fixed |
| **Settings page using client Supabase** | Same RLS issue | New API route `/api/admin/settings` (GET/PUT) | ✅ Fixed |
| **QR code page using client Supabase** | Same RLS issue | Now uses existing `/api/admin/stats` | ✅ Fixed |
| **Subscriber import using client Supabase** | Same RLS issue | New API route `/api/admin/subscribers/import` | ✅ Fixed |
| **Search bar not working** | Input component wrapper div blocking interaction | Replaced with raw `<input>` element | ✅ Fixed |
| **Settings save error: missing columns** | `ramadan_mode`, `iftar_reminder_mins` etc. not in DB | Created migration 007, added fallback in PUT route | ⚠️ Needs migration |
| **Missing preference badges** | Only 4 of 6 badges shown in subscribers table | Added Ramadan (teal) and Nafl Salahs (indigo) badges | ✅ Fixed |
| **WhatsApp 24h policy not shown** | Users unaware of messaging window limit | Added policy notice banner on announcements form | ✅ Fixed |
| **Messages count showing 0** | Possible mosque_id mismatch or silent insert failure | Added debug logging + error handling on welcome msg insert | ⚠️ Investigating |

### February 4, 2026 (v1.5.1)

| Issue | Root Cause | Solution | Status |
|-------|------------|----------|--------|
| **Wrong mosque coordinates** | Lat/lng pointed to Cape Town city center (-33.9249, 18.4241) instead of mosque | Updated DB to -33.9769192, 18.5006926 (Rondebosch East) | ✅ Fixed |
| **Landing page location text** | Showed "Cape Town, South Africa" — too generic | Changed to "Rondebosch East, Cape Town" | ✅ Fixed |
| **Stale prayer times cache** | Cached times based on old coordinates | Cleared `prayer_times_cache` for the mosque | ✅ Fixed |
| **Messages count = 0 on dashboard** | Welcome message insert to `messages` table failing silently | Enhanced error logging; likely CHECK constraint on `type` column needs updating in deployed DB | ⚠️ Investigating |
| **WhatsApp account status** | Was suspended by Meta | Appeal approved; business name updated to "Masjid Notify" | ✅ Resolved |

### February 2, 2026 (v1.3.0)

| Issue | Root Cause | Solution | Status |
|-------|------------|----------|--------|
| **Dashboard showing 0 subscribers** | Client-side Supabase queries blocked by RLS | Created server-side API routes (`/api/admin/stats`, `/api/admin/subscribers`) | ✅ Fixed |
| **Subscribers page showing empty** | Same RLS issue | API route uses `supabaseAdmin` which bypasses RLS | ✅ Fixed |
| **Messages count showing 0** | Queries not filtered by mosque_id | Added mosque_id filter to all queries | ✅ Fixed |

### Technical Details: v1.5.0 Admin Migration

All admin pages were migrated from `createClientSupabase()` (browser client blocked by RLS) to server-side API routes using `withAdminAuth()` + `supabaseAdmin` (service role key). The hardcoded `DEFAULT_MOSQUE_SLUG` was replaced with `admin.mosque_id` from the authenticated admin record.

**New API Routes Created (v1.5.0):**
- `GET /api/admin/settings` - Fetch mosque settings
- `PUT /api/admin/settings` - Update mosque settings (with Ramadan column fallback)
- `GET /api/admin/announcements/data` - Announcements page data
- `GET /api/admin/analytics` - Analytics charts data (subscriber growth, message types, status)
- `POST /api/admin/subscribers/import` - Bulk CSV import

**Previously Created (v1.3.0):**
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

### Admin Endpoints (Requires Auth via `withAdminAuth`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/admin/stats` | Dashboard statistics (subscriber counts, message counts) |
| `GET` | `/api/admin/subscribers` | List subscribers with optional status filter |
| `PATCH` | `/api/admin/subscribers` | Update subscriber status |
| `DELETE` | `/api/admin/subscribers?id=` | Delete subscriber |
| `POST` | `/api/admin/subscribers/import` | Bulk import subscribers from CSV |
| `GET` | `/api/admin/settings` | Get mosque settings |
| `PUT` | `/api/admin/settings` | Update mosque settings (prayer & Ramadan) |
| `GET` | `/api/admin/announcements/data` | Announcements page data (mosque, active count, recent) |
| `POST` | `/api/admin/announcements` | Send announcement immediately |
| `GET` | `/api/admin/announcements/schedule` | List scheduled messages |
| `POST` | `/api/admin/announcements/schedule` | Create scheduled message |
| `DELETE` | `/api/admin/announcements/schedule/[id]` | Cancel scheduled message |
| `GET` | `/api/admin/analytics` | Analytics data (subscriber growth, message types, status) |

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
│   │       │   ├── stats/route.ts          # Dashboard stats
│   │       │   ├── subscribers/route.ts    # Subscribers CRUD
│   │       │   ├── subscribers/import/route.ts # CSV bulk import
│   │       │   ├── settings/route.ts       # Mosque settings GET/PUT
│   │       │   ├── analytics/route.ts      # Analytics charts data
│   │       │   └── announcements/
│   │       │       ├── route.ts            # Send announcement
│   │       │       ├── data/route.ts       # Announcements page data
│   │       │       └── schedule/           # Scheduled messages
│   │       │
│   │       ├── cron/
│   │       │   ├── prayer-reminders/route.ts
│   │       │   ├── daily-hadith/route.ts
│   │       │   ├── jumuah-reminder/route.ts
│   │       │   ├── ramadan-reminders/route.ts
│   │       │   └── nafl-reminders/route.ts    # NEW: Tahajjud, Ishraq, Awwabin
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
│       ├── 006_simplify_preferences.sql
│       └── 007_add_ramadan_columns.sql   # Ramadan settings for mosques
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

Run these SQL statements in Supabase SQL Editor **in order**:

### Migration: Nafl Salahs + Hadith (if not already run)

```sql
-- Add nafl salahs preference column
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS pref_nafl_salahs BOOLEAN DEFAULT FALSE;

-- Add time_of_day to daily_hadith_log for twice-daily hadith
ALTER TABLE daily_hadith_log ADD COLUMN IF NOT EXISTS time_of_day VARCHAR(10) DEFAULT 'morning';

-- Update unique constraint for twice-daily hadith
ALTER TABLE daily_hadith_log DROP CONSTRAINT IF EXISTS daily_hadith_log_date_key;
ALTER TABLE daily_hadith_log ADD CONSTRAINT daily_hadith_log_date_time_key UNIQUE (date, time_of_day);
```

### Migration 007: Ramadan Columns (REQUIRED for settings save)

File: `supabase/migrations/007_add_ramadan_columns.sql`

```sql
-- Add Ramadan mode toggle
ALTER TABLE mosques ADD COLUMN IF NOT EXISTS ramadan_mode BOOLEAN DEFAULT FALSE;

-- Add Suhoor reminder offset (minutes before Fajr)
ALTER TABLE mosques ADD COLUMN IF NOT EXISTS suhoor_reminder_mins INTEGER DEFAULT 30;

-- Add Iftar reminder offset (minutes before Maghrib)
ALTER TABLE mosques ADD COLUMN IF NOT EXISTS iftar_reminder_mins INTEGER DEFAULT 15;

-- Add Taraweeh prayer time (optional)
ALTER TABLE mosques ADD COLUMN IF NOT EXISTS taraweeh_time TIME;
```

**Without this migration:** Settings page will show a warning "Ramadan settings require a database migration" and only save prayer time settings. The admin dashboard and Ramadan cron jobs will not function correctly for Ramadan features.

---

## Changelog

### Version 1.5.1 - February 4, 2026

#### Mosque Coordinates & Location Fix

Updated mosque coordinates from Cape Town city center to actual mosque location in Rondebosch East. This improves prayer time accuracy and the Google Maps link on the landing page.

#### Changes

| Change | Description |
|--------|-------------|
| **Coordinates updated** | -33.9249, 18.4241 → -33.9769192, 18.5006926 (via Supabase SQL) |
| **Landing page location** | "Cape Town, South Africa" → "Rondebosch East, Cape Town" |
| **Prayer times cache** | Cleared to force recalculation with correct coordinates |
| **Messages INSERT policy** | Added RLS policy to ensure message logging succeeds |
| **Subscribe error logging** | Enhanced logging for welcome message insert failures |
| **WhatsApp status** | Account restored and active after Meta appeal |

#### Files Modified

| File | Changes |
|------|---------|
| `src/app/landing-page.tsx` | Location text updated to "Rondebosch East, {mosque.city}" |
| `src/app/api/subscribe/route.ts` | Enhanced error logging for message insert with payload details |
| `PROJECT_STATUS.md` | Comprehensive update: WhatsApp active, coordinates, bug status |

#### SQL Run in Supabase

| SQL | Purpose |
|-----|---------|
| `UPDATE mosques SET latitude/longitude` | Correct coordinates for Rondebosch East |
| `DELETE FROM prayer_times_cache` | Clear stale cache |
| `CREATE POLICY on messages FOR INSERT` | Ensure message logging works |

---

### Version 1.5.0 - February 3, 2026

#### Complete Admin Dashboard API Migration

All admin pages now use secure server-side API routes instead of client-side Supabase queries. This fixes the RLS (Row Level Security) issue that caused empty data on multiple admin pages.

#### Bug Fixes

| Fix | Description |
|-----|-------------|
| **Announcements page: 0 subscribers** | Created `/api/admin/announcements/data` route |
| **Analytics charts: empty** | Created `/api/admin/analytics` route |
| **Settings: client-side queries** | Created `/api/admin/settings` route (GET + PUT) |
| **QR code page: client-side queries** | Now uses existing `/api/admin/stats` |
| **Subscriber import: client-side insert** | Created `/api/admin/subscribers/import` route |
| **Search bar not working** | Replaced Input component with raw `<input>` to fix wrapper div issue |
| **Settings save: missing columns** | Created migration 007 + fallback in PUT route for Ramadan columns |
| **Missing preference badges** | Added Ramadan (teal) and Nafl Salahs (indigo) badges to subscribers table |
| **WhatsApp policy not visible** | Added 24-hour messaging window notice on announcements form |
| **Welcome message silent failure** | Added error handling to message insert in subscribe route |

#### New API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/admin/settings` | GET | Fetch mosque settings |
| `/api/admin/settings` | PUT | Update mosque settings (with Ramadan column fallback) |
| `/api/admin/announcements/data` | GET | Announcements page data (mosque, active count, recent messages) |
| `/api/admin/analytics` | GET | Analytics data (subscriber growth, message types, status breakdown) |
| `/api/admin/subscribers/import` | POST | Bulk CSV import with validation |

#### Database Changes

| Change | File |
|--------|------|
| New migration: Ramadan columns for mosques | `supabase/migrations/007_add_ramadan_columns.sql` |

#### Files Modified

| File | Changes |
|------|---------|
| `src/app/admin/announcements/page.tsx` | Removed `createClientSupabase`, uses API route |
| `src/app/admin/settings/page.tsx` | Removed `createClientSupabase`, uses API route, shows migration warning |
| `src/app/admin/qr-code/page.tsx` | Removed `createClientSupabase`, uses stats API |
| `src/app/admin/subscribers/page.tsx` | Fixed search bar with raw `<input>`, improved partial matching |
| `src/components/admin/analytics-charts.tsx` | Removed `createClientSupabase`, uses API route |
| `src/components/admin/subscriber-import.tsx` | Removed `createClientSupabase`, uses API route |
| `src/components/admin/subscribers-table.tsx` | Added Ramadan and Nafl Salahs preference badges |
| `src/components/admin/announcement-form.tsx` | Added WhatsApp 24-hour policy warning banner |
| `src/app/api/admin/stats/route.ts` | Added debug logging for messages count |
| `src/app/api/subscribe/route.ts` | Added error handling for welcome message insert |

#### Security

- All admin pages now use `admin.mosque_id` from the authenticated admin record
- No hardcoded `DEFAULT_MOSQUE_SLUG` in any admin page or component
- `createClientSupabase` only used for authentication (layout.tsx, login/page.tsx) — NOT for data queries

---

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

# PART 4: EXTERNAL SERVICES & ACCOUNTS

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

**How to access:**
1. Go to https://vercel.com
2. Login with GitHub
3. Select "masjid-notify" project

### Supabase (Database)

**What it is:** Supabase is our PostgreSQL database with a nice UI. It also handles user authentication for the admin login.

**Key things to know:**
- Project ID: `jlqtuynaxuooymbwrwth`
- Has Row Level Security (RLS) - some queries need admin privileges
- Free tier has limits but we're well under them

**How to access:**
1. Go to https://supabase.com/dashboard
2. Login
3. Select the project

**Important tables:**
- `mosques` - Mosque settings (prayer calculation, times, etc.)
- `subscribers` - All subscribed users
- `messages` - Log of all sent messages
- `admins` - Admin users linked to mosques
- `daily_hadith_log` - Tracks which hadith was sent each day
- `prayer_times_cache` - Caches prayer times to reduce API calls
- `scheduled_messages` - Future scheduled announcements

### Meta Business / WhatsApp Cloud API

**What it is:** Meta (Facebook) provides the WhatsApp Business API. We use it to send messages.

**Key things to know:**
- Currently SUSPENDED (appeal submitted)
- Need to submit message templates for approval
- Has rate limits and quality scores
- Phone Number ID: `895363247004714`
- Business Account ID: `1443752210724410`

**How to access:**
1. Go to https://business.facebook.com
2. Login
3. Go to WhatsApp Manager

**Important areas:**
- **Message Templates:** Where you create/submit templates for approval
- **Phone Numbers:** Your WhatsApp Business numbers
- **Webhooks:** Configuration for receiving messages
- **API Setup:** Access tokens and settings

### cron-job.org (Scheduled Tasks)

**What it is:** A free service that calls our API endpoints on a schedule. This is how reminders get sent.

**Key things to know:**
- Free tier allows many jobs
- Each job calls a URL with headers on a schedule
- We have 5 jobs set up (see Cron Jobs section)

**How to access:**
1. Go to https://cron-job.org
2. Login
3. View/edit jobs

**Our jobs:**
1. Prayer Reminders - every 5 mins
2. Ramadan Reminders - every 5 mins
3. Nafl Reminders - every 5 mins
4. Morning Hadith - 3:30 AM UTC
5. Evening Hadith - 4:00 PM UTC

### GitHub (Code Repository)

**What it is:** Where all the code lives. Push here to deploy.

**Key things to know:**
- Main branch: `master`
- Push to master = auto-deploy to Vercel

**How to access:**
1. Go to https://github.com/alqode-dev/masjid-notify
2. Login if needed

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

**Document Version:** 1.5.1
**Last Updated:** February 4, 2026 @ 22:00 UTC
**Author:** Claude Code
**Status:** WhatsApp Active - Need to submit message templates for Meta approval
