# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Masjid Notify is a WhatsApp notification platform for mosques. Users subscribe via a web form and receive automated WhatsApp messages for prayer reminders, hadith, announcements, and Ramadan-specific notifications.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Supabase (PostgreSQL), WhatsApp Cloud API, Tailwind CSS 4, shadcn/ui

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

1. **Subscription:** User submits form → API saves to Supabase → Welcome message sent via WhatsApp
2. **Automated reminders:** cron-job.org pings `/api/cron/*` endpoints every 5 min → API checks prayer times (Aladhan API) → Sends WhatsApp to opted-in subscribers
3. **Admin announcements:** Admin dashboard → `/api/admin/announcements` → WhatsApp Cloud API

### Key Directories

```
src/
├── app/
│   ├── admin/           # Admin dashboard pages (login, subscribers, announcements, settings, qr-code)
│   ├── api/
│   │   ├── admin/       # Protected admin endpoints (require auth)
│   │   ├── cron/        # Automated reminder endpoints (prayer, jumuah, hadith, ramadan, nafl)
│   │   ├── subscribe/   # Public subscription endpoint
│   │   └── webhook/     # WhatsApp webhook (incoming messages, STOP/START/PAUSE commands)
│   └── settings/[token] # User preference page (24h token-based access)
├── components/
│   ├── admin/           # Dashboard components (sidebar, tables, forms, charts)
│   └── ui/              # shadcn/ui components
└── lib/
    ├── supabase.ts      # Database client + TypeScript types (Mosque, Subscriber, Message, etc.)
    ├── whatsapp.ts      # WhatsApp Cloud API client
    ├── whatsapp-templates.ts  # Meta template definitions (12 templates)
    ├── prayer-times.ts  # Aladhan API integration
    ├── hadith-api.ts    # Random hadith fetcher
    ├── auth.ts          # Supabase auth helpers
    └── message-sender.ts # Batch message sending with rate limiting
```

### Database Schema (Supabase)

Main tables: `mosques`, `subscribers`, `admins`, `messages`, `scheduled_messages`, `prayer_times_cache`, `daily_hadith_log`

Types are defined in `src/lib/supabase.ts`. Use `getSupabaseAdmin()` for server-side operations.

### WhatsApp Templates

Two types of "templates" in this project:
1. **Meta Templates** (`src/lib/whatsapp-templates.ts`) - 12 templates registered with WhatsApp API for automated messages
2. **Dashboard Templates** (`src/components/admin/message-templates.tsx`) - UI helpers for admins, all sent through the single `mosque_announcement` Meta template

### Cron Jobs

Five automated jobs via cron-job.org hitting `/api/cron/*`:
- `prayer-reminders` - 5 daily prayers
- `jumuah-reminder` - Friday reminder
- `daily-hadith` - Morning/evening hadith
- `ramadan-reminders` - Suhoor/Iftar/Taraweeh
- `nafl-reminders` - Tahajjud/Ishraq/Awwabin

All require `CRON_SECRET` header for authentication.

### Mosque Configuration

Single-mosque MVP uses `DEFAULT_MOSQUE_SLUG` from `src/lib/constants.ts`. Multi-mosque support is architected but not fully implemented.

## Environment Variables

Required:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_VERIFY_TOKEN`
- `CRON_SECRET`

Optional:
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (rate limiting)
- `SENTRY_DSN` (error tracking)

## Migrations

SQL migrations in `supabase/migrations/`. Run manually in Supabase SQL Editor.
