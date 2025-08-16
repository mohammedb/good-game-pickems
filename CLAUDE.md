# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Good Game Pickems - A competitive prediction platform for CS2, League of Legends, and Valorant matches in the Good Game Ligaen (Norwegian esports league). Users can predict match outcomes, earn points, climb leaderboards, and share their predictions with friends.

## Essential Commands

### Development

```bash
pnpm dev          # Start development server (http://localhost:3000)
pnpm build        # Build production bundle
pnpm start        # Start production server
pnpm analyze      # Analyze bundle size
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
- **Animations**: Framer Motion + MagicUI components + canvas-confetti
- **Charts**: Recharts
- **Notifications**: Sonner
- **Email**: Resend + React Email

### Key Architectural Patterns

1. **Server-Side API Protection**: All Good Game Ligaen API calls happen server-side to protect the bearer token. Never expose `GOOD_GAME_LIGAEN_TOKEN` to the client.

2. **Database-First Security**: Row Level Security (RLS) policies enforce access control at the database level. Always consider RLS when modifying database operations.

3. **Match Syncing Architecture**:
   - Cron job triggers sync via Supabase Edge Function
   - Server-side API fetches from Good Game Ligaen API
   - Batch processing (BATCH_SIZE = 25) with rollback on failure
   - Sync logs track all operations
   - Supports CS2, LoL, and Valorant matches

4. **Points Calculation Flow**:
   ```
   User makes pick → Match completes → sync_match_results() →
   calculate_pick_points() → update_user_total_points()
   ```

5. **Shared Predictions System**:
   - Users can share prediction summaries via unique URLs
   - 30-day expiration with view tracking
   - Accessible without authentication

### Code Organization

```
src/
├── app/              # Next.js pages and API routes
│   ├── api/         # Server-side endpoints
│   │   ├── admin/   # Admin management endpoints
│   │   ├── cron/    # Scheduled tasks
│   │   └── share-predictions/ # Sharing functionality
│   └── (routes)/    # Page components
├── components/       # Reusable React components
│   ├── ui/          # Base UI components (shadcn)
│   ├── magicui/     # MagicUI animated components
│   └── (features)/  # Feature-specific components
├── db/              # Database schema and migrations
│   ├── migrations/  # SQL migration files
│   └── functions/   # Reusable SQL functions
├── lib/             # Core utilities and integrations
│   ├── supabase.ts  # Supabase client instances
│   └── goodgame.ts  # Good Game API integration
├── stores/          # Zustand state management
├── hooks/           # Custom React hooks
└── utils/           # Utility functions
```

### Critical Integration Points

1. **Good Game Ligaen API**:
   - Base URL: `https://www.goodgameligaen.no/api`
   - Division IDs: 
     - CS2: 12517 (hardcoded)
     - LoL: 12518 (via `GOOD_GAME_LOL_DIVISION_ID`)
     - Valorant: 13601 (via `GOOD_GAME_VALORANT_DIVISION_ID`)
   - Season ID: 13162 (Current)
   - Auth: Bearer token in `GOOD_GAME_LIGAEN_TOKEN` env var

2. **Environment Variables**:
   ```bash
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   
   # Good Game Ligaen
   GOOD_GAME_LIGAEN_TOKEN=
   GOOD_GAME_LOL_DIVISION_ID=12518
   GOOD_GAME_VALORANT_DIVISION_ID=13601
   
   # Auth
   NEXTAUTH_URL=
   NEXTAUTH_SECRET=
   
   # Email
   RESEND_API_KEY=
   ```

3. **Database Tables**:
   - `users`: Extended user profiles
   - `matches`: Match data with game_type support
   - `picks`: User predictions
   - `seasons`: Season management
   - `achievements` & `user_achievements`: Gamification
   - `shared_predictions`: Shareable prediction summaries
   - `challenges` & `challenge_participants`: Competition system (disabled)

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

5. **Testing**:
   - Jest with SWC transformer
   - MSW v2 for API mocking
   - Test component behavior over implementation
   - Mock external APIs consistently

6. **Security**:
   - CSP headers configured in next.config.js
   - Image domains whitelisted for Good Game assets
   - Never expose sensitive tokens to client

### Common Tasks

**Adding a new match field**:
1. Update database schema in migrations
2. Modify `goodgame.ts` API types
3. Update sync logic in API route
4. Add UI components as needed

**Supporting a new game type**:
1. Add game_type enum value to database
2. Add division ID environment variable
3. Update `goodgame.ts` API integration
4. Modify sync logic for the new game
5. Update UI filtering and display

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

**Working with shared predictions**:
1. Generate share URL via `/api/share-predictions`
2. Access shared data at `/share/[id]`
3. URLs expire after 30 days
4. Track view counts automatically

**Re-enabling challenges** (see `docs/ENABLE_CHALLENGES.md`):
1. Uncomment navigation links
2. Enable challenge routes
3. Test challenge creation and participation

### MagicUI Components

The project includes extensive MagicUI animated components:

**Core animations**:
- `border-beam`: Animated borders
- `number-ticker`: Smooth number animations
- `sparkles-text`: Text with sparkle effects
- `shimmer-button`: Loading shimmer effect

**Advanced components**:
- `animated-list`, `magic-card`, `pulsating-button`
- `interactive-grid-pattern`, `animated-circular-progress-bar`
- `orbiting-circles`, `animated-grid-pattern`

To add new MagicUI components:
```bash
npx shadcn@latest add "https://magicui.design/r/[component-name]" -y
```

Components are stored in `src/components/magicui/` and follow shadcn/ui patterns.

### Custom Tailwind Configuration

The project includes extensive custom colors:
- **Semantic**: success, warning, info
- **Status**: active, upcoming, completed, locked
- **Tiers**: bronze, silver, gold, platinum
- **Activity**: sync, user, system, pick, match
- **Brand**: cyan, green, purple

### Development Tools

- **Husky**: Pre-commit hooks with lint-staged
- **GitHub Actions**: PR validation (type-check, lint, format, test)
- **Bundle Analyzer**: `pnpm analyze` for optimization
- **Cursor Rules**: Minimal, self-documenting TypeScript patterns

### Admin Features

Admin endpoints (`/api/admin/*`) provide:
- User management
- Match control
- Points recalculation
- System maintenance

Restrict access to admin features using proper authentication checks.