# Masjid Notify

## What This Is

A WhatsApp notification system for mosques. Users scan a QR code, subscribe to the mosque, and receive prayer reminders, announcements, and special Ramadan notifications via WhatsApp. Currently an MVP targeting a single mosque (Test Masjid, Cape Town, Hanafi) with a Ramadan 2025 deadline (~Feb 28, 2025).

## Core Value

**Subscribers receive timely prayer reminders via WhatsApp without installing an app.** If everything else fails, this must work — people get notified before each prayer.

## Requirements

### Validated

<!-- Shipped and confirmed working. -->

- ✓ Landing page with prayer times display and subscribe form — existing
- ✓ Multi-step subscribe form with SA phone validation — existing
- ✓ Automated WhatsApp welcome message on subscription — existing
- ✓ Admin login with Supabase Auth email/password — existing
- ✓ Admin dashboard with stats overview and analytics charts — existing
- ✓ Subscribers table with search, filter, status management, CSV export/import — existing
- ✓ Announcements composer with templates, preview, broadcast — existing
- ✓ Mosque settings for prayer calculation, Jumu'ah times, Ramadan mode — existing
- ✓ QR code generator with download and print — existing
- ✓ Automated prayer reminders before each prayer — existing
- ✓ Friday morning Jumu'ah reminder with times — existing
- ✓ Daily hadith after Fajr — existing
- ✓ Ramadan reminders (Suhoor, Iftar, Taraweeh) — existing
- ✓ WhatsApp webhook handling (STOP, HELP, SETTINGS, PAUSE, RESUME) — existing
- ✓ User settings page with token-based preference updates — existing
- ✓ Analytics charts (subscriber growth, message types, status) — existing
- ✓ Message templates for common announcements — existing
- ✓ Bulk CSV import with validation and preview — existing

### Active

<!-- Current scope. Building toward these. -->

**Production Deployment:**
- [ ] Create admin user in Supabase Auth and link to admins table
- [ ] Deploy to Vercel with production configuration
- [ ] Set all environment variables in Vercel dashboard
- [ ] Configure WhatsApp webhook URL in Meta Developer Console
- [ ] Generate production secrets (CRON_SECRET, WHATSAPP_WEBHOOK_VERIFY_TOKEN)
- [ ] End-to-end production testing

**Security & Stability (from CONCERNS.md):**
- [ ] Add settings token persistence (store token in database, validate on settings page)
- [ ] Add server-side authentication to admin API routes
- [ ] Implement WhatsApp webhook signature verification (X-Hub-Signature-256)
- [ ] Add rate limiting to public endpoints (subscribe, webhook)
- [ ] Use constant-time comparison for cron secret
- [ ] Fix phone number format normalization in webhook

**Performance & Reliability:**
- [ ] Fix prayer time reminder window (increase to 5 min or track last sent)
- [ ] Implement concurrent WhatsApp message sending with batching
- [ ] Add prayer times caching (valid for entire day)
- [ ] Batch subscriber updates instead of N+1 queries

**High-Priority Features:**
- [ ] Message scheduling (schedule announcements for future delivery)
- [ ] WhatsApp message templates (Meta approved templates for first messages)
- [ ] Error monitoring with Sentry integration

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Multi-mosque support — MVP is single mosque; adds complexity for tenant isolation
- Mobile app — web-first approach; WhatsApp is the mobile interface
- Donation integration — not core to notification value; defer to post-MVP
- Multi-language (Arabic/Afrikaans) — English sufficient for MVP; adds translation overhead
- Real-time chat — high complexity; not needed for notification use case
- Video content — storage/bandwidth costs; text notifications are sufficient
- Delivery receipts tracking — nice-to-have but not blocking MVP
- Event calendar — announcements cover this use case for now

## Context

**Technical Environment:**
- Next.js 16.1.6 App Router with React 19.2.3 and Server Components
- Supabase PostgreSQL with Row Level Security
- WhatsApp Cloud API v18.0 for messaging
- Aladhan API for prayer times
- Vercel for hosting with cron jobs
- Tailwind CSS v4 + shadcn/ui (New York style) + Framer Motion

**Current State:**
- All core features implemented and working locally
- Supabase project exists: `jlqtuynaxuooymbwrwth`
- Database schema deployed with RLS policies
- Admin dashboard fully functional
- Cron jobs configured in vercel.json

**Known Issues (from CONCERNS.md):**
- Settings token not persisted — settings links don't work
- Admin API routes lack server-side auth — security risk
- No webhook signature verification — blocks production WhatsApp setup
- Sequential message sending — will timeout at scale
- No rate limiting — abuse risk on public endpoints

## Constraints

- **Timeline**: Must be production-ready by Ramadan 2025 (~Feb 28, 2025)
- **Platform**: Vercel deployment (cron limits: 10s hobby, 60s pro)
- **API**: WhatsApp Cloud API rate limits (80 msg/sec max)
- **Budget**: Hobby/Pro tier Vercel; Supabase free tier adequate for MVP
- **Single Mosque**: No multi-tenant complexity for v1

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| WhatsApp over SMS | Free for users, rich messaging, no per-message cost | ✓ Good |
| Supabase over custom backend | Managed PostgreSQL, auth, RLS; faster to build | ✓ Good |
| Next.js App Router | Server components for SEO, API routes for backend | ✓ Good |
| Vercel Cron for reminders | Simple deployment, no separate worker infrastructure | — Pending (scale limit) |
| Single mosque MVP | Reduce complexity, validate core value first | ✓ Good |

---
*Last updated: 2026-01-31 after GSD initialization*
