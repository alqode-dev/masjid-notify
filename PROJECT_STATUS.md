# Masjid Notify - Project Status

> **Last Updated:** January 31, 2026

## Table of Contents

- [Overview](#overview)
- [Current Status](#current-status-production-ready)
- [Production Deployment Checklist](#production-deployment-checklist)
- [Security Features](#security-features)
- [Bug Fixes & Improvements](#bug-fixes--improvements)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Environment Variables](#environment-variables)
- [API Routes](#api-routes)
- [Deployment](#deployment)
- [WhatsApp Commands](#whatsapp-commands)
- [Cron Jobs](#cron-jobs-verceljson)
- [Testing](#testing)
- [Development Tools](#development-tools)
  - [GSD (Get Shit Done)](#gsd-get-shit-done---structured-development-workflow)
  - [Ralph](#ralph---autonomous-agent-loop)
  - [UI UX Pro Max](#ui-ux-pro-max---ai-design-system)
  - [shadcn MCP](#shadcn-mcp---component-registry-connection)
  - [ReactBits Registry](#reactbits-registry---animated-components)
- [Future Enhancements](#future-enhancements)

---

## Overview

Masjid Notify is a WhatsApp notification system for mosques. Users scan a QR code, subscribe to the mosque, and receive prayer reminders, announcements, and special Ramadan notifications via WhatsApp.

| | |
|---|---|
| **Target** | Single mosque MVP (Test Masjid, Cape Town, Hanafi) |
| **Deadline** | Ramadan 2025 (~Feb 28, 2025) |
| **Status** | ✅ **PRODUCTION READY** - All security, performance, and reliability features implemented |
| **Supabase Project** | `jlqtuynaxuooymbwrwth` |

---

## Current Status: PRODUCTION READY

All core features have been implemented. The production deployment sprint completed **24 user stories** covering security hardening, performance optimization, reliability improvements, and feature enhancements.

### Summary of Production Sprint

| Category | Items Completed |
|----------|-----------------|
| Security Features | 7 |
| Performance Optimizations | 4 |
| Bug Fixes | 5 |
| New Features | 5 |
| Infrastructure | 3 |

---

## Production Deployment Checklist

| Step | Status | Description |
|------|--------|-------------|
| 1. Rate Limiting | ✅ Complete | Upstash Redis rate limiting on subscribe (10/min) and webhook (100/min) endpoints |
| 2. Webhook Security | ✅ Complete | X-Hub-Signature-256 verification with constant-time comparison |
| 3. Admin Auth | ✅ Complete | Server-side session verification on all /api/admin/* routes |
| 4. Cron Security | ✅ Complete | Constant-time CRON_SECRET verification prevents timing attacks |
| 5. Error Tracking | ✅ Complete | Sentry integration with source maps and session replay |
| 6. Structured Logging | ✅ Complete | JSON logging for all cron jobs with timing and metrics |
| 7. Message Templates | ✅ Complete | WhatsApp templates defined for Meta approval |
| 8. Create Admin User | ⬜ Pending | Create user in Supabase Auth, link to `admins` table |
| 9. Deploy to Vercel | ⬜ Pending | Run `vercel deploy --prod`, crons auto-configured |
| 10. Set Environment Variables | ⬜ Pending | Add all `.env.local` vars to Vercel dashboard |
| 11. Configure WhatsApp Webhook | ⬜ Pending | Set URL in Meta Developer Console |
| 12. Submit WhatsApp Templates | ⬜ Pending | Submit templates via Meta Business Manager |
| 13. Generate Production Secrets | ⬜ Pending | New `CRON_SECRET`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET` |
| 14. Test End-to-End | ⬜ Pending | Subscribe, receive welcome, test commands |

---

## Security Features

| Feature | Implementation | Files |
|---------|---------------|-------|
| **Rate Limiting (Subscribe)** | 10 requests/min per IP using Upstash Redis | `src/lib/ratelimit.ts`, `src/app/api/subscribe/route.ts` |
| **Rate Limiting (Webhook)** | 100 requests/min per IP using Upstash Redis | `src/lib/ratelimit.ts`, `src/app/api/webhook/whatsapp/route.ts` |
| **Webhook Signature Verification** | HMAC-SHA256 with X-Hub-Signature-256 header, constant-time comparison | `src/app/api/webhook/whatsapp/route.ts` |
| **Admin Server Auth** | Supabase session verification + admins table check | `src/lib/auth.ts`, all `/api/admin/*` routes |
| **Cron Secret (Timing-Safe)** | crypto.timingSafeEqual for CRON_SECRET verification | `src/lib/auth.ts`, all `/api/cron/*` routes |
| **Settings Token Auth** | 24-hour expiry tokens for subscriber settings | `src/app/api/settings/[token]/route.ts` |
| **Phone Number Normalization** | Consistent +27 format prevents lookup bypasses | `src/lib/utils.ts` |

---

## Bug Fixes & Improvements

### Bug Fixes

| Issue | Fix | Files |
|-------|-----|-------|
| **Prayer reminders missed** | Increased reminder window from 2 to 5 minutes + duplicate prevention via messages table | `src/lib/prayer-times.ts`, `src/app/api/cron/prayer-reminders/route.ts` |
| **Phone format mismatch** | Normalize all phone numbers to +27 format before database lookups | `src/lib/utils.ts`, `src/app/api/webhook/whatsapp/route.ts` |
| **RESUME for unsubscribed users** | Fixed handleResume() to properly reactivate unsubscribed users with appropriate message | `src/app/api/webhook/whatsapp/route.ts` |
| **Message count inaccuracy** | Dashboard now sums sent_to_count instead of counting rows | `src/app/admin/page.tsx`, `src/components/admin/analytics-charts.tsx` |
| **Hardcoded Ramadan dates** | Removed unused isRamadanSeason() - uses ramadan_mode DB flag exclusively | `src/lib/utils.ts` |

### Performance Optimizations

| Improvement | Implementation | Impact |
|-------------|----------------|--------|
| **Concurrent Message Sending** | p-limit with 10 concurrent requests | ~10x faster batch sends |
| **Batch Subscriber Updates** | Single UPDATE for all successful sends | Eliminates N+1 queries |
| **Prayer Times Caching** | Database cache by (mosque_id, date) | Reduces Aladhan API calls |
| **Force-Dynamic Cron Routes** | `export const dynamic = "force-dynamic"` | Prevents stale cached responses |

### Reliability Improvements

| Improvement | Implementation | Files |
|-------------|----------------|-------|
| **Structured Logging** | JSON format with timing, counts, errors | `src/lib/logger.ts`, all cron routes |
| **Error Tracking** | Sentry with source maps, session replay | `sentry.*.config.ts`, `next.config.ts` |
| **Duplicate Prevention** | Check messages table before sending | All cron routes |

---

## Features Implemented

### Core Features

| Feature | Status | Description |
|---------|--------|-------------|
| Landing Page | ✅ Done | Prayer times display, subscribe form, QR code |
| Subscribe Form | ✅ Done | Multi-step form with SA phone validation |
| WhatsApp Welcome | ✅ Done | Automated welcome message on subscription |
| Admin Login | ✅ Done | Supabase Auth email/password authentication |
| Admin Dashboard | ✅ Done | Stats overview with analytics charts |
| Subscribers Table | ✅ Done | Search, filter, status management, CSV export/import |
| Announcements | ✅ Done | Message composer with templates, preview, broadcast |
| Mosque Settings | ✅ Done | Prayer calculation, Jumu'ah times, Ramadan mode |
| QR Code Page | ✅ Done | Generate, download, and print QR codes |
| Prayer Reminders | ✅ Done | Automated reminders before each prayer |
| Jumu'ah Reminder | ✅ Done | Friday morning reminder with times |
| Daily Hadith | ✅ Done | Random hadith after Fajr |
| Ramadan Reminders | ✅ Done | Suhoor, Iftar, and Taraweeh reminders |
| WhatsApp Webhook | ✅ Done | Handle STOP, HELP, SETTINGS, PAUSE, RESUME, START commands |
| User Settings Page | ✅ Done | Token-based preference updates |
| Analytics Charts | ✅ Done | Subscriber growth, message types, status breakdown |
| Message Templates | ✅ Done | Pre-built templates for common announcements |
| Bulk Import | ✅ Done | CSV upload with validation and preview |

### New Features (Production Sprint)

| Feature | Status | Description |
|---------|--------|-------------|
| **Message Scheduling** | ✅ Done | Schedule announcements for future delivery with date/time picker |
| **Scheduled Messages UI** | ✅ Done | View pending scheduled messages, cancel before send time |
| **WhatsApp Templates** | ✅ Done | 8 Meta-compliant templates defined for approval |
| **Template Sending** | ✅ Done | Feature flag (WHATSAPP_USE_TEMPLATES) for gradual rollout |
| **Settings Token Persistence** | ✅ Done | Database-stored tokens with 24-hour expiry |

### WhatsApp Templates Defined

Templates ready for Meta Business Manager submission (`src/lib/whatsapp-templates.ts`):

| Template Name | Category | Purpose |
|---------------|----------|---------|
| `prayer_reminder` | UTILITY | Prayer time notifications ({{prayer_name}}, {{time}}, {{mosque}}) |
| `welcome_subscriber` | UTILITY | New subscriber welcome message ({{mosque_name}}) |
| `jumuah_reminder` | UTILITY | Friday prayer reminder ({{mosque}}, {{adhaan}}, {{khutbah}}) |
| `daily_hadith` | UTILITY | Daily hadith delivery ({{hadith_text}}, {{source}}, {{reference}}) |
| `mosque_announcement` | MARKETING | General announcements ({{mosque_name}}, {{announcement}}) |
| `ramadan_suhoor` | UTILITY | Suhoor reminder ({{fajr_time}}) |
| `ramadan_iftar` | UTILITY | Iftar reminder ({{countdown}}, {{maghrib_time}}) |
| `ramadan_taraweeh` | UTILITY | Taraweeh prayer reminder ({{mosque_name}}, {{taraweeh_time}}) |

**Template Submission Instructions:**
1. Go to Meta Business Manager > Message Templates
2. Create each template with the exact body text from `whatsapp-templates.ts`
3. Replace `{{1}}`, `{{2}}`, etc. with parameter placeholders
4. Submit for review (typically approved within 24-48 hours)
5. Set `WHATSAPP_USE_TEMPLATES=true` in production environment

---

## Tech Stack

### Frontend
- **Framework:** Next.js 16.1.6 (App Router)
- **React:** 19.2.3
- **Styling:** Tailwind CSS v4
- **UI Components:** shadcn/ui (Radix UI primitives, New York style)
- **Animations:** Framer Motion
- **Charts:** Recharts
- **Forms:** React Hook Form + Zod validation
- **Toasts:** Sonner

### Backend
- **Runtime:** Next.js API Routes (Edge/Serverless)
- **Database:** Supabase (PostgreSQL with RLS)
- **Authentication:** Supabase Auth
- **Cron Jobs:** Vercel Cron

### Security & Performance
- **Rate Limiting:** @upstash/ratelimit + @upstash/redis
- **Error Tracking:** @sentry/nextjs (source maps, session replay)
- **Concurrency Control:** p-limit (10 concurrent message sends)

### External APIs
- **WhatsApp:** Meta WhatsApp Cloud API v18.0
- **Prayer Times:** Aladhan API

### Testing
- **E2E:** Playwright

### Design System
- **Primary Color:** `#0d9488` (Teal-600)
- **Secondary Color:** `#f59e0b` (Amber-500 / Gold)
- **Style:** Mobile-first responsive design
- **Animations:** Framer Motion for smooth transitions
- **Components:** shadcn/ui (New York style)

---

## Project Structure

```
masjid-notify/
├── src/
│   ├── app/
│   │   ├── page.tsx                          # Home/Landing page (server)
│   │   ├── landing-page.tsx                  # Landing page (client)
│   │   ├── layout.tsx                        # Root layout
│   │   ├── globals.css                       # Global styles
│   │   ├── admin/
│   │   │   ├── layout.tsx                    # Protected admin layout
│   │   │   ├── page.tsx                      # Dashboard with stats & analytics
│   │   │   ├── login/page.tsx                # Admin login
│   │   │   ├── subscribers/page.tsx          # Subscriber management
│   │   │   ├── announcements/page.tsx        # Send announcements
│   │   │   ├── qr-code/page.tsx              # QR code generator
│   │   │   └── settings/page.tsx             # Mosque configuration
│   │   ├── settings/
│   │   │   └── [token]/page.tsx              # User preference updates
│   │   └── api/
│   │       ├── subscribe/route.ts            # POST: New subscription (rate limited)
│   │       ├── admin/
│   │       │   └── announcements/
│   │       │       ├── route.ts              # POST: Send announcement (auth required)
│   │       │       └── schedule/
│   │       │           ├── route.ts          # GET/POST: List/create scheduled
│   │       │           └── [id]/route.ts     # DELETE: Cancel scheduled
│   │       ├── cron/
│   │       │   ├── prayer-reminders/route.ts # Every 5 mins
│   │       │   ├── daily-hadith/route.ts     # 6:30 AM daily
│   │       │   ├── jumuah-reminder/route.ts  # Friday 10 AM
│   │       │   └── ramadan-reminders/route.ts# Every 5 mins (Ramadan)
│   │       └── webhook/
│   │           └── whatsapp/route.ts         # Incoming messages
│   ├── components/
│   │   ├── ui/                               # shadcn components
│   │   ├── footer.tsx
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
│   └── lib/
│       ├── supabase.ts                       # DB clients & types
│       ├── whatsapp.ts                       # WhatsApp API + template sending
│       ├── whatsapp-templates.ts             # Meta template definitions
│       ├── prayer-times.ts                   # Aladhan API + caching
│       ├── message-sender.ts                 # Concurrent batch sending
│       ├── ratelimit.ts                      # Upstash rate limiting
│       ├── auth.ts                           # Admin & cron authentication
│       ├── logger.ts                         # Structured JSON logging
│       └── utils.ts                          # Utilities (phone normalization, etc.)
├── supabase/
│   ├── schema.sql                            # Database schema
│   └── migrations/                           # Incremental migrations
│       ├── 001_add_settings_token.sql
│       ├── 002_add_prayer_times_cache.sql
│       └── 003_add_scheduled_messages.sql
├── sentry.client.config.ts                   # Sentry browser config
├── sentry.server.config.ts                   # Sentry server config
├── sentry.edge.config.ts                     # Sentry edge config
├── tests/                                    # Playwright tests
├── package.json
├── vercel.json                               # Cron configuration
└── .env.local                                # Environment variables
```

---

## Database Schema

### Tables

**mosques**
- Core mosque info (name, slug, location)
- Prayer settings (madhab, calculation_method)
- Prayer time offsets (fajr_offset, etc.)
- Jumu'ah times (adhaan, khutbah)
- Ramadan settings (mode, reminder times, taraweeh_time)

**subscribers**
- Phone number (+27 format)
- Status (active, paused, unsubscribed)
- Preferences (fajr, all_prayers, jumuah, programs, hadith, ramadan)
- Reminder offset (minutes before prayer)
- Settings token and expiry (24-hour tokens for preference updates)

**admins**
- Links user_id (auth.users) to mosque_id
- Roles: owner, admin, announcer

**messages**
- Log of all sent messages
- Types: prayer, hadith, announcement, ramadan, welcome, jumuah
- Metadata (JSONB for extra info)
- sent_to_count (number of recipients per batch)

**hadith**
- Curated hadith collection
- English/Arabic text, source, reference

**prayer_times_cache** (New)
- Cache prayer times by (mosque_id, date)
- Reduces Aladhan API calls
- Auto-invalidates daily by date key

**scheduled_messages** (New)
- Store scheduled announcements
- Status: pending, sent, cancelled
- Processed by prayer-reminders cron

### Row Level Security (RLS)
- Public can view mosques
- Admins can update their mosque
- Anyone can subscribe
- Admins can manage subscribers/messages
- Hadith is public

---

## Environment Variables

Create `.env.local` with (see `.env.local.example` for template):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# WhatsApp Cloud API
WHATSAPP_ACCESS_TOKEN=your-access-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_BUSINESS_ACCOUNT_ID=your-business-account-id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your-custom-verify-token
WHATSAPP_APP_SECRET=your-app-secret  # For webhook signature verification

# WhatsApp Templates (optional - falls back to plain text if not set)
WHATSAPP_TEMPLATE_NAMESPACE=your-business-account-id
WHATSAPP_USE_TEMPLATES=true  # Enable/disable template API

# Prayer Times API
ALADHAN_API_URL=https://api.aladhan.com/v1

# App
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app

# Security
CRON_SECRET=your-cron-secret  # Used with constant-time comparison

# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# Error Tracking (Sentry)
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
SENTRY_AUTH_TOKEN=your-auth-token  # For source map uploads
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
```

---

## API Routes

### Public Endpoints

**POST /api/subscribe**
- Body: `{ phone_number, mosque_id, preferences }`
- Validates SA phone, creates subscriber, sends welcome message
- Rate limited: 10 requests/min per IP

**GET/POST /api/webhook/whatsapp**
- GET: Webhook verification (returns challenge)
- POST: Handle incoming messages (STOP, SETTINGS, HELP, PAUSE, RESUME, START)
- Rate limited: 100 requests/min per IP
- Signature verified with X-Hub-Signature-256

**GET /api/settings/[token]**
- Validates settings token and returns subscriber preferences
- Token expires after 24 hours

**PUT /api/settings/[token]**
- Updates subscriber preferences
- Validates token before update

### Protected Endpoints (require admin auth)

**POST /api/admin/announcements**
- Body: `{ mosque_id, content }`
- Sends message to all active subscribers with pref_programs=true
- Uses WhatsApp templates when enabled

**POST /api/admin/announcements/schedule**
- Body: `{ mosque_id, content, scheduled_at }`
- Schedules announcement for future delivery

**GET /api/admin/announcements/schedule**
- Returns list of pending scheduled messages for admin's mosque

**DELETE /api/admin/announcements/schedule/[id]**
- Cancels a pending scheduled message

### Cron Endpoints (require CRON_SECRET with timing-safe comparison)

**GET /api/cron/prayer-reminders**
- Schedule: Every 5 minutes
- Sends reminders based on subscriber preferences and offsets
- Processes pending scheduled messages
- Duplicate prevention via messages table lookup
- Concurrent sending with p-limit (10 parallel)

**GET /api/cron/daily-hadith**
- Schedule: 6:30 AM daily
- Sends random hadith to subscribers with pref_hadith=true
- Concurrent sending with p-limit

**GET /api/cron/jumuah-reminder**
- Schedule: Friday 10:00 AM
- Sends Jumu'ah times to subscribers with pref_jumuah=true
- Concurrent sending with p-limit

**GET /api/cron/ramadan-reminders**
- Schedule: Every 5 minutes (only when ramadan_mode=true)
- Sends Suhoor, Iftar, and Taraweeh reminders
- Duplicate prevention per reminder type
- Concurrent sending with p-limit

---

## Deployment

### Prerequisites
1. Supabase project with schema applied
2. WhatsApp Business Account with Cloud API access
3. Vercel account

### Steps

1. **Run Database Schema**
   ```sql
   -- Copy supabase/schema.sql to Supabase SQL Editor and run
   ```

2. **Create Admin User**
   - In Supabase Dashboard > Authentication > Users, create a user
   - In SQL Editor, link user to admins table:
   ```sql
   INSERT INTO admins (mosque_id, user_id, name, email, role)
   SELECT m.id, 'user-uuid-here', 'Admin Name', 'admin@email.com', 'owner'
   FROM mosques m WHERE m.slug = 'test-masjid';
   ```

3. **Deploy to Vercel**
   ```bash
   vercel deploy --prod
   ```

4. **Set Environment Variables**
   - In Vercel Dashboard > Settings > Environment Variables
   - Add all variables from `.env.local`

5. **Configure WhatsApp Webhook**
   - Go to Meta Developer Console
   - App > WhatsApp > Configuration > Webhook
   - URL: `https://your-domain.vercel.app/api/webhook/whatsapp`
   - Verify Token: Same as `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
   - Subscribe to: messages

---

## WhatsApp Commands

Users can send these commands via WhatsApp:

| Command | Action |
|---------|--------|
| STOP | Unsubscribe from all messages |
| SETTINGS | Get link to update preferences (24-hour token) |
| HELP | Show available commands |
| PAUSE [days] | Pause notifications (1-30 days) |
| RESUME | Resume notifications (works for paused and unsubscribed users) |
| START | Alias for RESUME (resubscribe after STOP) |

---

## Cron Jobs (vercel.json)

```json
{
  "crons": [
    {
      "path": "/api/cron/prayer-reminders",
      "schedule": "*/5 * * * *"
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
      "schedule": "*/5 * * * *"
    }
  ]
}
```

---

## Testing

Run Playwright tests:

```bash
# Run all tests
npm test

# Run with UI
npm run test:ui
```

### Build Verification

Final production build verification (January 31, 2026):

```
✓ TypeScript compilation: PASSED (strict mode)
✓ ESLint: PASSED
✓ Next.js build: SUCCESS (4.7s compile + 3.0s static generation)

Route Configuration:
○ (Static)   - Landing, Admin pages prerendered
ƒ (Dynamic)  - All API routes server-rendered on demand

All Cron Routes: force-dynamic enabled
├ ƒ /api/cron/prayer-reminders
├ ƒ /api/cron/daily-hadith
├ ƒ /api/cron/jumuah-reminder
└ ƒ /api/cron/ramadan-reminders
```

---

## Development Tools

### Installed Tools

| Tool | Version | Purpose | Location |
|------|---------|---------|----------|
| **GSD (Get Shit Done)** | v1.10.1 | Meta-prompting system for structured dev workflow (discuss → plan → execute → verify) | `~/.claude/commands/gsd/`, `~/.claude/get-shit-done/` |
| **Ralph** | Latest | Autonomous AI agent loop - runs Claude Code continuously until all PRD items complete | `~/.claude/skills/ralph/`, `~/.claude/skills/prd/` |
| **UI UX Pro Max** | v2.2.3 | AI design skill with 67 UI styles, 96 color palettes, premium design system | `.claude/skills/ui-ux-pro-max/` |
| **shadcn MCP** | Latest | Direct connection to shadcn registry for accurate TypeScript props and components | `.mcp.json` |
| **ReactBits Registry** | Latest | 135+ animated React components (glow cards, typing animations, gradients, etc.) | `components.json` registry |

---

### GSD (Get Shit Done) - Structured Development Workflow

GSD provides a meta-prompting system that enforces disciplined development phases.

**Available Commands:**
| Command | Purpose |
|---------|---------|
| `/gsd:help` | Show all available GSD commands |
| `/gsd:new-project` | Initialize project tracking |
| `/gsd:discuss-phase` | Clarify requirements, constraints, and goals |
| `/gsd:plan-phase` | Create detailed implementation plan with file structure |
| `/gsd:execute-phase` | Build with atomic git commits |
| `/gsd:verify-work` | Run tests and validate implementation |

**Workflow:**
1. **Discuss** - Clarify what needs to be built
2. **Plan** - Design the solution with file structure
3. **Execute** - Implement with atomic commits
4. **Verify** - Test and validate

---

### Ralph - Autonomous Agent Loop

Ralph runs Claude Code in an autonomous loop until all PRD (Product Requirements Document) items are complete. Each iteration gets fresh context but maintains memory via git history + progress.txt + prd.json.

**Available Commands:**
| Command | Purpose |
|---------|---------|
| `/prd` | Create or manage Product Requirements Document |
| `/ralph` | Start autonomous development loop |

**How Ralph Works:**
1. Define tasks in a PRD (Product Requirements Document)
2. Run `/ralph` to start the autonomous loop
3. Claude Code works through each task iteratively
4. Progress is tracked via git commits and progress.txt
5. Loop continues until all PRD items are marked complete

**Use Cases:**
- Let Claude work autonomously while you step away
- Long-running refactoring or migration tasks
- Building features from detailed specifications

---

### UI UX Pro Max - AI Design System

Premium design skill with comprehensive UI/UX capabilities.

**Features:**
- 67 UI styles (glassmorphism, neumorphism, brutalism, etc.)
- 96 curated color palettes
- Typography system with font pairings
- Component design patterns
- Responsive design guidelines
- Accessibility best practices

**Data Files Available:**
- `colors.csv` - 96 color palettes
- `styles.csv` - 67 UI styles
- `typography.csv` - Font pairings and scales
- `icons.csv` - Icon libraries
- `charts.csv` - Data visualization patterns
- `landing.csv` - Landing page patterns
- `products.csv` - Product page patterns
- Stack-specific guides: `nextjs.csv`, `react.csv`, `shadcn.csv`, etc.

---

### shadcn MCP - Component Registry Connection

Model Context Protocol server connecting Claude Code directly to the shadcn component registry.

**Benefits:**
- Accurate TypeScript props and types
- Up-to-date component documentation
- Direct component installation
- Real-time registry access

**Configuration (`.mcp.json`):**
```json
{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["shadcn@latest", "mcp"]
    }
  }
}
```

---

### ReactBits Registry - Animated Components

135+ animated React components for premium UI effects.

**Installation:**
```bash
# Add any ReactBits component
npx shadcn@latest add @react-bits/<component-name>

# Examples:
npx shadcn@latest add @react-bits/glow-card
npx shadcn@latest add @react-bits/typing-animation
npx shadcn@latest add @react-bits/gradient-text
npx shadcn@latest add @react-bits/shimmer-button
```

**Configuration (`components.json`):**
```json
{
  "registries": {
    "@react-bits": "https://reactbits.dev/r/{name}.json"
  }
}
```

**Popular Components:**
- Glow cards and borders
- Typing animations
- Gradient text effects
- Shimmer buttons
- Animated backgrounds
- Hover effects
- Loading animations

---

### Configuration Files Summary

| File | Location | Purpose |
|------|----------|---------|
| `settings.local.json` | `.claude/` | Claude Code permissions for this project |
| `ui-ux-pro-max/` | `.claude/skills/` | UI/UX design skill data and scripts |
| `ralph/` | `~/.claude/skills/` | Ralph autonomous loop skill (global) |
| `prd/` | `~/.claude/skills/` | PRD management skill (global) |
| `gsd/` | `~/.claude/commands/` | GSD commands (global) |
| `get-shit-done/` | `~/.claude/` | GSD templates, workflows, references (global) |
| `.mcp.json` | Project root | shadcn MCP server configuration |
| `components.json` | Project root | shadcn/ui config with ReactBits registry |

---

### Quick Start Commands

```bash
# GSD - Start structured workflow
/gsd:help

# Ralph - Start autonomous loop
/prd          # First, create/update PRD
/ralph        # Then, start autonomous development

# Add shadcn components
npx shadcn@latest add button card dialog

# Add ReactBits animated components
npx shadcn@latest add @react-bits/glow-card
```

---

## Future Enhancements

### Completed (Production Sprint)

All high-priority items have been implemented:

| Feature | Status | Notes |
|---------|--------|-------|
| ~~Message Scheduling~~ | ✅ Done | Full UI with date/time picker, cancel support |
| ~~WhatsApp Templates~~ | ✅ Done | 8 templates defined, feature flag for rollout |
| ~~Rate Limiting~~ | ✅ Done | Upstash Redis on subscribe and webhook |
| ~~Error Monitoring~~ | ✅ Done | Sentry with source maps and session replay |

### Nice-to-Have (Post-Launch)

| Feature | Description | Effort |
|---------|-------------|--------|
| **Multi-language** | Arabic/Afrikaans translation support | Medium |
| **Prayer Time Widget** | Embeddable widget for mosque website | Medium |
| **Delivery Receipts** | Track message read/delivered status | High |
| **Message Analytics** | Delivery rates, open tracking | Medium |

### Future (Post-MVP)

| Feature | Description | Effort |
|---------|-------------|--------|
| **Multi-mosque** | Support multiple mosques with mosque selection | High |
| **Mobile App** | React Native app for admins | High |
| **Donation Integration** | Collect donations via SnapScan/PayFast | High |
| **Event Calendar** | Manage and announce mosque events | Medium |
| **Push Notifications** | Web push as WhatsApp alternative | Medium |

---

## Deployment Verification Checklist

After deployment, verify each feature works correctly:

### Core Functionality
- [ ] Landing page loads with prayer times
- [ ] Subscribe form submits and sends WhatsApp welcome
- [ ] Admin can log in to dashboard
- [ ] Dashboard shows correct subscriber count and message stats
- [ ] Subscribers table loads with search and filter working
- [ ] Announcement form sends messages to subscribers
- [ ] Scheduled announcements appear in pending list

### WhatsApp Commands
- [ ] STOP - User receives confirmation, status changes to "unsubscribed"
- [ ] START/RESUME - Unsubscribed user can resubscribe
- [ ] SETTINGS - User receives link with valid token
- [ ] Settings page loads and saves preferences
- [ ] PAUSE 7 - User paused for 7 days
- [ ] HELP - User receives command list

### Cron Jobs (trigger manually with Vercel dashboard)
- [ ] prayer-reminders - Sends reminders at correct times
- [ ] daily-hadith - Sends hadith after Fajr
- [ ] jumuah-reminder - Sends Friday reminder
- [ ] ramadan-reminders - Sends Ramadan reminders (when mode enabled)
- [ ] Scheduled messages are processed and sent

### Security Verification
- [ ] Rate limiting returns 429 on excessive requests
- [ ] Webhook rejects requests without valid signature
- [ ] Admin API returns 401 without auth
- [ ] Cron API returns 401 without valid secret
- [ ] Sentry receives test error in production

---

## Changelog

### Production Sprint - January 31, 2026

**Security (7 items):**
- US-001: Rate limiting on subscribe endpoint (10 req/min)
- US-002: Rate limiting on webhook endpoint (100 req/min)
- US-003: Webhook signature verification (X-Hub-Signature-256)
- US-004: Server-side admin authentication
- US-005: Settings token persistence with 24-hour expiry
- US-006: Constant-time cron secret comparison
- US-007: Phone number normalization

**Monitoring & Logging (2 items):**
- US-008: Sentry error tracking integration
- US-009: Structured JSON logging for cron jobs

**Reliability (4 items):**
- US-010: Fixed prayer reminder window (5 min) + duplicate prevention
- US-017: Fixed webhook phone format mismatch (already done via US-007)
- US-018: Fixed RESUME/START for unsubscribed users
- US-019: Fixed message log count accuracy

**Performance (3 items):**
- US-011: Concurrent message sending with p-limit
- US-012: Prayer times database caching
- US-013: Batch subscriber updates (verified, done in US-011)

**Features (4 items):**
- US-014: Scheduled messages database schema
- US-015: Scheduling UI in announcements page
- US-016: Cron processing for scheduled messages
- US-022: WhatsApp message template definitions

**Infrastructure (4 items):**
- US-020: Removed hardcoded Ramadan dates
- US-021: Force-dynamic on all cron routes
- US-023: Template-based message sending with feature flag
- US-024: Updated PROJECT_STATUS.md (this document)

---

## Support

For issues or questions, create an issue in the repository or contact the development team.
