# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Good Game Pickems - A competitive prediction platform for CS2 matches in the Good Game Ligaen (Norwegian esports league).

## Essential Commands

### Development

```bash
pnpm dev          # Start development server (http://localhost:3000)
pnpm build        # Build production bundle
pnpm start        # Start production server
```

### Code Quality

```bash
pnpm lint         # Run ESLint
pnpm format       # Format code with Prettier
pnpm type-check   # Run TypeScript type checking
pnpm test         # Run Jest tests
pnpm test:ci      # Run tests in CI mode
```

### Single Test Execution

```bash
pnpm test path/to/test.test.ts              # Run specific test file
pnpm test --testNamePattern="test name"     # Run tests matching pattern
pnpm test --watch                           # Run tests in watch mode
```

## Architecture Overview

### Tech Stack

- **Frontend**: Next.js 14 (App Router) + React 18 + TypeScript
- **Database**: Supabase (PostgreSQL with RLS)
- **Styling**: TailwindCSS + shadcn/ui components + MagicUI animations
- **State**: Zustand (client) + TanStack Query (server)
- **Auth**: Supabase Auth
- **Animations**: Framer Motion + MagicUI components

### Key Architectural Patterns

1. **Server-Side API Protection**: All Good Game Ligaen API calls happen server-side to protect the bearer token. Never expose `BEARER_TOKEN` to the client.

2. **Database-First Security**: Row Level Security (RLS) policies enforce access control at the database level. Always consider RLS when modifying database operations.

3. **Match Syncing Architecture**:
   - Cron job triggers sync via Supabase Edge Function
   - Server-side API fetches from Good Game Ligaen API
   - Batch processing with rollback on failure
   - Sync logs track all operations

4. **Points Calculation Flow**:
   ```
   User makes pick → Match completes → sync_match_results() →
   calculate_pick_points() → update_user_total_points()
   ```

### Code Organization

```
src/
├── app/              # Next.js pages and API routes
│   ├── api/         # Server-side endpoints
│   └── (routes)/    # Page components
├── components/       # Reusable React components
│   ├── ui/          # Base UI components (shadcn)
│   └── (features)/  # Feature-specific components
├── db/              # Database schema and migrations
│   ├── migrations/  # SQL migration files
│   └── functions/   # Reusable SQL functions
├── lib/             # Core utilities and integrations
│   ├── supabase.ts  # Supabase client instances
│   └── goodgame.ts  # Good Game API integration
└── stores/          # Zustand state management
```

### Critical Integration Points

1. **Good Game Ligaen API**:
   - Base URL: `https://www.goodgameligaen.no/api`
   - Division ID: 12517 (CS2)
   - Season ID: 13162 (Current)
   - Auth: Bearer token in `BEARER_TOKEN` env var

2. **Supabase Configuration**:
   - URL: `NEXT_PUBLIC_SUPABASE_URL`
   - Anon Key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Service Role: `SUPABASE_SERVICE_ROLE_KEY` (server-only)

3. **Database Operations**:
   - Always use typed Supabase client from `lib/supabase`
   - Check RLS policies when debugging access issues
   - Use database functions for complex operations

### Development Guidelines

1. **TypeScript**: Strict mode enabled. No `any` types allowed. Use proper type inference.

2. **Component Patterns**:
   - Server Components by default
   - Client Components only when needed (interactivity, hooks)
   - Use `use client` directive sparingly

3. **API Routes**: Return consistent error responses:

   ```typescript
   return NextResponse.json({ error: 'Description' }, { status: 400 })
   ```

4. **Database Migrations**:
   - Add new migrations to `src/db/migrations/`
   - Use descriptive filenames with operation prefix
   - Test rollback scenarios

5. **Testing Focus**:
   - Component behavior over implementation
   - Mock external APIs with MSW
   - Test error states and edge cases

### Common Tasks

**Adding a new match field**:

1. Update database schema in migrations
2. Modify `goodgame.ts` API types
3. Update sync logic in API route
4. Add UI components as needed

**Modifying points calculation**:

1. Update `calculate_pick_points` SQL function
2. Test with various scenarios
3. Consider impact on historical data
4. Update leaderboard function if needed

**Adding new user features**:

1. Check/update RLS policies
2. Add database fields via migration
3. Update TypeScript types
4. Implement UI with proper auth checks

### MagicUI Components

The project includes MagicUI animated components:

- **BorderBeam**: Animated border effect for highlighting active/upcoming matches
- **NumberTicker**: Smooth number animations for statistics
- **SparklesText**: Text with sparkle effects for achievements
- **ShimmerButton**: Button with shimmer loading effect

To add new MagicUI components:

```bash
npx shadcn@latest add "https://magicui.design/r/[component-name]" -y
```

Components are stored in `src/components/magicui/` and use the same patterns as shadcn/ui.
