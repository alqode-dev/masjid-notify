# Codebase Structure

**Analysis Date:** 2026-01-31

## Directory Layout

```
masjid-notify/
├── src/                    # Application source code
│   ├── app/                # Next.js App Router pages and API routes
│   │   ├── admin/          # Admin dashboard pages
│   │   ├── api/            # API route handlers
│   │   ├── settings/       # Subscriber settings pages
│   │   ├── globals.css     # Global styles (Tailwind)
│   │   ├── layout.tsx      # Root layout
│   │   ├── page.tsx        # Landing page (SSR)
│   │   └── landing-page.tsx # Landing page client component
│   ├── components/         # React components
│   │   ├── admin/          # Admin-specific components
│   │   └── ui/             # Shadcn/ui base components
│   └── lib/                # Utilities and service clients
├── supabase/               # Database schema and migrations
├── tests/                  # Playwright E2E tests
├── scripts/                # Utility scripts
├── public/                 # Static assets
├── docs/                   # Documentation
├── .planning/              # GSD planning documents
│   └── codebase/           # Codebase analysis docs
├── vercel.json             # Cron job configuration
├── package.json            # Dependencies and scripts
└── tsconfig.json           # TypeScript configuration
```

## Directory Purposes

**`src/app/`:**
- Purpose: Next.js App Router - pages, layouts, and API routes
- Contains: Page components, route handlers, nested layouts
- Key files:
  - `page.tsx`: Public landing page entry point
  - `layout.tsx`: Root layout with fonts, metadata, Toaster
  - `globals.css`: Tailwind CSS imports and custom styles

**`src/app/admin/`:**
- Purpose: Admin dashboard with protected routes
- Contains: Dashboard, subscribers, announcements, QR code, settings pages
- Key files:
  - `layout.tsx`: Auth guard, sidebar, loading states
  - `page.tsx`: Dashboard overview with stats and quick actions
  - `login/page.tsx`: Admin authentication page

**`src/app/api/`:**
- Purpose: Backend API endpoints
- Contains: Route handlers (route.ts files)
- Subdirectories:
  - `subscribe/`: Subscriber registration endpoint
  - `admin/announcements/`: Send announcements
  - `cron/`: Scheduled job endpoints (prayer-reminders, jumuah-reminder, daily-hadith, ramadan-reminders)
  - `webhook/whatsapp/`: Incoming WhatsApp message handler

**`src/app/settings/[token]/`:**
- Purpose: Dynamic route for subscriber preference updates
- Contains: Settings page accessible via tokenized link

**`src/components/`:**
- Purpose: Reusable React components
- Contains: Feature components and UI primitives
- Key files:
  - `subscribe-form.tsx`: Subscription form with preferences
  - `prayer-times.tsx`: Prayer times display component
  - `footer.tsx`: Site footer
  - `qr-code.tsx`: QR code generator component

**`src/components/admin/`:**
- Purpose: Admin dashboard-specific components
- Contains: Dashboard widgets, forms, tables
- Key files:
  - `sidebar.tsx`: Admin navigation sidebar
  - `stats-card.tsx`: Dashboard stat display cards
  - `subscribers-table.tsx`: Subscriber list table
  - `announcement-form.tsx`: Message composition form
  - `analytics-charts.tsx`: Dashboard charts (Recharts)

**`src/components/ui/`:**
- Purpose: Base UI components (Shadcn/ui)
- Contains: Button, Card, Input, Dialog, Table, etc.
- Pattern: Components from shadcn/ui library, customizable

**`src/lib/`:**
- Purpose: Shared utilities, type definitions, service clients
- Contains: Database clients, API wrappers, helper functions
- Key files:
  - `supabase.ts`: Supabase clients (admin + browser), database types
  - `whatsapp.ts`: WhatsApp Cloud API wrapper and message templates
  - `prayer-times.ts`: Aladhan API integration for prayer calculations
  - `utils.ts`: General utilities (cn, phone validation, date formatting)

**`supabase/`:**
- Purpose: Database schema and configuration
- Contains: SQL schema file
- Key files:
  - `schema.sql`: Full database schema with tables, RLS policies, triggers, seed data

## Key File Locations

**Entry Points:**
- `src/app/page.tsx`: Public-facing landing page
- `src/app/admin/page.tsx`: Admin dashboard home
- `src/app/api/subscribe/route.ts`: Subscription API

**Configuration:**
- `vercel.json`: Cron job schedules
- `package.json`: Dependencies and scripts
- `tsconfig.json`: TypeScript paths (@/ alias)
- `components.json`: Shadcn/ui configuration
- `.env.local`: Environment variables (not committed)

**Core Logic:**
- `src/lib/supabase.ts`: Database client and types
- `src/lib/whatsapp.ts`: WhatsApp messaging logic
- `src/lib/prayer-times.ts`: Prayer time calculations
- `src/app/api/cron/prayer-reminders/route.ts`: Main reminder logic

**Testing:**
- `tests/`: Playwright E2E test files
- `playwright.config.ts`: Playwright configuration

## Naming Conventions

**Files:**
- React components: `kebab-case.tsx` (e.g., `subscribe-form.tsx`)
- Route handlers: `route.ts` in appropriate directory
- Utilities: `kebab-case.ts` (e.g., `prayer-times.ts`)
- Pages: `page.tsx` (Next.js convention)
- Layouts: `layout.tsx` (Next.js convention)

**Directories:**
- Route segments: `kebab-case` (e.g., `prayer-reminders`, `qr-code`)
- Dynamic routes: `[param]` (e.g., `[token]`)
- Feature groups: `lowercase` (e.g., `admin`, `api`, `ui`)

**Components:**
- PascalCase exports: `SubscribeForm`, `PrayerTimesDisplay`
- Props interfaces: `ComponentNameProps` (e.g., `SubscribeFormProps`)

**Functions:**
- camelCase: `sendWhatsAppMessage`, `getPrayerTimes`
- Handlers: `handle*` prefix (e.g., `handleSubmit`, `handleStop`)

## Where to Add New Code

**New Public Page:**
- Create directory in `src/app/` (e.g., `src/app/about/`)
- Add `page.tsx` for the route

**New Admin Page:**
- Create directory in `src/app/admin/` (e.g., `src/app/admin/reports/`)
- Add `page.tsx`
- Add navigation item in `src/components/admin/sidebar.tsx`

**New API Endpoint:**
- Create directory in `src/app/api/` following RESTful naming
- Add `route.ts` with appropriate HTTP method handlers

**New Cron Job:**
- Create directory in `src/app/api/cron/` (e.g., `src/app/api/cron/weekly-summary/`)
- Add `route.ts` with GET handler and CRON_SECRET check
- Add schedule to `vercel.json` crons array

**New UI Component:**
- Shadcn/ui primitives: Add via `npx shadcn@latest add [component]` to `src/components/ui/`
- Feature component: Add to `src/components/` (public) or `src/components/admin/` (admin)

**New Utility/Service:**
- Add to `src/lib/` as `service-name.ts`
- Export functions and types

**New Database Table:**
- Add migration to `supabase/schema.sql`
- Add TypeScript type to `src/lib/supabase.ts`
- Add RLS policies as needed

## Special Directories

**`node_modules/`:**
- Purpose: npm package dependencies
- Generated: Yes
- Committed: No

**`.next/`:**
- Purpose: Next.js build output and cache
- Generated: Yes
- Committed: No

**`public/`:**
- Purpose: Static assets (images, favicon)
- Generated: No
- Committed: Yes

**`.planning/`:**
- Purpose: GSD planning and codebase analysis documents
- Generated: By Claude agents
- Committed: Recommended

**`.claude/`:**
- Purpose: Claude Code configuration and skills
- Generated: Yes
- Committed: Optional

---

*Structure analysis: 2026-01-31*
