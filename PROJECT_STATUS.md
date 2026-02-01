# Masjid Notify - Project Status

> **Last Updated:** February 1, 2026 @ 17:00 UTC
> **Status:** ✅ **LIVE IN PRODUCTION - READY FOR META APP APPROVAL**
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
| **Vercel Dashboard** | https://vercel.com/alqodes-projects/masjid-notify |
| **Supabase Dashboard** | https://supabase.com/dashboard/project/jlqtuynaxuooymbwrwth |

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Status](#system-status)
3. [Production Infrastructure](#production-infrastructure)
4. [Admin Access](#admin-access)
5. [Environment Variables](#environment-variables)
6. [All Features](#all-features)
7. [Security Implementation](#security-implementation)
8. [Bug Fixes Log](#bug-fixes-log)
9. [Performance Optimizations](#performance-optimizations)
10. [API Reference](#api-reference)
11. [WhatsApp Integration](#whatsapp-integration)
12. [Database Schema](#database-schema)
13. [Cron Jobs](#cron-jobs)
14. [Tech Stack](#tech-stack)
15. [Project Structure](#project-structure)
16. [Development Tools Used](#development-tools-used)
17. [Deployment History](#deployment-history)
18. [Testing Checklist](#testing-checklist)
19. [Known Limitations](#known-limitations)
20. [Future Enhancements](#future-enhancements)
21. [Troubleshooting Guide](#troubleshooting-guide)
22. [Changelog](#changelog)

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
| **Timezone** | Africa/Johannesburg |
| **Jumu'ah Khutbah** | 13:20 |

### Project Metrics

| Metric | Value |
|--------|-------|
| **Development Sprint** | January 31 - February 1, 2026 |
| **User Stories Completed** | 24/24 (100%) |
| **Total Commits** | 20+ commits in production branch |
| **Lines of Code** | ~7,000+ lines |
| **Files Created/Modified** | 150+ files |
| **Build Time** | ~30 seconds |
| **Deployment Region** | Washington D.C. (iad1) |

### Key Achievements

- ✅ Full WhatsApp Cloud API integration
- ✅ Automated prayer time reminders
- ✅ Admin dashboard with analytics
- ✅ Message scheduling system
- ✅ Rate limiting protection (optional)
- ✅ Webhook signature verification
- ✅ Structured logging
- ✅ Error tracking ready (Sentry)
- ✅ South African phone number validation
- ✅ **Real Hadith API Integration** (random-hadith-generator)
- ✅ **Simplified 5-option preferences**
- ✅ **Footer branding on all pages**

---

## System Status

### Component Health Check

| Component | Status | Last Verified | Notes |
|-----------|--------|---------------|-------|
| **Frontend (Next.js)** | ✅ Operational | Feb 1, 2026 10:00 | All pages loading correctly |
| **Backend API** | ✅ Operational | Feb 1, 2026 10:00 | All endpoints responding |
| **Database (Supabase)** | ✅ Connected | Feb 1, 2026 10:00 | PostgreSQL with RLS |
| **WhatsApp Sending** | ✅ Configured | Jan 31, 2026 17:00 | Access token valid |
| **WhatsApp Webhook** | ✅ Verified | Jan 31, 2026 17:30 | Subscribed to messages |
| **Cron Jobs** | ✅ Scheduled | Jan 31, 2026 17:00 | Daily schedule (Hobby plan) |
| **Hadith API** | ✅ Integrated | Feb 1, 2026 10:00 | random-hadith-generator.vercel.app |
| **Rate Limiting** | ⚠️ Disabled | - | Requires Upstash Redis |
| **Error Tracking** | ⚠️ Disabled | - | Requires Sentry DSN |

### Recent Changes Applied

| Date | Change | Description |
|------|--------|-------------|
| Feb 1, 2026 | Mosque Details | Updated from Test Masjid to Anwaarul Islam Rondebosch East |
| Feb 1, 2026 | Hadith API | Integrated random-hadith-generator.vercel.app for authentic hadiths |
| Feb 1, 2026 | Preferences | Simplified from 6 options to 5 clearer options |
| Feb 1, 2026 | Footer | Added "Powered by Alqode" to admin pages |
| Feb 1, 2026 | Daily Hadith Log | New table to prevent hadith repetition within 30 days |

---

## Production Infrastructure

### Vercel Deployment

| Property | Value |
|----------|-------|
| **Account** | alqodes-projects |
| **Project Name** | masjid-notify |
| **Production URL** | https://masjid-notify.vercel.app |
| **Framework** | Next.js 16.1.6 |
| **Node.js Version** | 18.x |
| **Build Command** | `next build` |
| **Output Directory** | `.next` |
| **Install Command** | `npm install` |
| **Region** | Washington D.C., USA (iad1) |
| **Plan** | Hobby (Free) |

### Deployment URLs

| Type | URL |
|------|-----|
| **Production** | https://masjid-notify.vercel.app |
| **Latest Deployment** | https://masjid-notify-ob7j34kvo-alqodes-projects.vercel.app |
| **Inspect** | https://vercel.com/alqodes-projects/masjid-notify |

### Supabase Configuration

| Property | Value |
|----------|-------|
| **Project ID** | jlqtuynaxuooymbwrwth |
| **Region** | (Default) |
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
| **Password** | (Set in Supabase Auth) |

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
- Export subscriber list
- Configure prayer time offsets
- Set Jumu'ah times
- Enable/disable Ramadan mode
- Configure Taraweeh time

---

## Environment Variables

### Production Variables (Vercel)

| Variable | Status | Value/Notes |
|----------|--------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Set | `https://jlqtuynaxuooymbwrwth.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Set | Supabase anon key (encrypted in Vercel) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Set | Supabase service role (encrypted) |
| `WHATSAPP_ACCESS_TOKEN` | ✅ Set | Meta access token (encrypted) |
| `WHATSAPP_PHONE_NUMBER_ID` | ✅ Set | `895363247004714` |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | ✅ Set | `1443752210724410` |
| `WHATSAPP_APP_SECRET` | ✅ Set | For webhook signature verification |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | ✅ Set | `masjidnotifywebhook2025` |
| `CRON_SECRET` | ✅ Set | `masjidnotify2025cron` |
| `ALADHAN_API_URL` | ✅ Set | `https://api.aladhan.com/v1` |
| `NEXT_PUBLIC_APP_URL` | ✅ Set | `https://masjid-notify.vercel.app` |

### Optional Variables (Not Configured)

| Variable | Purpose | How to Enable |
|----------|---------|---------------|
| `UPSTASH_REDIS_REST_URL` | Rate limiting | Create Redis at console.upstash.com |
| `UPSTASH_REDIS_REST_TOKEN` | Rate limiting | From Upstash dashboard |
| `SENTRY_DSN` | Error tracking | Create project at sentry.io |
| `NEXT_PUBLIC_SENTRY_DSN` | Client error tracking | Same as SENTRY_DSN |
| `SENTRY_AUTH_TOKEN` | Source map uploads | From Sentry settings |
| `WHATSAPP_USE_TEMPLATES` | Enable template API | Set to `true` after Meta approval |
| `WHATSAPP_TEMPLATE_NAMESPACE` | Template namespace | Your business account ID |

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
| 12 | Mosque Settings | ✅ Live | Prayer calculation, offsets, Jumu'ah times |
| 13 | Ramadan Mode | ✅ Live | Toggle Suhoor/Iftar/Taraweeh reminders |
| 14 | QR Code Generator | ✅ Live | Generate, download, print QR codes |
| 15 | Prayer Reminders | ✅ Live | Automated reminders via cron |
| 16 | Daily Hadith | ✅ Live | **Real API** - 5 authentic collections, no repeats for 30 days |
| 17 | Jumu'ah Reminder | ✅ Live | Friday morning reminder |
| 18 | Analytics Charts | ✅ Live | Subscriber growth, message breakdown |

### Subscriber Preferences (5 Simplified Options)

| Option | Database Field | Description |
|--------|----------------|-------------|
| All 5 Daily Prayers | `pref_daily_prayers` | Fajr, Dhuhr, Asr, Maghrib, Isha reminders |
| Jumu'ah Khutbah Reminder | `pref_jumuah` | Friday prayer notification with Khutbah time |
| Ramadan Mode | `pref_ramadan` | Suhoor, Iftar, Taraweeh reminders during Ramadan |
| Daily Hadith | `pref_hadith` | One authentic hadith every day |
| Announcements & Events | `pref_announcements` | Programs, Eid, special events from mosque |

### WhatsApp Command Features (6 Total)

| Command | Status | Description |
|---------|--------|-------------|
| `STOP` | ✅ Live | Unsubscribe from all messages |
| `START` | ✅ Live | Resubscribe after STOP |
| `RESUME` | ✅ Live | Resume after pause or STOP |
| `PAUSE [days]` | ✅ Live | Pause for 1-30 days |
| `SETTINGS` | ✅ Live | Get 24-hour preferences link |
| `HELP` | ✅ Live | Show available commands |

---

## Security Implementation

### Security Features (7 Total)

| Feature | Implementation | Status | File Location |
|---------|---------------|--------|---------------|
| **Rate Limiting (Subscribe)** | 10 req/min per IP via Upstash Redis | ⚠️ Disabled | `src/lib/ratelimit.ts` |
| **Rate Limiting (Webhook)** | 100 req/min per IP via Upstash Redis | ⚠️ Disabled | `src/lib/ratelimit.ts` |
| **Webhook Signature** | HMAC-SHA256 with X-Hub-Signature-256 | ✅ Active | `src/app/api/webhook/whatsapp/route.ts` |
| **Admin Auth** | Supabase session + admins table check | ✅ Active | `src/lib/auth.ts` |
| **Cron Auth** | crypto.timingSafeEqual for CRON_SECRET | ✅ Active | `src/lib/auth.ts` |
| **Settings Token** | 24-hour expiry database tokens | ✅ Active | `src/app/api/settings/[token]/route.ts` |
| **Phone Normalization** | Consistent +27 format | ✅ Active | `src/lib/utils.ts` |

---

## Hadith API Integration

### External API: random-hadith-generator.vercel.app

| Property | Value |
|----------|-------|
| **Base URL** | https://random-hadith-generator.vercel.app |
| **Authentication** | None required (free public API) |
| **Rate Limit** | None specified |

### Available Collections

| Collection | Endpoint | Approximate Count |
|------------|----------|-------------------|
| Sahih al-Bukhari | `/api/bukhari` | 7,563 hadiths |
| Sahih Muslim | `/api/muslim` | 3,032 hadiths |
| Sunan Abu Dawud | `/api/abudawud` | 3,998 hadiths |
| Sunan Ibn Majah | `/api/ibnmajah` | 4,342 hadiths |
| Jami at-Tirmidhi | `/api/tirmidhi` | 3,956 hadiths |

### Hadith Caching Strategy

1. **Daily Cache**: Today's hadith is cached in `daily_hadith_log` table
2. **All subscribers receive the same hadith** each day
3. **30-day no-repeat**: Tracks sent hadiths to prevent repetition
4. **Fallback**: If API fails, tries different collections
5. **Race condition handling**: Uses UNIQUE constraint on date

### Implementation Files

| File | Purpose |
|------|---------|
| `src/lib/hadith-api.ts` | API client with caching and deduplication |
| `src/app/api/cron/daily-hadith/route.ts` | Cron job using new API |
| `supabase/migrations/005_add_daily_hadith_log.sql` | Database table for tracking |

---

## Database Schema

### Tables Overview

| Table | Purpose | Row Count | RLS |
|-------|---------|-----------|-----|
| `mosques` | Mosque configuration | 1 (Anwaarul Islam) | ✅ |
| `subscribers` | User subscriptions | Variable | ✅ |
| `admins` | Admin users | 1 | ✅ |
| `messages` | Message log | Variable | ✅ |
| `hadith` | Legacy hadith collection | 50+ (deprecated) | ✅ |
| `daily_hadith_log` | **NEW**: Tracks sent hadiths | Variable | ✅ |
| `prayer_times_cache` | API response cache | Variable | ✅ |
| `scheduled_messages` | Scheduled announcements | Variable | ✅ |

### Table: mosques

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Mosque name ("Anwaarul Islam Rondebosch East") |
| `slug` | TEXT | URL-friendly identifier ("anwaarul-islam-rondebosch-east") |
| `city` | TEXT | City name ("Cape Town") |
| `country` | TEXT | Country ("South Africa") |
| `latitude` | FLOAT | GPS latitude |
| `longitude` | FLOAT | GPS longitude |
| `madhab` | TEXT | hanafi / shafii |
| `calculation_method` | INT | Aladhan method ID |
| `fajr_offset` | INT | Minutes offset |
| `dhuhr_offset` | INT | Minutes offset |
| `asr_offset` | INT | Minutes offset |
| `maghrib_offset` | INT | Minutes offset |
| `isha_offset` | INT | Minutes offset |
| `jumuah_adhaan_time` | TIME | Friday adhaan |
| `jumuah_khutbah_time` | TIME | Friday khutbah ("13:20:00") |
| `timezone` | TEXT | IANA timezone ("Africa/Johannesburg") |
| `ramadan_mode` | BOOLEAN | Enable Ramadan features |
| `suhoor_reminder_mins` | INT | Minutes before Fajr |
| `iftar_reminder_mins` | INT | Minutes before Maghrib |
| `taraweeh_time` | TIME | Taraweeh start time |

### Table: subscribers (Updated Schema)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `phone_number` | TEXT | +27 format |
| `mosque_id` | UUID | Foreign key |
| `status` | TEXT | active / paused / unsubscribed |
| `pause_until` | TIMESTAMP | Auto-resume date |
| `pref_daily_prayers` | BOOLEAN | **NEW**: All 5 daily prayers opt-in |
| `pref_jumuah` | BOOLEAN | Jumu'ah reminder opt-in |
| `pref_ramadan` | BOOLEAN | Ramadan reminders opt-in |
| `pref_hadith` | BOOLEAN | Daily hadith opt-in |
| `pref_announcements` | BOOLEAN | **RENAMED**: Announcements opt-in (was pref_programs) |
| `reminder_offset` | INT | Minutes before prayer |
| `settings_token` | TEXT | Preferences link token |
| `settings_token_expires` | TIMESTAMP | Token expiry (24h) |
| `subscribed_at` | TIMESTAMP | First subscription |
| `last_message_at` | TIMESTAMP | Last message received |

### Table: daily_hadith_log (NEW)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `date` | DATE | **UNIQUE** - One hadith per day |
| `collection` | VARCHAR(50) | Source collection (bukhari, muslim, etc.) |
| `hadith_number` | INTEGER | Hadith ID from API |
| `hadith_text` | TEXT | English translation |
| `hadith_arabic` | TEXT | Arabic text (if available) |
| `source` | VARCHAR(100) | Full source name |
| `reference` | VARCHAR(50) | Reference string |
| `created_at` | TIMESTAMP | When cached |

**Indexes:**
- `idx_daily_hadith_log_date` - Efficient date lookups (DESC)
- `idx_daily_hadith_log_lookup` - Check if hadith was recently used

---

## Database Migrations

### Migration Files

| File | Purpose |
|------|---------|
| `001_add_settings_token.sql` | Settings token for preferences |
| `002_add_prayer_times_cache.sql` | Prayer times caching |
| `003_add_scheduled_messages.sql` | Message scheduling |
| `004_update_mosque_details.sql` | **NEW**: Update to Anwaarul Islam |
| `005_add_daily_hadith_log.sql` | **NEW**: Hadith tracking table |
| `006_simplify_preferences.sql` | **NEW**: Simplify to 5 preferences |

### Running Migrations

Migrations must be run in Supabase SQL Editor:

1. Go to https://supabase.com/dashboard/project/jlqtuynaxuooymbwrwth/sql
2. Open each migration file in order (004, 005, 006)
3. Execute each SQL script
4. Verify with the SELECT statements at the end of each migration

---

## Cron Jobs

### Current Schedule (Vercel Hobby Plan)

```json
{
  "crons": [
    {
      "path": "/api/cron/prayer-reminders",
      "schedule": "0 4 * * *"
    },
    {
      "path": "/api/cron/jumuah-reminder",
      "schedule": "0 10 * * 5"
    },
    {
      "path": "/api/cron/daily-hadith",
      "schedule": "30 6 * * *"
    },
    {
      "path": "/api/cron/ramadan-reminders",
      "schedule": "0 3 * * *"
    }
  ]
}
```

### Schedule Details

| Cron | Schedule (UTC) | Local (SAST +2) | Purpose |
|------|---------------|-----------------|---------|
| prayer-reminders | 4:00 AM daily | 6:00 AM | Process scheduled + prayer reminders |
| daily-hadith | 6:30 AM daily | 8:30 AM | Fetch from external API + send |
| jumuah-reminder | 10:00 AM Fri | 12:00 PM | Friday prayer reminder |
| ramadan-reminders | 3:00 AM daily | 5:00 AM | Suhoor/Iftar/Taraweeh |

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.1.6 | React framework (App Router) |
| React | 19.2.3 | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Utility-first styling |
| shadcn/ui | Latest | Radix UI components |
| Framer Motion | Latest | Animations |
| Recharts | Latest | Charts |
| React Hook Form | Latest | Form handling |
| Zod | Latest | Schema validation |
| Sonner | Latest | Toast notifications |
| Lucide React | Latest | Icons |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js API Routes | 16.1.6 | Serverless functions |
| Supabase | Latest | Database + Auth |
| @supabase/ssr | Latest | Server-side auth |
| @supabase/supabase-js | Latest | Database client |

### External APIs

| API | Version | Purpose |
|-----|---------|---------|
| WhatsApp Cloud API | v18.0 | Messaging |
| Aladhan API | v1 | Prayer times |
| random-hadith-generator | Latest | **NEW**: Authentic hadiths |

---

## Project Structure

```
masjid-notify/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing page (dynamic)
│   │   ├── landing-page.tsx            # Landing client component
│   │   ├── layout.tsx                  # Root layout
│   │   ├── globals.css                 # Tailwind styles
│   │   │
│   │   ├── admin/
│   │   │   ├── layout.tsx              # Admin layout (auth + footer)
│   │   │   ├── page.tsx                # Dashboard
│   │   │   ├── login/page.tsx          # Login form (with footer)
│   │   │   ├── subscribers/page.tsx    # Subscriber management
│   │   │   ├── announcements/page.tsx  # Message composer
│   │   │   ├── qr-code/page.tsx        # QR generator
│   │   │   └── settings/page.tsx       # Mosque settings
│   │   │
│   │   ├── settings/
│   │   │   └── [token]/page.tsx        # User preferences (5 options)
│   │   │
│   │   └── api/
│   │       ├── subscribe/route.ts      # Subscription endpoint
│   │       │
│   │       ├── admin/announcements/
│   │       │   ├── route.ts            # Send announcement
│   │       │   └── schedule/
│   │       │       ├── route.ts        # List/create scheduled
│   │       │       └── [id]/route.ts   # Cancel scheduled
│   │       │
│   │       ├── cron/
│   │       │   ├── prayer-reminders/route.ts  # Uses pref_daily_prayers
│   │       │   ├── daily-hadith/route.ts      # Uses external API
│   │       │   ├── jumuah-reminder/route.ts
│   │       │   └── ramadan-reminders/route.ts
│   │       │
│   │       ├── settings/
│   │       │   └── [token]/route.ts    # Preferences API (5 options)
│   │       │
│   │       └── webhook/
│   │           └── whatsapp/route.ts   # WhatsApp webhook
│   │
│   ├── components/
│   │   ├── ui/                         # shadcn components
│   │   ├── footer.tsx                  # "Powered by Alqode"
│   │   ├── prayer-times.tsx
│   │   ├── qr-code.tsx
│   │   ├── subscribe-form.tsx          # 5 preference checkboxes
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
│       ├── hadith-api.ts               # NEW: External hadith API
│       ├── message-sender.ts           # Concurrent sending
│       ├── ratelimit.ts                # Rate limiting
│       ├── auth.ts                     # Auth utilities
│       ├── logger.ts                   # Structured logging
│       └── utils.ts                    # Helpers
│
├── supabase/
│   ├── schema.sql                      # Full schema
│   └── migrations/
│       ├── 001_add_settings_token.sql
│       ├── 002_add_prayer_times_cache.sql
│       ├── 003_add_scheduled_messages.sql
│       ├── 004_update_mosque_details.sql      # NEW
│       ├── 005_add_daily_hadith_log.sql       # NEW
│       └── 006_simplify_preferences.sql       # NEW
│
├── sentry.client.config.ts
├── sentry.server.config.ts
├── sentry.edge.config.ts
│
├── tests/                              # Playwright tests
├── public/                             # Static assets
├── .planning/                          # GSD workflow files
│
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
├── vercel.json
├── components.json
├── .mcp.json
└── .env.local.example
```

---

## Changelog

### Version 1.2.0 - February 1, 2026

#### Meta App Submission Ready

| Item | Value |
|------|-------|
| **Display Name** | Alqode Masjid Notify |
| **Privacy Policy URL** | https://masjid-notify.vercel.app/privacy |
| **Terms of Service URL** | https://masjid-notify.vercel.app/terms |
| **Data Deletion URL** | https://masjid-notify.vercel.app/data-deletion |
| **Category** | Business |
| **Contact Email** | alqodez@gmail.com |
| **App Icon** | `/public/app-icon.svg` (convert to 1024x1024 PNG for Meta) |

#### New Features

| Change | Description |
|--------|-------------|
| **Privacy Policy Page** | `/privacy` - Data collection, usage, and user rights |
| **Terms of Service Page** | `/terms` - Service terms and conditions |
| **Data Deletion Page** | `/data-deletion` - Instructions for data removal requests |
| **Footer Legal Links** | Added links to Privacy, Terms, Data Deletion in footer |
| **App Icon** | Created `/public/app-icon.svg` based on Alqode brand kit |

#### Bug Fixes

| Fix | Description |
|-----|-------------|
| **Settings Page Loading** | Fixed infinite loading on /admin/settings page |
| **WhatsApp Template Name** | Updated to use `masjid_notify_welcome` template |
| **Hardcoded Mosque Slug** | Removed all hardcoded slugs, now uses env var |
| **Database Schema** | Added missing `reminder_offset` column |

#### Files Added

| File | Purpose |
|------|---------|
| `src/app/privacy/page.tsx` | Privacy policy page |
| `src/app/terms/page.tsx` | Terms of service page |
| `src/app/data-deletion/page.tsx` | Data deletion instructions |
| `src/lib/constants.ts` | Centralized mosque slug constant |
| `public/app-icon.svg` | App icon for Meta submission |

#### Files Modified

| File | Changes |
|------|---------|
| `src/components/footer.tsx` | Added legal page links |
| `src/app/admin/settings/page.tsx` | Fixed loading state with error handling |
| `src/lib/whatsapp-templates.ts` | Updated welcome template name |
| All admin pages | Use DEFAULT_MOSQUE_SLUG from constants |

---

### Version 1.1.0 - February 1, 2026

#### New Features

| Change | Description |
|--------|-------------|
| **Real Hadith API** | Integrated random-hadith-generator.vercel.app |
| **5 Hadith Collections** | Bukhari, Muslim, Abu Dawud, Ibn Majah, Tirmidhi |
| **30-Day No-Repeat** | Tracks sent hadiths in daily_hadith_log table |
| **Daily Caching** | All subscribers receive same hadith each day |

#### Improvements

| Change | Description |
|--------|-------------|
| **Mosque Details** | Updated to Anwaarul Islam Rondebosch East |
| **Simplified Preferences** | Reduced from 6 confusing options to 5 clear options |
| **Footer Branding** | Added to admin layout and login page |
| **Database Schema** | Renamed pref_programs to pref_announcements |

#### Database Migrations

| Migration | Purpose |
|-----------|---------|
| `004_update_mosque_details.sql` | Update mosque record |
| `005_add_daily_hadith_log.sql` | Create hadith tracking table |
| `006_simplify_preferences.sql` | Simplify subscriber preferences |

#### Files Modified

| File | Changes |
|------|---------|
| `src/lib/hadith-api.ts` | **NEW** - External API client |
| `src/lib/supabase.ts` | Updated Subscriber type, added DailyHadithLog type |
| `src/app/api/cron/daily-hadith/route.ts` | Use external API instead of database |
| `src/app/api/subscribe/route.ts` | Use new preference fields |
| `src/app/api/settings/[token]/route.ts` | Use new preference fields |
| `src/app/api/cron/prayer-reminders/route.ts` | Use pref_daily_prayers |
| `src/components/subscribe-form.tsx` | 5 checkboxes with new labels |
| `src/app/settings/[token]/page.tsx` | 5 checkboxes with new labels |
| `src/app/page.tsx` | Updated mosque slug |
| `src/app/admin/page.tsx` | Updated mosque slug |
| `src/app/admin/layout.tsx` | Added Footer component |
| `src/app/admin/login/page.tsx` | Added Footer component |

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
| **WhatsApp Business Manager** | https://business.facebook.com |
| **Hadith API** | https://random-hadith-generator.vercel.app |

### Contact

For issues or questions, create an issue in the GitHub repository.

---

**Document Version:** 1.2.0
**Last Updated:** February 1, 2026 @ 17:00 UTC
**Author:** Claude Code + Ralph Autonomous Agent
**Status:** Production Ready - Meta App Submission Ready
