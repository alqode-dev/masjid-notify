# External Integrations

**Analysis Date:** 2026-01-31

## APIs & External Services

**WhatsApp Cloud API:**
- Purpose: Send prayer reminders, announcements, and handle subscriber commands
- SDK/Client: Direct HTTP via `fetch()` in `src/lib/whatsapp.ts`
- API URL: `https://graph.facebook.com/v18.0`
- Auth: Bearer token via `WHATSAPP_ACCESS_TOKEN` env var
- Endpoints used:
  - `POST /{PHONE_NUMBER_ID}/messages` - Send text and template messages
- Features:
  - Text messages: `sendWhatsAppMessage()`
  - Template messages: `sendWhatsAppTemplate()` (for first contact)
  - Webhook handling: `src/app/api/webhook/whatsapp/route.ts`

**Aladhan Prayer Times API:**
- Purpose: Calculate accurate Islamic prayer times based on location
- SDK/Client: Direct HTTP via `fetch()` in `src/lib/prayer-times.ts`
- API URL: `https://api.aladhan.com/v1` (configurable via `ALADHAN_API_URL`)
- Auth: None (public API)
- Endpoints used:
  - `GET /timings/{date}` - Daily prayer times
  - `GET /calendar/{year}/{month}` - Monthly calendar
- Features:
  - Multiple calculation methods (ISNA, Muslim World League, etc.)
  - Hanafi/Shafi'i madhab support
  - Hijri date information

## Data Storage

**Supabase (PostgreSQL):**
- Purpose: Primary database for all application data
- Client: `@supabase/supabase-js` and `@supabase/ssr`
- Connection: Via env vars `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Schema: `supabase/schema.sql`
- Client code: `src/lib/supabase.ts`

**Database Tables:**
- `mosques` - Mosque configuration (location, prayer offsets, Ramadan mode)
- `subscribers` - User subscriptions with preferences
- `admins` - Mosque admin users (linked to Supabase Auth)
- `messages` - Log of all sent messages
- `hadith` - Curated hadith collection for daily messages

**Row Level Security (RLS):**
- Enabled on all tables
- Public can view mosques and subscribe
- Admins can manage their mosque's data
- Service role key bypasses RLS for cron jobs

**File Storage:**
- Not used (no file uploads in current implementation)

**Caching:**
- None configured (relies on Next.js built-in caching)

## Authentication & Identity

**Supabase Auth:**
- Purpose: Admin user authentication
- Implementation: Via Supabase client
- Admin table links `user_id` to `auth.users(id)`
- Roles: owner, admin, announcer

**No user authentication:**
- Subscribers identified by phone number only
- Settings links use generated tokens (not persisted)

## Monitoring & Observability

**Error Tracking:**
- None configured (uses console.error)

**Logs:**
- Server-side: `console.log()` / `console.error()` (Vercel logs)
- Message history: Stored in `messages` table with status and metadata

## CI/CD & Deployment

**Hosting:**
- Vercel (configured via `vercel.json`)

**CI Pipeline:**
- Not configured (no GitHub Actions or similar)

**Cron Jobs:**
- Configured in `vercel.json`
- Secured via `CRON_SECRET` env var with Bearer token auth

| Schedule | Endpoint | Purpose |
|----------|----------|---------|
| `*/5 * * * *` | `/api/cron/prayer-reminders` | Check and send prayer reminders |
| `0 10 * * 5` | `/api/cron/jumuah-reminder` | Friday Jumu'ah reminder at 10 AM |
| `30 6 * * *` | `/api/cron/daily-hadith` | Daily hadith at 6:30 AM |
| `*/5 * * * *` | `/api/cron/ramadan-reminders` | Suhoor/Iftar/Taraweeh reminders |

## Environment Configuration

**Required env vars:**
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# WhatsApp Cloud API
WHATSAPP_PHONE_NUMBER_ID
WHATSAPP_ACCESS_TOKEN
WHATSAPP_WEBHOOK_VERIFY_TOKEN

# Application
CRON_SECRET
NEXT_PUBLIC_APP_URL
```

**Optional env vars:**
```
ALADHAN_API_URL    # Override default Aladhan API URL
```

**Secrets location:**
- Environment variables (Vercel dashboard or `.env.local` for development)
- `.env.local` present in project but gitignored

## Webhooks & Callbacks

**Incoming:**
- WhatsApp webhook: `POST /api/webhook/whatsapp`
  - Handles: STOP, SETTINGS, HELP, PAUSE, RESUME commands
  - Verification: `GET /api/webhook/whatsapp` with Meta challenge

**Outgoing:**
- None (no webhook callbacks to external services)

## API Routes Summary

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/subscribe` | POST | Register new subscriber |
| `/api/admin/announcements` | POST | Send announcement to subscribers |
| `/api/webhook/whatsapp` | GET/POST | WhatsApp webhook endpoint |
| `/api/cron/prayer-reminders` | GET | Cron: prayer notifications |
| `/api/cron/jumuah-reminder` | GET | Cron: Friday reminder |
| `/api/cron/daily-hadith` | GET | Cron: daily hadith |
| `/api/cron/ramadan-reminders` | GET | Cron: Ramadan notifications |

## Integration Notes

**WhatsApp Business API Requirements:**
- Must have approved WhatsApp Business Account
- Template messages required for first contact (24-hour window)
- Phone number must be registered with Meta

**Prayer Time Calculation:**
- Uses Aladhan API with configurable calculation methods
- Supports per-mosque prayer time offsets
- Default: Muslim World League method (ID: 3)

**South Africa Focus:**
- Phone validation assumes SA format (+27)
- Default timezone: Africa/Johannesburg
- Default location: Cape Town coordinates

---

*Integration audit: 2026-01-31*
