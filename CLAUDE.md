# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Masjid Notify is a PWA (Progressive Web App) push notification platform for mosques. Users subscribe via the web app, enable browser notifications, and receive automated push notifications for prayer reminders, hadith, announcements, and Ramadan-specific notifications.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Supabase (PostgreSQL), Web Push (VAPID), Serwist (Service Worker), Tailwind CSS 4, shadcn/ui

## Commands

```bash
npm run dev          # Development server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Playwright E2E tests (all)
npm run test:ui      # Playwright interactive UI
npx playwright test admin-dashboard   # Run specific test file
npx playwright test --headed          # Run tests with visible browser
```

### Test Setup

Tests require admin credentials in `.env.test.local`:
```env
TEST_ADMIN_EMAIL=your-admin@email.com
TEST_ADMIN_PASSWORD=your-password
```

## Architecture

### Data Flow

1. **Subscription:** User enables browser notifications → Service worker registers → Push subscription sent to API → Saved to Supabase → Welcome push notification sent
2. **Automated reminders:** cron-job.org pings `/api/cron/*` endpoints every 5 min → API checks prayer times (Aladhan API) → Sends push notifications to opted-in subscribers
3. **Admin announcements:** Admin dashboard → `/api/admin/announcements` → Web Push API → Push notifications to subscribers
4. **In-app notifications:** All sent notifications are also stored in the `notifications` table for in-app viewing at `/notifications`

### Key Directories

```
src/
├── app/
│   ├── admin/           # Admin dashboard pages (login, subscribers, announcements, settings, qr-code)
│   ├── api/
│   │   ├── admin/       # Protected admin endpoints (require auth)
│   │   ├── cron/        # Automated reminder endpoints (prayer, jumuah, hadith, ramadan, nafl)
│   │   ├── subscribe/   # Public subscription endpoint
│   │   ├── settings/    # Subscriber settings API (GET/PUT by subscriber ID)
│   │   └── notifications/ # In-app notification center API
│   ├── settings/        # Subscriber settings page (localStorage-based ID)
│   └── notifications/   # In-app notification center page
├── components/
│   ├── admin/           # Dashboard components (sidebar, tables, forms, charts)
│   └── ui/              # shadcn/ui components
├── sw.ts                # Service worker source (push events, notification clicks)
└── lib/
    ├── supabase.ts      # Database client + TypeScript types (Mosque, Subscriber, Message, Notification, etc.)
    ├── web-push.ts      # Web Push API client (VAPID-based)
    ├── push-sender.ts   # Batch push sending with concurrency control (p-limit)
    ├── prayer-times.ts  # Aladhan API integration
    ├── hadith-api.ts    # Random hadith fetcher
    ├── auth.ts          # Supabase auth helpers
    └── time-format.ts   # Client-safe time formatting utilities
```

### PWA & Service Worker

- `public/manifest.json` - PWA manifest (standalone display, icons, theme color)
- `src/sw.ts` - Service worker source compiled by Serwist
- `next.config.ts` - Wrapped with `withSerwist()` for service worker compilation
- Service worker handles `push` events (show notification) and `notificationclick` (open app)
- VAPID keys authenticate push subscriptions

### Database Schema (Supabase)

Main tables: `mosques`, `subscribers`, `admins`, `messages`, `scheduled_messages`, `prayer_times_cache`, `daily_hadith_log`, `notifications`

Subscriber identification: Push subscription endpoint + mosque_id (UNIQUE constraint). Subscriber ID stored in localStorage for settings access.

Types are defined in `src/lib/supabase.ts`. Use `getSupabaseAdmin()` for server-side operations.

### Cron Jobs

Five automated jobs via cron-job.org hitting `/api/cron/*`:
- `prayer-reminders` - 5 daily prayers + scheduled messages + auto-resume paused subscribers
- `jumuah-reminder` - Friday reminder
- `daily-hadith` - Morning/evening hadith
- `ramadan-reminders` - Suhoor/Iftar/Taraweeh
- `nafl-reminders` - Tahajjud/Ishraq/Awwabin

All require `CRON_SECRET` header for authentication. All use `tryClaimReminderLock` for idempotency.

### Mosque Configuration

Single-mosque MVP uses `DEFAULT_MOSQUE_SLUG` from `src/lib/constants.ts`. Multi-mosque support is architected but not fully implemented.

## Environment Variables

Required:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
- `CRON_SECRET`

Optional:
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (rate limiting)
- `SENTRY_DSN` (error tracking)

## Migrations

SQL migrations in `supabase/migrations/`. Run manually in Supabase SQL Editor.
