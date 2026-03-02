# Kikteria — Technical Architecture

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Game Mechanics](#game-mechanics)
- [Performance Optimizations](#performance-optimizations)
- [PWA & Offline Support](#pwa--offline-support)
- [Authentication](#authentication)
- [Deployment](#deployment)

---

## Overview

Kikteria is a full-stack TypeScript puzzle game where players place vibrating bacteria figures on a canvas without letting them touch. The game features 100 procedurally generated levels, an endless survival mode, a shop/upgrade system, achievements, daily challenges, community goals, and a global leaderboard.

The architecture follows a modern SPA pattern with a React frontend and Express backend, connected to a PostgreSQL database via Drizzle ORM.

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS v4 |
| **State Management** | Zustand (with selector-based subscriptions) |
| **Animations** | Framer Motion, CSS keyframe animations |
| **Backend** | Node.js, Express, TypeScript (tsx) |
| **Database** | PostgreSQL with Drizzle ORM |
| **Authentication** | Replit Auth (OpenID Connect / Google OAuth) |
| **Rendering** | HTML5 Canvas API (60fps game loop) |
| **PWA** | Service Worker, Web App Manifest |
| **Testing** | Vitest (190+ unit tests) |

---

## Project Structure

```
kikteria/
├── client/                     # Frontend application
│   ├── src/
│   │   ├── App.tsx             # Root component, game state router, win/lose screens
│   │   ├── components/
│   │   │   ├── game/           # Game-specific components
│   │   │   │   ├── GameEngine.tsx      # Canvas renderer, collision detection, 60fps loop
│   │   │   │   ├── HUD.tsx             # In-game UI (14 memoized sub-components)
│   │   │   │   ├── FigureQueue.tsx     # Next-figure preview canvas
│   │   │   │   ├── MainMenu.tsx        # Main menu with navigation
│   │   │   │   ├── Shop.tsx            # Upgrade purchase interface
│   │   │   │   ├── LevelSelect.tsx     # 100-level grid selector
│   │   │   │   ├── EndlessMode.tsx     # Endless mode lobby
│   │   │   │   ├── MutationChoice.tsx  # Endless mode mutation events
│   │   │   │   ├── Leaderboard.tsx     # Global rankings
│   │   │   │   ├── AchievementBoard.tsx
│   │   │   │   ├── AchievementCelebration.tsx
│   │   │   │   ├── DailyLabOrders.tsx
│   │   │   │   ├── WeeklyGoals.tsx
│   │   │   │   ├── LabChronicles.tsx   # Story/lore screen
│   │   │   │   ├── BacteriaCodex.tsx   # Bacteria encyclopedia
│   │   │   │   └── UpdateModal.tsx     # Version update prompt
│   │   │   └── ui/             # Shadcn/Radix UI primitives
│   │   ├── hooks/
│   │   │   └── use-auth.ts     # Authentication hook
│   │   ├── lib/
│   │   │   ├── store.ts        # Zustand game state (~1200 lines)
│   │   │   ├── game-constants.ts       # Bacteria templates, level configs, balance
│   │   │   ├── api.ts          # React Query hooks for all API calls
│   │   │   ├── engagement-service.ts   # Achievement tracking engine
│   │   │   ├── offline-storage.ts      # LocalStorage persistence + sync queue
│   │   │   ├── error-logger.ts         # Client error reporting
│   │   │   ├── sounds.ts               # Audio playback
│   │   │   └── network.ts              # Network status detection
│   │   ├── pages/
│   │   │   └── Admin.tsx       # Admin dashboard
│   │   └── index.css           # Global styles, animations, theme
│   └── index.html
├── server/
│   ├── index.ts                # Express server entry point
│   ├── routes.ts               # All API endpoints (~730 lines)
│   ├── storage.ts              # IStorage interface + Drizzle implementation
│   ├── db.ts                   # Database connection pool
│   ├── google-docs.ts          # Google Docs API client
│   ├── generate-docs.ts        # Documentation content generation
│   └── replit_integrations/
│       └── auth.ts             # Replit OIDC auth setup
├── shared/
│   ├── schema.ts               # Drizzle ORM schema + Zod validators
│   └── models/
│       └── auth.ts             # User/session table definitions
├── scripts/
│   ├── github-push.ts          # GitHub deployment script
│   └── generate-docs-script.ts # Google Docs generation
├── public/
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Service worker
│   └── icons/                  # App icons (192x192, 512x512)
├── drizzle.config.ts           # Drizzle ORM configuration
├── vitest.config.ts            # Test runner configuration
├── tailwind.config.ts          # Tailwind CSS configuration
└── package.json
```

---

## Frontend Architecture

### State Management (Zustand)

The game state is managed by a single Zustand store (`useGameStore`) in `client/src/lib/store.ts`. The store contains:

```typescript
interface GameState {
  // Navigation
  gameState: 'MENU' | 'PLAYING' | 'GAME_OVER' | 'WIN' | 'SHOP' | 'LEVEL_SELECT' | 
             'ENDLESS_MODE' | 'ENDLESS_PLAYING' | 'MUTATION_CHOICE' | 'CHRONICLES' | 
             'CODEX' | 'CELEBRATING';
  
  // Core game
  score: number;
  coins: number;
  highScore: number;
  currentLevel: number;
  currentLevelConfig: LevelConfig;
  placedFigures: PlacedFigure[];
  figureQueue: string[];
  currentFigureId: string | null;
  
  // Timers
  timeRemaining: number;
  timerInterval: number | null;
  
  // Upgrades
  upgrades: {
    bombCount: number;
    figureSize: number;
    queueSize: number;
    timeBonus: number;
    placementBonus: number;
    slowMo: number;
    shield: number;
    coinBoost: number;
    lucky: number;
    secondChance: number;
  };
  
  // Consumables
  freezeCount: number;
  cleanserCount: number;
  bombsRemaining: number;
  
  // Endless mode
  isEndlessMode: boolean;
  endlessWave: number;
  endlessHighScore: number;
  endlessBestWave: number;
  activeMutation: MutationModifier | null;
  
  // Progression
  maxUnlockedLevel: number;
  levelProgress: LevelProgress[];
}
```

**Performance Pattern:** The HUD component is split into 14 individually memoized sub-components, each using Zustand selectors to subscribe only to the specific state slice they render. This prevents the entire HUD from re-rendering when unrelated state changes (e.g., timer ticks don't re-render the score display).

```typescript
// Example: Only re-renders when score changes
const ScoreDisplay = memo(function ScoreDisplay() {
  const score = useGameStore(s => s.score);
  return <span>{score}</span>;
});
```

### Rendering Pipeline

The game uses HTML5 Canvas for all gameplay rendering:

1. **Game Loop:** `requestAnimationFrame` at 60fps
2. **Vibration System:** Each bacteria has a vibration pattern applied per-frame
3. **Collision Detection:** Runtime checks with hysteresis (12-frame sliding window)
4. **Visual Effects:** Ripples on placement, explosions for bombs, confetti for celebrations

### Animation System

The app uses a hybrid animation approach:

| Type | Technology | Usage |
|------|-----------|-------|
| Page transitions | Framer Motion `AnimatePresence` | Screen-to-screen navigation |
| List stagger | Framer Motion `variants` | Menu items, shop cards, level grid |
| Button feedback | CSS `active:scale-*` | Instant touch response (< 16ms) |
| Banners/popups | CSS keyframes | Notification banners, HUD overlays |
| Game entities | Canvas API | Bacteria vibration, explosions, ripples |

Custom CSS animations defined in `index.css`:
- `slide-up-fade`, `slide-down-fade` — directional entry
- `scale-in`, `pop-in` — modal/card appearance
- `shake` — error/collision feedback
- `banner-in` — centered notification entry
- `glow-ring`, `glow-pulse` — ambient glow effects
- `neon-flicker` — title text effect
- `float` — idle floating motion

---

## Backend Architecture

### Server (`server/index.ts`)

Express server with middleware stack:

```
Request → JSON Parser → URL Encoder → Logger → Auth Session → Routes → Response
```

- **Development:** Vite dev server middleware for HMR
- **Production:** Static file serving from `dist/public`

### Storage Layer (`server/storage.ts`)

Implements the `IStorage` interface pattern for data access:

```typescript
interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Profiles
  getPlayerProfile(userId: string): Promise<PlayerProfile | undefined>;
  updatePlayerProfile(userId: string, updates: Partial<PlayerProfile>): Promise<PlayerProfile>;
  
  // Leaderboard
  getLeaderboard(limit: number): Promise<LeaderboardEntry[]>;
  submitScore(userId: string, username: string, score: number): Promise<void>;
  
  // Level Progress
  getLevelProgress(userId: string): Promise<LevelProgress[]>;
  updateLevelProgress(userId: string, levelNumber: number, score: number, completed: boolean): Promise<void>;
  
  // Daily Orders, Weekly Goals, Achievements...
}
```

All database operations use Drizzle ORM with type-safe queries and conflict resolution (upserts) for idempotent operations.

---

## Database Schema

### Entity Relationship Diagram

```
users (1) ─────┬──── (N) player_profiles
               ├──── (N) leaderboard
               ├──── (N) level_progress
               ├──── (N) user_analytics
               ├──── (N) error_logs
               ├──── (N) daily_order_completions
               ├──── (N) weekly_goal_contributions
               └──── (N) user_achievement_progress

achievements (1) ──── (N) user_achievement_progress
daily_lab_orders (standalone, date-keyed)
weekly_goals (standalone, week-keyed)
app_update_policy (standalone, singleton)
```

### Tables

| Table | Purpose | Key Indexes |
|-------|---------|-------------|
| `users` | OAuth user accounts | PK: `id`, Unique: `email` |
| `sessions` | Express session store | PK: `sid`, Index: `expire` |
| `player_profiles` | Coins, upgrades, high scores | FK: `userId` → `users` |
| `leaderboard` | Global high scores | FK: `userId`, Index: `score` |
| `level_progress` | Per-level completion tracking | Unique: (`userId`, `levelNumber`) |
| `user_analytics` | Behavior tracking events | FK: `userId` |
| `error_logs` | Client error reports | FK: `userId` |
| `daily_lab_orders` | Daily challenge definitions | Keyed by `orderDate` |
| `daily_order_completions` | Per-user daily completions | Unique: (`userId`, `orderDate`) |
| `weekly_goals` | Community goal definitions | Keyed by `weekStart` |
| `weekly_goal_contributions` | Per-user weekly contributions | Unique: (`userId`, `weekStart`) |
| `achievements` | Achievement definitions | PK: `id` |
| `user_achievement_progress` | Per-user achievement status | Unique: (`userId`, `achievementId`) |
| `app_update_policy` | Version management | Singleton pattern |

---

## API Reference

### Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/login` | No | Initiates Replit OIDC login flow |
| GET | `/api/callback` | No | OIDC callback handler |
| GET | `/api/logout` | No | Destroys session |
| GET | `/api/auth/user` | Yes | Returns current user data |

### Player Profile

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/profile` | Yes | Get or create player profile (default: 500 coins) |
| PATCH | `/api/profile` | Yes | Update coins, high score, upgrade levels |

### Leaderboard

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/leaderboard` | No | Top scores (default limit: 10) |
| POST | `/api/leaderboard` | Yes | Submit score, auto-updates personal best |

### Level Progress

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/levels/progress` | Yes | All level progress for current user |
| POST | `/api/levels/progress` | Yes | Update/create level progress (upsert) |

### Daily Lab Orders

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/daily-order` | No | Today's challenge (auto-generated if none) |
| POST | `/api/daily-order/complete` | Yes | Record completion, award coins |

### Community Goals

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/community-goal` | No | Current weekly goal + progress |
| POST | `/api/community-goal/contribute` | Yes | Add contribution to community goal |

### Achievements

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/achievements` | No | All achievement definitions |
| GET | `/api/achievements/progress` | Yes | User's achievement progress |
| POST | `/api/achievements/progress` | Yes | Update progress, returns if newly unlocked |
| POST | `/api/achievements/claim` | Yes | Claim reward for unlocked achievement |

### Admin (requires admin role)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/stats` | Application statistics summary |
| GET | `/api/admin/users` | All registered users |
| GET | `/api/admin/profiles` | All player profiles |
| GET | `/api/admin/levels` | Global level progress data |
| GET | `/api/admin/leaderboard` | Full leaderboard (top 100) |
| GET | `/api/admin/analytics` | Recent analytics events |
| GET | `/api/admin/errors` | Recent error logs |
| GET/POST | `/api/admin/update-policy` | Manage version requirements |
| DELETE | `/api/admin/user/:userId` | Delete user and all data |
| POST | `/api/admin/generate-docs` | Trigger documentation generation |
| POST | `/api/admin/seed-achievements` | Re-seed achievement definitions |

### Utility

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/version` | No | Latest version, min supported, release notes |
| POST | `/api/errors` | No | Submit client error batch |
| POST | `/api/analytics` | Yes | Submit analytics event batch |

---

## Game Mechanics

### Collision System

The collision detection system uses a sophisticated hysteresis approach to handle vibrating figures:

1. **Effective Radius Calculation:**
   ```
   effectiveRadius = baseRadius × sizeScale × figureSizeMultiplier + vibrationEnvelope + collisionPadding(5px)
   ```

2. **Vibration Envelope:** Each vibration pattern contributes differently:
   - **Horizontal/Vertical:** `amplitude` in one axis
   - **Circular:** `amplitude` in both axes
   - **Pulse:** Scale expansion factor
   - **Diagonal:** `amplitude × 0.707` in both axes

3. **Runtime Collision Detection:**
   - O(N²) pairwise check each frame
   - 12-frame sliding window history
   - 50% contact ratio threshold (6/12 frames must show contact)
   - Clean frame counter resets after 5 consecutive clean frames

### Level Generation

100 levels are procedurally generated with escalating parameters:

| Parameter | Range (L1 → L100) |
|-----------|--------------------|
| Figures to place | 3 → 40 |
| Starting time | 45s → 25s |
| Speed multiplier | 0.3 → 2.5 |
| Size multiplier | 0.85 → 1.4 |
| Area shrink rate | 0 → 0.15 |

Level archetypes rotate through: Normal → Speed → Crowd → Tight → Milestone (every 10th) → Breather (post-milestone).

### Vibration Patterns

| Pattern | Movement | Envelope |
|---------|----------|----------|
| Horizontal | X-axis oscillation | `(amplitude, 0)` |
| Vertical | Y-axis oscillation | `(0, amplitude)` |
| Circular | Circular orbit | `(amplitude, amplitude)` |
| Pulse | Scale oscillation | Scale factor applied |
| Diagonal | 45° oscillation | `(amplitude×0.707, amplitude×0.707)` |

### Upgrade System

| Upgrade | Effect per Level | Max Level | Base Cost |
|---------|-----------------|-----------|-----------|
| Bombs+ | +1 tactical bomb | 5 | 150G |
| Shrink | -5% bacteria size | 5 | 200G |
| Preview+ | +1 queue preview | 3 | 100G |
| Time+ | +3s starting time | 5 | 120G |
| Bonus+ | +0.3s per placement | 5 | 150G |
| Slow-Mo | Slower vibration | 5 | 180G |
| Shield | Forgive 1 collision | ∞ (consumable) | 100G |
| Coin+ | +10% coin earnings | 5 | 250G |
| Lucky | More bombs in queue | 3 | 200G |
| 2nd Chance | Undo last move on game over | ∞ (consumable) | 200G |

### Skill Consumables

| Skill | Effect | Cost |
|-------|--------|------|
| Freeze | Stop all vibrations for 5 seconds | 80G |
| Cleanser | Lasso tool to remove bacteria in drawn area | 120G |

### Endless Mode

- **Waves:** Each wave adds 15 figures + 30 seconds
- **Mutations:** Every 3 waves, a mutation event occurs (player chooses countermeasure)
  - Examples: Hyperactive Strain, Gigantism, Overcrowding
- **Bosses:** Special bacteria every 5 waves with unique abilities
  - Megablob, Mitosis, Phase Shifter, Toxin Emitter

### Economy

- **Earning:** Level completion (score = coins), rare bacteria bonuses, achievements, daily orders
- **Spending:** Upgrades (escalating costs), consumables (fixed cost)
- **Achievement Tiers:** Bronze (1), Silver (2), Gold (3) — each tier awards increasing coin rewards

---

## Performance Optimizations

### Frontend

1. **Zustand Selectors:** HUD split into 14 memoized sub-components, each subscribing to individual state slices via selectors
2. **Template Cache:** FigureQueue uses a `Map<string, Template>` cache to avoid repeated `.find()` calls
3. **CSS Button Feedback:** All interactive buttons use CSS `active:scale-*` instead of Framer Motion `whileTap` — eliminates JS overhead for touch feedback (< 16ms response)
4. **Tabular Numbers:** Timer display uses `tabular-nums` font feature to prevent layout shift on digit changes
5. **Throttled LocalStorage:** Writes throttled to max 1/second, with immediate flush for high-value events
6. **requestAnimationFrame:** Game loop and figure queue both use `requestAnimationFrame` for GPU-synced rendering

### Backend

1. **Upsert Operations:** Level progress, contributions, and completions use `ON CONFLICT ... DO UPDATE` for atomic idempotent writes
2. **Composite Indexes:** Unique composite indexes on (`userId`, `levelNumber`), (`userId`, `orderDate`), (`userId`, `achievementId`) for fast lookups
3. **Batch Analytics:** Client batches analytics and error events before sending, reducing API calls

---

## PWA & Offline Support

### Service Worker (`public/sw.js`)

- **Strategy:** Network-first for HTML, Cache-first for static assets
- **Version Bumping:** Cache version increments force re-download of all assets
- **Auto-Reload:** Clients detect updated service worker and reload automatically

### Offline Storage (`client/src/lib/offline-storage.ts`)

- **LocalStorage Persistence:** Level progress, player stats, and session data stored locally
- **Pending Sync Queue:** Failed API calls are queued and retried when network returns
- **Merge Strategy:** Server data takes precedence; local data fills gaps

### PWA Manifest

```json
{
  "name": "Kikteria",
  "short_name": "Kikteria",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#0E1C1F",
  "background_color": "#0E1C1F"
}
```

---

## Authentication

Authentication uses Replit's built-in OIDC (OpenID Connect) integration:

1. User clicks "Sign In" → redirected to `/api/login`
2. Replit OIDC flow handles Google OAuth
3. Callback at `/api/callback` creates session and upserts user record
4. Session stored in PostgreSQL `sessions` table
5. All authenticated routes check `req.isAuthenticated()` middleware
6. Token refresh handled automatically by the auth middleware

Admin access is restricted to a hardcoded list of user IDs checked by the `isAdmin` middleware.

---

## Deployment

### Development

```bash
npm run dev          # Start Vite + Express dev server
npx vitest           # Run tests in watch mode
npx vitest run       # Run all 190+ tests
npm run db:push      # Sync Drizzle schema to database
```

### Production

The app is deployed via Replit's deployment system:
- Frontend is built with Vite (`npm run build`)
- Backend serves static files from `dist/public`
- PostgreSQL database is provisioned automatically
- Environment variables injected by Replit platform

### Testing

```bash
npx vitest run                                                    # All tests
npx vitest run client/src/lib/__tests__/layout-validation.test.ts # Layout tests
npx vitest run client/src/lib/__tests__/store.test.ts             # State tests
npx vitest run server/__tests__/storage.test.ts                   # Storage tests
```

Test coverage includes:
- Game constants and level generation
- Vibration envelope calculations
- Offline storage persistence
- Zustand store actions and state transitions
- Upgrade purchasing validation
- Endless mode mechanics
- Bomb targeting and detonation
- Layout validation across 5 device profiles (iPhone SE, iPhone 14 Pro Max, Pixel 5, iPad, Desktop)
- Server storage operations (CRUD, upserts, cascading deletes)
