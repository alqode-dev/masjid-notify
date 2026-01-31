# Coding Conventions

**Analysis Date:** 2025-01-31

## Naming Patterns

**Files:**
- Components: PascalCase for component files (e.g., `subscribe-form.tsx` exports `SubscribeForm`)
- UI components: kebab-case filenames in `src/components/ui/` (e.g., `button.tsx`, `input.tsx`)
- Lib utilities: kebab-case filenames (e.g., `prayer-times.ts`, `supabase.ts`)
- API routes: `route.ts` inside folder structure (Next.js App Router convention)
- Pages: `page.tsx` inside folder structure (Next.js App Router convention)

**Functions:**
- camelCase for all functions: `getPrayerTimes()`, `sendWhatsAppMessage()`, `formatPhoneNumber()`
- Async functions prefixed with action verb: `fetchStats()`, `handleSubmit()`, `validatePhone()`
- Helper functions: descriptive verbs: `isValidSAPhoneNumber()`, `isWithinMinutes()`, `formatTime12h()`

**Variables:**
- camelCase for variables: `prayerTimes`, `mosqueId`, `activeSubscribers`
- Constants: SCREAMING_SNAKE_CASE: `CALCULATION_METHODS`, `MADHAB`, `REMINDER_OPTIONS`
- Boolean variables: prefixed with `is`, `has`, `pref`: `isLoading`, `prefFajr`, `hasError`

**Types:**
- PascalCase for type definitions: `Mosque`, `Subscriber`, `PrayerTimes`, `DashboardStats`
- Interface props suffixed with `Props`: `SubscribeFormProps`, `ButtonProps`, `StatsCardProps`
- Use `type` for object shapes, `interface` for component props

## Code Style

**Formatting:**
- No dedicated Prettier config (relying on ESLint)
- 2-space indentation (TypeScript default)
- Double quotes for strings in JSX, single quotes in imports
- Trailing commas in multiline structures

**Linting:**
- ESLint 9 with flat config (`eslint.config.mjs`)
- Uses `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- Strict TypeScript mode enabled in `tsconfig.json`

**TypeScript Configuration:**
- Target: ES2017
- Strict mode enabled
- Module resolution: bundler
- JSX: react-jsx (automatic runtime)
- Non-null assertions used for env vars: `process.env.VAR!`

## Import Organization

**Order:**
1. React/Next.js imports: `import { useState } from "react"`
2. Third-party libraries: `import { motion } from "framer-motion"`
3. Internal UI components: `import { Button } from "@/components/ui/button"`
4. Internal lib utilities: `import { cn } from "@/lib/utils"`
5. Types (when separate): `import type { Mosque } from "@/lib/supabase"`
6. Icons: `import { Check, Send } from "lucide-react"`

**Path Aliases:**
- `@/*` maps to `./src/*` (configured in `tsconfig.json`)
- Always use `@/` for internal imports, never relative paths like `../../`

## Error Handling

**API Routes:**
```typescript
try {
  // Operation
  return NextResponse.json({ success: true, data })
} catch (error) {
  console.error('Descriptive error:', error)
  return NextResponse.json(
    { error: 'User-friendly message' },
    { status: 500 }
  )
}
```

**Validation Pattern:**
- Validate required fields first, return 400 with specific error message
- Use early returns for validation failures
- Log detailed errors with `console.error()`, return generic messages to client

**Client Components:**
```typescript
try {
  const response = await fetch('/api/endpoint')
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong')
  }
  // Success handling
} catch (err) {
  setError(err instanceof Error ? err.message : 'Generic fallback')
}
```

## Logging

**Framework:** Native `console.error()` and `console.log()`

**Patterns:**
- Log errors with context: `console.error('Error fetching mosque:', error)`
- No structured logging framework currently in use
- Avoid logging sensitive data (phone numbers, tokens)

## Comments

**When to Comment:**
- Database types have inline comments for non-obvious fields
- API endpoints have brief header comments explaining purpose
- Complex business logic (e.g., prayer time calculations) has explanatory comments

**JSDoc/TSDoc:**
- Not extensively used
- Function signatures rely on TypeScript types for documentation
- Interface properties are self-documenting through naming

## Function Design

**Size:**
- Functions generally kept under 50 lines
- Complex logic extracted to helper functions
- API route handlers can be longer (80-150 lines) due to sequential operations

**Parameters:**
- Use destructured objects for 3+ parameters: `{ mosqueName, mosqueId }: SubscribeFormProps`
- Default values in destructuring: `reminder_offset = 15`
- Optional parameters use `?` suffix

**Return Values:**
- API functions return `{ success: boolean; data?: T; error?: string }`
- React hooks return tuples or objects: `[state, setState]`
- Utility functions return transformed values or null on failure

## Module Design

**Exports:**
- Named exports preferred: `export function cn()`, `export { Button }`
- Default exports only for page components
- Re-export pattern not used (no barrel files)

**Barrel Files:**
- Not currently used
- Each component imported directly from its file

## Component Patterns

**Client Components:**
- Mark with `"use client"` directive at top of file
- Use hooks for state management: `useState`, `useEffect`
- Prefer controlled components for forms

**Server Components:**
- Default for pages (no directive needed)
- Data fetching done at component level with async/await
- Use `revalidate` for ISR: `export const revalidate = 300`

**UI Components:**
- Use `forwardRef` for form elements: `forwardRef<HTMLButtonElement, ButtonProps>`
- Set `displayName` for debugging: `Button.displayName = "Button"`
- Accept `className` prop and merge with `cn()` utility
- Use Tailwind CSS for all styling

**Props Pattern:**
```typescript
interface ComponentProps extends HTMLAttributes<HTMLElement> {
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children?: ReactNode;
}
```

## Styling Conventions

**Tailwind CSS:**
- Use `cn()` utility from `@/lib/utils` for conditional classes
- CSS variables for theming: `text-foreground`, `bg-background`, `text-primary`
- Responsive prefixes: `md:`, `lg:` for breakpoints
- Component variants use object maps for class combinations

**Animation:**
- Framer Motion for complex animations
- Tailwind for simple transitions: `transition-all duration-150`
- Use `AnimatePresence` for exit animations

**Colors:**
- Semantic color names: `primary`, `secondary`, `muted`, `destructive`
- CSS custom properties defined in `globals.css`
- Dark mode via `.dark` class variant

## State Management

**Local State:**
- `useState` for component-level state
- Multiple `useState` calls for independent state pieces
- No global state management library

**Form State:**
- Individual `useState` for each field (simple forms)
- `react-hook-form` available but not used in current forms
- Validation on blur and submit

**Server State:**
- Direct Supabase queries in components
- No caching layer (SWR, React Query)
- Use `createClientSupabase()` for client-side queries

## Database Conventions

**Supabase Client Usage:**
- `supabaseAdmin` for server-side with service role (bypasses RLS)
- `createClientSupabase()` for client-side queries
- `getSupabaseBrowserClient()` singleton for React components

**Query Patterns:**
```typescript
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('column', value)
  .single()
```

**Type Definitions:**
- Types defined in `src/lib/supabase.ts`
- Use type assertions for query results: `(subscribers as Subscriber[])`

---

*Convention analysis: 2025-01-31*
