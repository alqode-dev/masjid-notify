# Technology Stack

**Analysis Date:** 2026-01-31

## Languages

**Primary:**
- TypeScript ^5 - All application code (frontend and backend)

**Secondary:**
- SQL (PostgreSQL) - Database schema in `supabase/schema.sql`
- CSS - Styling via Tailwind in `src/app/globals.css`

## Runtime

**Environment:**
- Node.js (version not pinned, uses Next.js 16.1.6 requirements)
- React 19.2.3 (latest React with Server Components)

**Package Manager:**
- npm (via `package-lock.json`)
- Lockfile: present

## Frameworks

**Core:**
- Next.js 16.1.6 - Full-stack React framework with App Router
- React 19.2.3 - UI library with RSC (React Server Components) enabled

**UI:**
- Tailwind CSS ^4 - Utility-first CSS framework
- shadcn/ui (new-york style) - Component library via `components.json`
- Radix UI - Headless UI primitives (dialog, dropdown, tabs, etc.)
- Framer Motion ^12.29.2 - Animations
- Lucide React ^0.563.0 - Icons

**Forms:**
- React Hook Form ^7.71.1 - Form state management
- Zod ^4.3.6 - Schema validation
- @hookform/resolvers ^5.2.2 - Zod integration with React Hook Form

**Testing:**
- Playwright ^1.58.1 - End-to-end testing
- Config: `playwright.config.ts`

**Build/Dev:**
- PostCSS with @tailwindcss/postcss - CSS processing
- ESLint ^9 with eslint-config-next - Linting
- TypeScript ^5 - Type checking

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` ^2.93.3 - Supabase client for database operations
- `@supabase/ssr` ^0.8.0 - Supabase SSR integration for Next.js
- `next` 16.1.6 - Application framework

**UI Infrastructure:**
- `class-variance-authority` ^0.7.1 - Variant handling for components
- `clsx` ^2.1.1 - Conditional class names
- `tailwind-merge` ^3.4.0 - Tailwind class merging
- `sonner` ^2.0.7 - Toast notifications
- `next-themes` ^0.4.6 - Dark mode support

**Visualization:**
- `recharts` ^3.7.0 - Charts for analytics dashboard
- `qrcode.react` ^4.2.0 - QR code generation for subscription links

## Configuration

**TypeScript:**
- Config: `tsconfig.json`
- Target: ES2017
- Strict mode: enabled
- Module resolution: bundler
- Path alias: `@/*` maps to `./src/*`

**ESLint:**
- Config: `eslint.config.mjs`
- Uses Next.js core-web-vitals and TypeScript presets

**Tailwind:**
- Config: via `@tailwindcss/postcss` plugin in `postcss.config.mjs`
- CSS variables for theming in `src/app/globals.css`
- Uses OKLCH color space for theme colors

**shadcn/ui:**
- Config: `components.json`
- Style: new-york
- RSC: enabled
- Base color: neutral
- Icon library: lucide

**Environment Variables Required:**
```
NEXT_PUBLIC_SUPABASE_URL        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY   # Supabase anonymous key
SUPABASE_SERVICE_ROLE_KEY       # Supabase service role key (server-side)
WHATSAPP_PHONE_NUMBER_ID        # WhatsApp Cloud API phone ID
WHATSAPP_ACCESS_TOKEN           # WhatsApp Cloud API access token
WHATSAPP_WEBHOOK_VERIFY_TOKEN   # WhatsApp webhook verification token
CRON_SECRET                     # Secret for cron job authorization
NEXT_PUBLIC_APP_URL             # Application URL for settings links
ALADHAN_API_URL                 # (optional) Override for Aladhan API
```

**Build:**
- Next.js build config: `next.config.ts` (minimal, default settings)
- Build command: `npm run build`
- Dev command: `npm run dev`
- Start command: `npm run start`

## Platform Requirements

**Development:**
- Node.js (compatible with Next.js 16)
- npm for package management

**Production:**
- Vercel deployment target (cron jobs configured in `vercel.json`)
- Supabase for database (PostgreSQL)
- WhatsApp Cloud API for messaging

**Testing:**
- Playwright runs on Chromium and Mobile Chrome (Pixel 5)
- Test command: `npm run test`
- UI test command: `npm run test:ui`

---

*Stack analysis: 2026-01-31*
