# Kikteria - Bacteria Placement Game

## Version

**Current Version: v0.5** (December 17, 2025)

### v0.5 Features (New)
- Unique synthesized sound effects for each bacteria type (Web Audio API)
- Retro Bomberman-style bomb explosion sound
- 8-bit victory fanfare with sparkle effects for level completion
- Sad but funny "wah wah" game over sound with slide whistle
- Quick START button on home screen to begin the last unlocked level
- GitHub integration for version control and backups

### v0.4 Features
- Collision highlighting system with red pulsing for 800ms before game over
- "LEFT" counter showing remaining figures to place
- Win condition triggers when all required figures are placed
- Celebration confetti animation for 2.5 seconds before WIN screen

### v0.3 Features
- 7-level progression system with increasing difficulty
- Level selection screen showing unlocked levels and best scores
- Level progress persistence (saves completion status and best scores)
- Level-based parameters: figure count, vibration speed, size multiplier, start time, time bonus
- Dynamic shrinking play area on higher levels as timer counts down
- Win screen with next level/replay options
- Game over screen with retry level option

### v0.2 Features
- 15-second timer with +1 second bonus per figure placed
- Water drop ripple animation on figure placement (green for bacteria)
- Dramatic explosion animation for bombs (flash, shockwaves, particles)
- Bombs can now be placed anywhere, including on top of other figures
- 150-pixel blast radius for bomb explosions

### v0.1 Features
- Collision detection (bacteria touching each other)
- Boundary detection (bacteria touching play area edges)
- 10 unique bacteria figures with expressive faces
- Bright, colorful UI with sidebar layout
- Bomb power-ups to clear figures
- User authentication and profiles
- Upgrade shop system
- Global leaderboard

## Overview

Kikteria is a bright, colorful puzzle game where players place funny-looking bacteria figures on a canvas without letting them touch. Built with a React frontend and Express backend, featuring vibrating creatures with expressive faces.

The game includes user authentication, player profiles with persistent progress, an upgrade shop system, and a global leaderboard.

## Game Mechanics

### Core Gameplay
- **Click to Place**: Figures appear at the bottom of the screen; click anywhere in the play area to place them
- **15-Second Timer**: Start with 15 seconds, gain +1 second for each figure placed
- **Vibrating Bacteria**: Each figure has unique vibration patterns (horizontal, vertical, circular, pulse, diagonal)
- **Collision Detection**: Game over when any two placed figures touch each other
- **Boundary Detection**: Game over if a figure touches the play area boundary
- **Win Condition**: Successfully place all figures without any collisions before time runs out

### Figure Types (10 Unique Characters)
- **Blobby**: Yellow goofy slime with big eyes and silly smile
- **Grumpus**: Green angry square with legs
- **Wobbly**: Blue teardrop with worried expression
- **Cyclops**: Purple one-eyed monster with horns and toothy grin
- **Squish**: Pink squishy blob with cat-like features
- **Chompy**: Orange monster with huge teeth
- **Derp**: Brown potato-shaped creature with misaligned eyes
- **Ghosty**: White spooky ghost with big dark eyes
- **Spiky**: Red spiky ball with angry face
- **Gloop**: Green toxic slime with sleepy expression

### Special Items
- **Bomb**: Click to clear nearby figures from the board
- **Bomb Button**: Use stored bombs to remove the last placed figure

### Upgrades (Shop)
- **Bombs+**: Start with more bombs
- **Shrink**: Smaller bacteria size (easier placement)
- **Preview+**: See more upcoming figures in queue

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, bundled via Vite
- **State Management**: Zustand for game state (`client/src/lib/store.ts`)
- **Game Engine**: Canvas API with 60fps render loop, per-frame collision detection
- **Data Fetching**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS v4 with bright colorful theme
- **Animations**: Framer Motion for menu transitions, Canvas API for figure vibrations

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Authentication**: Passport.js with local strategy, session-based auth using express-session
- **Password Security**: Scrypt hashing with timing-safe comparison
- **API Pattern**: RESTful endpoints under `/api/` prefix

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` (shared between frontend and backend)
- **Tables**:
  - `users`: Authentication credentials
  - `playerProfiles`: Game progress (coins, high score, upgrades)
  - `leaderboard`: Global score rankings
  - `levelProgress`: Level completion status and best scores per user

### Key Files
- `client/src/lib/game-constants.ts`: Figure templates, vibration patterns, game config
- `client/src/lib/store.ts`: Zustand store for game state (placed figures, queue, bombs, timer)
- `client/src/components/game/GameEngine.tsx`: Canvas rendering, collision detection, boundary checks, placement logic
- `client/src/components/game/HUD.tsx`: In-game UI (timer, score, bomb button)

### Build System
- **Development**: Vite dev server with HMR for frontend, tsx for backend
- **Production**: Vite builds static assets, esbuild bundles server with dependency optimization
- **Output**: `dist/public` for frontend, `dist/index.cjs` for server

### Key Design Patterns
- **Shared Types**: Schema definitions in `shared/` directory used by both client and server
- **Storage Interface**: `IStorage` interface in `server/storage.ts` abstracts database operations
- **Path Aliases**: `@/` for client source, `@shared/` for shared code

## External Dependencies

### Database
- PostgreSQL (connection via `DATABASE_URL` environment variable)
- Drizzle ORM for type-safe queries
- Drizzle Kit for schema migrations (`npm run db:push`)

### Authentication
- express-session for session management
- passport and passport-local for authentication strategy
- connect-pg-simple available for PostgreSQL session storage

### Frontend Libraries
- React 18 with React Query
- Framer Motion for animations
- Canvas Confetti for celebratory effects
- Extensive Radix UI component primitives

### Development Tools
- Replit-specific Vite plugins (cartographer, dev-banner, runtime-error-modal)
- Custom meta images plugin for OpenGraph tags
