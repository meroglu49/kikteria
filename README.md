# Kikteria - Bacteria Placement Game

## Overview

Kikteria is a bright, colorful puzzle game where players place funny-looking bacteria figures on a canvas without letting them touch. Built with React frontend and Express backend, featuring vibrating creatures with expressive faces. Current version: v10. Deployed version: d1.0.1.

**Core Features:**
- 100-level progressive difficulty campaign + Endless Mode
- Google Sign-In authentication via Replit integration
- Shop system with 10 upgrades + 4 consumable items
- Achievement system with celebration pop-ups and confetti
- Daily Lab Orders + Weekly Community Goals
- Global leaderboard
- Offline-first with automatic sync
- Progressive Web App (PWA) for mobile install
- Interactive tutorial for first-time players on level 1
- Admin panel at `/admin`

## PWA Support

The game is installable on mobile devices:
- **manifest.json**: App configuration for install prompts
- **sw.js**: Service worker for offline caching
- **Icons**: SVG icons at 192x192 and 512x512
- Users can "Add to Home Screen" on Android/iOS for app-like experience

## User Preferences

- **Communication style**: Simple, everyday language
- **Do NOT request user feedback** without asking permission first
- **Do NOT take screenshots** - user prefers faster execution
- **Work silently**: No explanations unless asked, just execute
- **Skip architect reviews** for small changes (< 20 lines)
- **Trust decisions**: Make technical choices without asking, minimize clarifying questions
- **Batch operations**: Combine related changes, use parallel tool calls
- **Direct file access**: When user provides file paths, use them directly without searching

## Key Files & Architecture

### Frontend (client/)
| File | Purpose |
|------|---------|
| `src/App.tsx` | Main app component, game state routing, win/lose screens |
| `src/lib/store.ts` | Zustand store - all game state, upgrades, figures, timers |
| `src/lib/game-constants.ts` | Bacteria templates, level configs, game config values |
| `src/lib/api.ts` | React Query hooks for all API calls |
| `src/lib/engagement-service.ts` | Achievement tracking, community contributions, celebrations |
| `src/lib/offline-storage.ts` | LocalStorage persistence, pending sync queue |
| `src/components/game/GameEngine.tsx` | Canvas rendering, collision detection, 60fps loop |
| `src/components/game/HUD.tsx` | In-game UI (score, timer, bombs, consumables) |
| `src/components/game/Shop.tsx` | Upgrade purchase interface |
| `src/components/game/AchievementCelebration.tsx` | Achievement unlock modal with confetti |
| `src/hooks/use-auth.ts` | Authentication hook, syncs auth to engagement service |

### Backend (server/)
| File | Purpose |
|------|---------|
| `routes.ts` | All API endpoints (~730 lines) |
| `storage.ts` | IStorage interface + Drizzle implementations |
| `google-docs.ts` | Google Docs API client for documentation generation |
| `generate-docs.ts` | Documentation content and generation logic |
| `replit_integrations/auth.ts` | Google OAuth via Replit |

### Shared (shared/)
| File | Purpose |
|------|---------|
| `schema.ts` | Drizzle ORM schema, Zod validators, types |
| `models/auth.ts` | User type definitions |

## Database Tables

- `users` - OAuth user accounts
- `playerProfiles` - Coins, high scores, upgrade levels
- `leaderboard` - High score entries
- `levelProgress` - Per-user level completion (unique on userId+levelNumber)
- `userAnalytics` - Behavior tracking events
- `errorLogs` - Client error reports
- `appUpdatePolicy` - Version management
- `dailyOrders` - Daily challenge definitions
- `weeklyGoals` - Community goal tracking
- `weeklyContributions` - Per-user weekly contributions (unique on goalId+visitorId)
- `achievements` - Achievement definitions
- `achievementProgress` - Per-user achievement status (unique on visitorId+achievementId)

## API Endpoints Summary

**Auth**: GET `/api/auth/user`, `/api/login`, `/api/logout`
**Profile**: GET/PATCH `/api/profile`
**Leaderboard**: GET/POST `/api/leaderboard`
**Levels**: GET/POST `/api/levels/progress`
**Daily Orders**: GET `/api/daily-order`, POST `/api/daily-order/complete`
**Community**: GET `/api/community-goal`, POST `/api/community-goal/contribute`
**Achievements**: GET `/api/achievements`, GET/POST `/api/achievements/progress`, POST `/api/achievements/claim`
**Admin**: Various at `/api/admin/*` (requires ADMIN_USER_IDS)
**Analytics/Errors**: POST `/api/analytics`, POST `/api/errors`
**Version**: GET `/api/version`

## Game Mechanics

### Collision System
- Canvas hit testing with 5px collision padding
- Hysteresis: requires 3 consecutive collision frames before game over
- Clean frame counter resets after 5 clean frames
- Accounts for vibration envelope (max displacement)

### Vibration Patterns
Horizontal, Vertical, Circular, Pulse, Diagonal - each with different envelope calculations

### Consumables
- **Shield**: Forgives 1 collision, requires ≥1 charge
- **2nd Chance**: After game over, removes last figure and resumes (works in Endless Mode via isEndlessMode flag)
- **Freeze**: Pauses vibrations temporarily
- **Cleanser**: Lasso tool to remove bacteria

### Economy
- Coins earned from level completion, rare bacteria bonuses, achievements, daily orders
- 10 upgrade types with escalating costs
- Achievement tiers: Bronze (1), Silver (2), Gold (3)

## Integrations

- **Google OAuth**: Replit auth integration (javascript_replit_auth)
- **Google Docs**: For documentation generation (google-docs connection)
- **PostgreSQL**: Replit database integration

## Scripts

- `npx tsx scripts/generate-docs-script.ts` - Regenerate Google Docs documentation
- `npx vitest run` - Run all unit tests (190 tests)
- `npx vitest` - Run tests in watch mode

## Testing

Test files are located in `__tests__` directories:
- `client/src/lib/__tests__/game-constants.test.ts` - Vibration envelope, effective radius, level configs, bacteria templates
- `client/src/lib/__tests__/offline-storage.test.ts` - Level progress, player stats, pending sync, session management
- `client/src/lib/__tests__/store.test.ts` - Game state, notifications, level selection, endless mode, consumables
- `client/src/lib/__tests__/upgrades.test.ts` - Upgrade costs, max levels, purchase validation, skill consumables
- `client/src/lib/__tests__/endless-mode.test.ts` - Endless mode init, wave advancement, scoring, timer
- `client/src/lib/__tests__/achievements.test.ts` - Achievement definitions, categories, tiers, tracking keys
- `client/src/lib/__tests__/bomb-mechanics.test.ts` - Bomb targeting, detonation, blast radius, figure clearing
- `server/__tests__/storage.test.ts` - Player profiles, leaderboard, level progress, admin methods

Config: `vitest.config.ts` with path aliases for `@` and `@shared`

## Recent Fixes (v7.1)

1. **Shield fix**: Now works with ≥1 shield instead of ≥2
2. **2nd Chance Endless fix**: Uses isEndlessMode flag for proper detection, removes last figure instead of resetting
3. **Achievement celebrations**: Pop-up modal with confetti, tier-based styling, user-scoped cache to prevent duplicates
4. **Performance**: Throttled localStorage writes (1s max), immediate saves for high-value events
5. **Database indexes**: Composite unique indexes on leaderboard, levelProgress, weeklyContributions, achievementProgress

## Admin Access

Admin user IDs defined in `client/src/pages/Admin.tsx`:
```
const ADMIN_USER_IDS = ['51476893'];
```

## Documentation Links

- Player Guide: https://docs.google.com/document/d/1SRGokjha2vVbsrMyPYIC7lo_DlDtTGO1JZ8orDzWnKo/edit
- API Reference: https://docs.google.com/document/d/1nlxhU51lUT8XuUtMOFKzwLP71Up4eg8PTBFGt5ewSzY/edit
- Game Design Document: https://docs.google.com/document/d/1YufprTw_neSmfl_ly-82IfLDIzFgOb8bhbt_SOt3BgY/edit
- Enterprise Admin Guide: https://docs.google.com/document/d/1eKgolSnrcaiNIDjey_8unmdGsYuRu44eBHup7d17Ggg/edit
