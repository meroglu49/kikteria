import { createDocument } from './google-docs';

const PLAYER_GUIDE = `# Kikteria - Player Guide
Version 7.1

## Welcome to Kikteria!

Kikteria is a fun puzzle game where you place quirky bacteria on a petri dish without letting them touch each other. The bacteria wiggle and vibrate, making placement a delightful challenge!

## How to Play

### Basic Gameplay
1. Bacteria appear in your queue on the right side of the screen
2. Tap or click on the petri dish to place the current bacteria
3. Bacteria vibrate and move slightly - plan your placements carefully!
4. Place all bacteria without any of them touching to win the level
5. If two bacteria touch, it's game over!

### Controls
- Tap/Click: Place the current bacteria at that location
- Bomb Button (left panel): Activate bomb targeting mode, then tap near bacteria to remove them
- Freeze Button: Temporarily stop all bacteria from vibrating
- Lasso Button: Draw a circle to remove bacteria inside it

## Game Modes

### Story Mode (7 Levels)
Progress through 7 increasingly challenging levels:
- Level 1: Tutorial - Learn the basics
- Level 2-3: Getting harder with more bacteria
- Level 4-5: Smaller play area and faster vibrations
- Level 6-7: Master difficulty with rapid bacteria

Each level unlocks story content in the Lab Chronicles!

### Endless Mode
- Survive as long as possible
- Bacteria spawn in waves
- Each wave adds more bacteria
- Compete for the highest wave record

## Items & Upgrades

### Consumable Items
| Item | Effect |
|------|--------|
| Shield | Forgives one collision (bacteria bounce apart instead of game over) |
| 2nd Chance | After game over, removes the last bacteria and lets you continue |
| Freeze | Pauses all bacteria vibration for a few seconds |
| Cleanser | Draw a lasso to remove bacteria inside it |

### Upgrades (Buy in Shop)
| Upgrade | Effect |
|---------|--------|
| Bomb Count | Start with more tactical bombs |
| Figure Size | Bacteria start smaller (easier to fit) |
| Queue Size | See more upcoming bacteria |
| Time Bonus | More time per bacteria placed |
| Placement Bonus | Earn more coins per placement |
| Slow-Mo | Bacteria vibrate more slowly |
| Coin Boost | Bonus coins multiplier |
| Lucky | Higher chance for rare bacteria (worth more coins!) |

## The Bacteria Cast

Meet the 10 unique bacteria characters:

| Name | Personality | Rarity |
|------|-------------|--------|
| Blobby | Friendly blob, loves everyone | Common |
| Grumpus | Grouchy but secretly caring | Common |
| Wobbly | Anxious wobbler, always worried | Common |
| Cyclops | One-eyed observer, very perceptive | Common |
| Squish | Squishy and stretchy | Rare |
| Chompy | Always hungry, big appetite | Rare |
| Derp | Confused but happy | Rare |
| Ghosty | Shy and translucent | Epic |
| Spiky | Prickly exterior, soft inside | Epic |
| Gloop | Oozy and mysterious | Epic |

Learn more about each bacteria in the Codex!

## Earning Coins

- Complete levels to earn coins based on your score
- Place bacteria quickly for combo bonuses
- Rare bacteria are worth more coins
- Complete Daily Lab Orders for bonus rewards
- Contribute to Weekly Community Goals
- Unlock Achievements for coin rewards

## Tips for Success

1. Start from the edges and work inward
2. Leave space for vibration - bacteria wiggle!
3. Use bombs strategically on crowded areas
4. Save your Shield for tricky situations
5. Watch the timer - frozen bacteria don't count down!
6. Study each bacteria's vibration pattern in the Codex

## Achievements

Unlock badges by reaching milestones:
- First Contact: Place your first bacteria
- Lab Technician: Place 100 bacteria
- Master Containment: Complete all 7 levels
- Survivor: Reach wave 10 in Endless Mode
- And many more!

Visit the Achievement Board to see your progress and claim rewards!

## Daily Lab Orders

Every day, receive a special order with requirements like:
- Place a specific number of bacteria
- Complete certain levels
- Use specific items

Complete daily orders for bonus coins!

## Community Goals

Work together with all players to reach weekly targets. When the community goal is reached, everyone earns bonus rewards!

## Need Help?

- Check the Lab Chronicles for story and hints
- Visit the Codex to learn about bacteria
- Practice in earlier levels to master placement
- The K.I.K. AI provides real-time tips during gameplay

Good luck, and happy bacteria placing!
`;

const API_REFERENCE = `# Kikteria - API Reference
Version 7.1

## Overview

Kikteria uses a RESTful API built with Express.js. All endpoints require authentication unless noted otherwise.

## Authentication

Authentication is handled via Google OAuth through Replit's auth integration.

### Endpoints

#### GET /api/auth/user
Returns the currently authenticated user.

Response:
{
  "id": "string",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "profileImageUrl": "string | null",
  "createdAt": "ISO date string",
  "updatedAt": "ISO date string"
}

#### GET /api/login
Redirects to Google OAuth login flow.

#### GET /api/logout
Logs out the current user and redirects to home.

---

## Player Profile

### GET /api/profile
Returns the player's profile with coins, scores, and upgrades.

Response:
{
  "id": "string",
  "userId": "string",
  "coins": number,
  "highScore": number,
  "speedUpgrade": number,
  "startSizeUpgrade": number,
  "magnetUpgrade": number,
  "updatedAt": "ISO date string"
}

### PATCH /api/profile
Updates the player's profile.

Request Body:
{
  "coins": number (optional),
  "highScore": number (optional),
  "speedUpgrade": number (optional),
  "startSizeUpgrade": number (optional),
  "magnetUpgrade": number (optional)
}

---

## Leaderboard

### GET /api/leaderboard
Returns the top scores.

Query Parameters:
- limit: number (default: 10, max: 100)

Response:
[
  {
    "id": "string",
    "userId": "string",
    "username": "string",
    "score": number,
    "createdAt": "ISO date string"
  }
]

### POST /api/leaderboard
Submits a new score.

Request Body:
{
  "score": number
}

---

## Level Progress

### GET /api/levels/progress
Returns the user's progress for all levels.

Response:
[
  {
    "id": "string",
    "userId": "string",
    "levelNumber": number,
    "bestScore": number,
    "isCompleted": number (0 or 1)
  }
]

### POST /api/levels/progress
Updates progress for a specific level.

Request Body:
{
  "levelNumber": number,
  "score": number,
  "completed": boolean
}

---

## Daily Lab Orders

### GET /api/daily-order
Returns today's daily order.

Response:
{
  "id": "string",
  "orderDate": "YYYY-MM-DD",
  "description": "string",
  "requirement": number,
  "rewardCoins": number,
  "completedBy": ["userId1", "userId2"]
}

### POST /api/daily-order/complete
Marks the daily order as completed for the current user.

Response:
{
  "success": true,
  "coinsAwarded": number
}

---

## Community Goals

### GET /api/community-goal
Returns the current weekly community goal.

Response:
{
  "id": "string",
  "weekStart": "YYYY-MM-DD",
  "description": "string",
  "targetAmount": number,
  "currentAmount": number,
  "rewardCoins": number,
  "isCompleted": boolean
}

### POST /api/community-goal/contribute
Contributes to the community goal.

Request Body:
{
  "amount": number
}

---

## Achievements

### GET /api/achievements
Returns all available achievements.

Response:
[
  {
    "id": "string",
    "name": "string",
    "description": "string",
    "category": "mastery" | "collection" | "challenge" | "social",
    "tier": 1 | 2 | 3,
    "requirement": number,
    "coinReward": number,
    "badgeIcon": "emoji string"
  }
]

### GET /api/achievements/progress
Returns the current user's achievement progress.

Response:
[
  {
    "id": "string",
    "achievementId": "string",
    "userId": "string",
    "progress": number,
    "isUnlocked": 0 | 1,
    "isClaimed": 0 | 1,
    "unlockedAt": "ISO date string | null"
  }
]

### POST /api/achievements/progress
Updates progress for a specific achievement.

Request Body:
{
  "achievementId": "string",
  "progress": number
}

Response includes newlyUnlocked flag if achievement was just unlocked.

### POST /api/achievements/claim
Claims the coin reward for an unlocked achievement.

Request Body:
{
  "achievementId": "string"
}

---

## Analytics

### POST /api/analytics
Submits user behavior analytics (metadata).

Request Body:
{
  "events": [
    {
      "eventType": "level_play" | "level_success" | "level_fail" | "session_start" | "session_end",
      "levelNumber": number (optional),
      "score": number (optional),
      "playDuration": number (optional),
      "eventDate": "YYYY-MM-DD",
      "eventTime": "HH:MM:SS",
      "sessionId": "string",
      "deviceInfo": "string"
    }
  ]
}

---

## Error Logging

### POST /api/errors
Submits error logs for debugging.

Request Body:
{
  "errors": [
    {
      "severity": "error" | "warn" | "info",
      "category": "runtime" | "api" | "sync" | "game" | "asset",
      "message": "string",
      "stack": "string (optional)",
      "component": "string (optional)",
      "currentScreen": "string (optional)",
      "gameState": "string (optional)",
      "sessionId": "string",
      "deviceInfo": "string",
      "networkStatus": "online" | "offline",
      "eventTime": "ISO date string"
    }
  ]
}

---

## Version & Updates

### GET /api/version
Returns the current version policy.

Response:
{
  "latestVersion": "string (semver)",
  "minSupportedVersion": "string (semver)",
  "downloadUrl": "string",
  "releaseNotes": "string | null"
}

---

## Admin Endpoints

All admin endpoints require the user to be in the ADMIN_USER_IDS list.

### GET /api/admin/stats
Returns dashboard statistics.

### GET /api/admin/users
Returns all users with pagination.

### GET /api/admin/profiles
Returns all player profiles.

### GET /api/admin/analytics
Returns analytics data.

### GET /api/admin/errors
Returns error logs.

### DELETE /api/admin/user/:userId
Deletes a user and their associated data.

### PUT /api/admin/update-policy
Updates the version policy.

### POST /api/admin/seed-achievements
Seeds the achievements table with default values.

---

## Error Responses

All endpoints may return error responses:

{
  "error": "Error message description"
}

Common HTTP Status Codes:
- 200: Success
- 304: Not Modified (cached)
- 400: Bad Request (validation error)
- 401: Unauthorized
- 403: Forbidden (not admin)
- 404: Not Found
- 500: Internal Server Error

---

## Database Schema

### Tables

- users: User accounts from OAuth
- playerProfiles: Game progress (coins, upgrades, high scores)
- leaderboard: High score entries
- levelProgress: Per-level completion status
- userAnalytics: Behavior tracking events
- errorLogs: Error reports
- appUpdatePolicy: Version management
- dailyOrders: Daily challenge definitions
- weeklyGoals: Community goal tracking
- weeklyContributions: Per-user weekly contributions
- achievements: Achievement definitions
- achievementProgress: Per-user achievement status

### Indexes

Optimized indexes exist for:
- leaderboard (score DESC, createdAt DESC)
- levelProgress (userId, levelNumber unique)
- weeklyContributions (goalId, unique per user)
- achievementProgress (unique per userId + achievementId)
`;

const GAME_DESIGN_DOCUMENT = `# Kikteria - Game Design Document
Version 7.1

## Game Overview

### Concept
Kikteria is a puzzle game where players strategically place vibrating bacteria on a petri dish. The challenge comes from the bacteria's constant movement - players must account for vibration patterns when placing each piece.

### Target Audience
- Casual puzzle game enthusiasts
- All ages (family-friendly)
- Mobile-first, desktop-compatible

### Core Loop
1. Receive bacteria in queue
2. Plan placement considering vibration
3. Tap to place
4. Earn coins and progress
5. Unlock upgrades and achievements
6. Repeat

---

## Game Mechanics

### Bacteria Placement

#### Collision Detection
- Uses canvas-based hit testing
- Accounts for vibration envelope (max displacement)
- 5px collision padding for safety margin
- Hysteresis system prevents false positives (requires 3 consecutive collision frames)
- Clean frame counter resets collision state after 5 clean frames

#### Vibration Patterns
| Pattern | Description | Envelope Calculation |
|---------|-------------|---------------------|
| Horizontal | Side-to-side movement | amplitude |
| Vertical | Up-down movement | amplitude |
| Circular | Rotational orbit | amplitude |
| Pulse | Grow/shrink in place | baseRadius * 0.1 |
| Diagonal | 45-degree oscillation | amplitude * 0.7 * sqrt(2) |

### Figure System

#### Base Configuration
- FIGURE_BASE_SIZE: 35 pixels
- COLLISION_PADDING: 5 pixels
- QUEUE_SIZE: 3 bacteria visible

#### Bacteria Templates
Each bacteria has:
- Unique visual shape composition
- Vibration pattern type
- Vibration speed (cycles/second)
- Vibration amplitude (pixels)
- Base scale multiplier
- Rarity tier (common/rare/epic)
- Coin value

### Rarity Distribution
| Rarity | Spawn Weight | Coin Multiplier |
|--------|--------------|-----------------|
| Common | 70% | 1x |
| Rare | 25% | 1.5x |
| Epic | 5% | 3x |

Lucky upgrade increases rare/epic spawn rates.

---

## Level Design

### Level Structure
| Level | Bacteria Count | Time (sec) | Area Shrink | Speed Multi |
|-------|---------------|------------|-------------|-------------|
| 1 | 8 | 60 | 0% | 1.0x |
| 2 | 10 | 55 | 5% | 1.1x |
| 3 | 12 | 50 | 10% | 1.2x |
| 4 | 14 | 45 | 15% | 1.3x |
| 5 | 16 | 40 | 20% | 1.4x |
| 6 | 18 | 35 | 25% | 1.5x |
| 7 | 20 | 30 | 30% | 1.6x |

### Endless Mode
- Starts with wave 1 (5 bacteria)
- Each wave adds 2 more bacteria
- Speed increases 5% per wave
- No time limit
- Continues until collision

---

## Economy Design

### Coin Sources
| Source | Amount |
|--------|--------|
| Level completion | Score = bacteria placed * 10 |
| Rare bacteria bonus | +50% coin value |
| Epic bacteria bonus | +200% coin value |
| Daily order | 50-200 coins |
| Achievement unlock | 10-1000 coins |
| Community goal | Shared bonus |

### Upgrade Costs (Coins)
| Upgrade | Level 1 | Level 2 | Level 3 | Level 4 | Level 5 | Max |
|---------|---------|---------|---------|---------|---------|-----|
| Bomb Count | 100 | 200 | 400 | 800 | 1600 | 5 |
| Figure Size | 150 | 300 | 600 | 1200 | - | 4 |
| Queue Size | 200 | 400 | 800 | - | - | 3 |
| Time Bonus | 100 | 200 | 400 | 800 | - | 4 |
| Placement Bonus | 150 | 300 | 600 | 1200 | - | 4 |
| Slow-Mo | 200 | 400 | 800 | 1600 | - | 4 |
| Shield | 300 | 600 | 1200 | - | - | 3 |
| Coin Boost | 250 | 500 | 1000 | - | - | 3 |
| Lucky | 200 | 400 | 800 | - | - | 3 |
| 2nd Chance | 500 | 1000 | - | - | - | 2 |

### Consumable Items
| Item | Cost | Effect |
|------|------|--------|
| Shield Charge | 300 | Forgives 1 collision |
| 2nd Chance | 500 | Resume after game over |
| Freeze | 200 | 5 second vibration pause |
| Cleanser | 250 | Lasso removal tool |

---

## Progression Systems

### Level Unlocks
- Level 1: Always available
- Levels 2-7: Unlock by completing previous level
- Completion persists across sessions

### Achievement Categories

#### Mastery (Placement Milestones)
- First Contact: 1 placement (Tier 1, 10 coins)
- Lab Technician: 100 placements (Tier 1, 50 coins)
- Senior Researcher: 500 placements (Tier 2, 150 coins)
- Chief Scientist: 2000 placements (Tier 3, 500 coins)

#### Collection (Coin Milestones)
- Coin Collector: 1,000 coins (Tier 1, 100 coins)
- Treasure Hunter: 5,000 coins (Tier 2, 300 coins)
- Wealthy Scientist: 20,000 coins (Tier 3, 1000 coins)

#### Challenge (Level Milestones)
- Getting Started: Complete Level 1 (Tier 1, 25 coins)
- Making Progress: Complete Level 3 (Tier 1, 75 coins)
- Lab Veteran: Complete Level 5 (Tier 2, 200 coins)
- Master Containment: Complete Level 7 (Tier 3, 500 coins)

#### Social (Engagement)
- First Order: Complete 1 daily order (Tier 1, 50 coins)
- Weekly Regular: Complete 7 daily orders (Tier 2, 200 coins)
- Dedicated Scientist: Complete 30 daily orders (Tier 3, 500 coins)

### Achievement Tiers
| Tier | Badge Style | Typical Reward |
|------|-------------|----------------|
| Bronze (1) | Amber colors | 10-100 coins |
| Silver (2) | Gray/silver colors | 100-300 coins |
| Gold (3) | Yellow/gold colors | 300-1000 coins |

---

## Engagement Features

### Daily Lab Orders
- Refreshes daily at midnight UTC
- Random requirements from pool
- Must be claimed within 24 hours
- Example: "Place 50 bacteria today"

### Weekly Community Goals
- Shared target across all players
- Progress from all player placements
- 7-day duration
- Bonus coins when goal reached

### K.I.K. Announcer
Context-aware commentary system providing:
- Placement feedback ("Nice spot!")
- Progress milestones ("Halfway there!")
- Time warnings ("Running low on time!")
- Item usage reactions
- Game outcome messages

---

## Technical Specifications

### Rendering
- Canvas 2D API at 60fps
- Vibration calculated per-frame
- Shapes composited from primitives
- Particle effects for explosions/confetti

### State Management
- Zustand for client state
- React Query for server state
- LocalStorage for offline persistence
- Automatic sync when online

### Performance Targets
- 60fps gameplay
- <100ms input latency
- <2s initial load
- Offline-first architecture

---

## Future Considerations

### Potential Features
- Multiplayer competitive mode
- Custom bacteria creator
- Level editor
- Seasonal events
- Battle pass progression
- Social sharing

### Balancing Notes
- Monitor average session length
- Track level completion rates
- Analyze economy inflation
- Adjust spawn rates based on data
`;

const ENTERPRISE_ADMIN_GUIDE = `# Kikteria - Enterprise Admin Guide
Version 7.1

## System Architecture Overview

This document provides enterprise administrators with comprehensive information about the Kikteria system architecture, deployment configuration, and administrative operations.

---

## Architecture Diagram

\`\`\`
┌─────────────────────────────────────────────────────────────────────────────┐
│                           KIKTERIA SYSTEM ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────────┐   │
│  │   Browser    │    │   Browser    │    │         Browser              │   │
│  │  (Player 1)  │    │  (Player 2)  │    │         (Admin)              │   │
│  └──────┬───────┘    └──────┬───────┘    └──────────────┬───────────────┘   │
│         │                   │                           │                    │
│         └───────────────────┼───────────────────────────┘                    │
│                             │                                                │
│                             ▼                                                │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        FRONTEND (React + Vite)                        │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│  │  │  Game       │  │   Shop      │  │ Leaderboard │  │   Admin     │  │   │
│  │  │  Engine     │  │   System    │  │   Display   │  │   Panel     │  │   │
│  │  │  (Canvas)   │  │             │  │             │  │  (/admin)   │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │   │
│  │                                                                       │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │   │
│  │  │              STATE MANAGEMENT (Zustand + React Query)           │ │   │
│  │  │  • Game State    • Offline Storage    • Sync Queue              │ │   │
│  │  └─────────────────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                             │                                                │
│                             │ HTTP/REST                                      │
│                             ▼                                                │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    BACKEND (Express.js + Node.js)                     │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│  │  │   Auth      │  │   Game      │  │   Admin     │  │  Analytics  │  │   │
│  │  │   Routes    │  │   Routes    │  │   Routes    │  │   Routes    │  │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  │   │
│  │         └─────────────────┼───────────────┼─────────────────┘         │   │
│  │                           ▼               ▼                           │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │   │
│  │  │                   STORAGE LAYER (Drizzle ORM)                   │ │   │
│  │  └─────────────────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                             │                                                │
│                             ▼                                                │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    DATABASE (PostgreSQL - Neon)                       │   │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐             │   │
│  │  │   users   │ │  profiles │ │ leaderbd  │ │ analytics │             │   │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘             │   │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐             │   │
│  │  │ levelProg │ │dailyOrder │ │ weekGoals │ │ achievmnt │             │   │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘             │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────┐    ┌─────────────────────────────────────────┐ │
│  │  EXTERNAL INTEGRATIONS  │    │           REPLIT PLATFORM               │ │
│  │  ┌─────────────────┐    │    │  ┌─────────────┐  ┌─────────────────┐   │ │
│  │  │  Google OAuth   │    │    │  │  Auth Svc   │  │   Deployment    │   │ │
│  │  │  (Sign-In)      │    │    │  │  (Replit)   │  │   (Auto-scale)  │   │ │
│  │  └─────────────────┘    │    │  └─────────────┘  └─────────────────┘   │ │
│  │  ┌─────────────────┐    │    │  ┌─────────────┐  ┌─────────────────┐   │ │
│  │  │  Google Docs    │    │    │  │  Secrets    │  │   Checkpoints   │   │ │
│  │  │  (Docs Gen)     │    │    │  │  Manager    │  │   (Rollback)    │   │ │
│  │  └─────────────────┘    │    │  └─────────────┘  └─────────────────┘   │ │
│  └─────────────────────────┘    └─────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
\`\`\`

---

## Database Schema

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| users | OAuth user accounts | id, email, name, profileImageUrl |
| playerProfiles | Player progress & economy | userId, coins, highScore, upgradelevels |
| leaderboard | Global rankings | id, username, score, timestamp |
| levelProgress | Per-level completion | userId, levelNumber, completed, stars |

### Engagement Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| dailyOrders | Daily challenge definitions | id, requirement, rewardCoins, date |
| weeklyGoals | Community goal tracking | id, targetAmount, currentProgress, endDate |
| weeklyContributions | Per-user contributions | goalId, visitorId, amount |
| achievements | Achievement definitions | id, name, requirement, coinReward |
| achievementProgress | Per-user achievement status | userId, achievementId, progress, isUnlocked |

### System Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| userAnalytics | Behavior tracking | userId, eventType, eventData, timestamp |
| errorLogs | Client error reports | id, errorMessage, stackTrace, timestamp |
| appUpdatePolicy | Version management | id, minVersion, currentVersion |

---

## Admin Panel Access

### Location
Access the admin panel at: \`/admin\`

### Authorization
Admin access is controlled by a whitelist of user IDs:
\`\`\`javascript
const ADMIN_USER_IDS = ['51476893'];
\`\`\`

To add new administrators, edit \`client/src/pages/Admin.tsx\` and add user IDs to this array.

### Admin Capabilities

#### User Management
- View all registered users
- View player profiles and statistics
- Monitor user activity

#### Analytics Dashboard
- Active user counts (DAU/MAU)
- Session duration metrics
- Level completion rates
- Economy flow analysis

#### Content Management
- Create/edit daily orders
- Set weekly community goals
- Manage achievement definitions
- Update app version policy

#### System Operations
- View error logs
- Clear cached data
- Force leaderboard refresh
- Trigger documentation regeneration

---

## API Endpoints Reference

### Authentication Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/auth/user | Get current authenticated user |
| GET | /api/login | Initiate Google OAuth flow |
| GET | /api/logout | End user session |

### Player Data Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/profile | Get player profile |
| PATCH | /api/profile | Update player profile |
| GET | /api/leaderboard | Get global rankings |
| POST | /api/leaderboard | Submit new score |

### Progress Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/levels/progress | Get level completion status |
| POST | /api/levels/progress | Update level progress |
| GET | /api/achievements/progress | Get achievement progress |
| POST | /api/achievements/progress | Update achievement progress |
| POST | /api/achievements/claim | Claim achievement reward |

### Engagement Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/daily-order | Get current daily order |
| POST | /api/daily-order/complete | Mark daily order complete |
| GET | /api/community-goal | Get weekly community goal |
| POST | /api/community-goal/contribute | Add contribution |

### Admin Endpoints (Requires Admin Auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/users | List all users |
| GET | /api/admin/analytics | Get analytics summary |
| GET | /api/admin/errors | Get error logs |
| POST | /api/admin/daily-order | Create daily order |
| POST | /api/admin/weekly-goal | Create weekly goal |
| DELETE | /api/admin/leaderboard/:id | Remove leaderboard entry |

---

## Security Configuration

### Authentication Flow
1. User clicks "Sign In with Google"
2. Redirect to Replit OAuth endpoint
3. User authenticates with Google
4. Callback with session token
5. Session stored in secure HTTP-only cookie

### Session Management
- Sessions stored server-side
- 7-day expiration
- Automatic refresh on activity
- Secure cookie flags in production

### Rate Limiting
- 100 requests/minute per IP
- 1000 requests/hour per authenticated user
- Stricter limits on write operations

### Data Protection
- All sensitive data encrypted at rest
- HTTPS enforced in production
- No secrets in client-side code
- Environment variables for configuration

---

## Deployment Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| DATABASE_URL | PostgreSQL connection string | Yes |
| SESSION_SECRET | Session encryption key | Yes |
| ADMIN_USER_IDS | Comma-separated admin IDs | No |

### Scaling Considerations
- Stateless backend (horizontal scaling)
- Database connection pooling
- CDN for static assets
- Redis for session storage (optional)

### Health Checks
- GET /api/health - Application health
- GET /api/version - Current version

---

## Monitoring & Observability

### Metrics to Track
- Request latency (p50, p95, p99)
- Error rates by endpoint
- Database query times
- Active WebSocket connections

### Log Categories
| Category | Description |
|----------|-------------|
| [auth] | Authentication events |
| [game] | Game state changes |
| [api] | API request/response |
| [error] | Application errors |
| [admin] | Admin operations |

### Alerts Configuration
- Error rate > 5% in 5 minutes
- Response time > 500ms average
- Database connection failures
- Authentication failures spike

---

## Backup & Recovery

### Database Backups
- Automatic daily backups via Neon
- Point-in-time recovery available
- 7-day retention period

### Rollback Procedures
1. Access Replit Checkpoints
2. Select checkpoint before issue
3. Review changes to be reverted
4. Confirm rollback operation

### Data Export
Admin can export:
- User data (GDPR compliance)
- Analytics reports
- Error log summaries

---

## Testing Infrastructure

### Test Suite
Run tests with: \`npx vitest run\`

| Test Category | Count | Location |
|---------------|-------|----------|
| Game Constants | 33 | client/src/lib/__tests__/game-constants.test.ts |
| Offline Storage | 39 | client/src/lib/__tests__/offline-storage.test.ts |
| Game Store | 33 | client/src/lib/__tests__/store.test.ts |
| Upgrades | 15 | client/src/lib/__tests__/upgrades.test.ts |
| Endless Mode | 18 | client/src/lib/__tests__/endless-mode.test.ts |
| Achievements | 22 | client/src/lib/__tests__/achievements.test.ts |
| Bomb Mechanics | 15 | client/src/lib/__tests__/bomb-mechanics.test.ts |
| Storage Layer | 15 | server/__tests__/storage.test.ts |
| **Total** | **190** | |

### CI/CD Pipeline
- Tests run on every commit
- Build validation before deploy
- Automatic staging deployment
- Manual production promotion

---

## Support & Escalation

### Issue Tiers

| Tier | Response Time | Examples |
|------|---------------|----------|
| P1 - Critical | < 1 hour | Service down, data loss |
| P2 - High | < 4 hours | Major feature broken |
| P3 - Medium | < 24 hours | Minor bugs, UI issues |
| P4 - Low | < 1 week | Feature requests, improvements |

### Contact Points
- Technical Issues: Check error logs first
- Database Issues: Neon dashboard
- Authentication Issues: Replit integrations
- Billing Issues: Replit support

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 7.1 | Dec 2024 | Shield fix, 2nd Chance endless fix, achievement celebrations |
| 7.0 | Dec 2024 | Achievement system, daily orders, community goals |
| 6.0 | Nov 2024 | Endless mode, upgrades system |
| 5.0 | Nov 2024 | Leaderboard, offline sync |
| 1.0 | Oct 2024 | Initial release |

---

## Quick Reference Commands

\`\`\`bash
# Run development server
npm run dev

# Run tests
npx vitest run

# Generate documentation
npx tsx scripts/generate-docs-script.ts

# Database migrations
npx drizzle-kit push

# View logs
# Check Replit workflow logs
\`\`\`

---

Document generated automatically. For updates, run the documentation generator script.
`;

export async function generateEnterpriseAdminDoc(): Promise<string> {
  console.log('[docs] Generating Enterprise Admin Guide...');
  const result = await createDocument('Kikteria - Enterprise Admin Guide v8', ENTERPRISE_ADMIN_GUIDE);
  console.log('[docs] Enterprise Admin Guide created:', result.url);
  return result.url;
}

export async function generateAllDocumentation(): Promise<{ playerGuide: string; apiReference: string; gdd: string; enterpriseAdmin?: string }> {
  console.log('[docs] Generating Player Guide...');
  const playerGuide = await createDocument('Kikteria - Player Guide v8', PLAYER_GUIDE);
  console.log('[docs] Player Guide created:', playerGuide.url);
  
  console.log('[docs] Generating API Reference...');
  const apiReference = await createDocument('Kikteria - API Reference v8', API_REFERENCE);
  console.log('[docs] API Reference created:', apiReference.url);
  
  console.log('[docs] Generating Game Design Document...');
  const gdd = await createDocument('Kikteria - Game Design Document v8', GAME_DESIGN_DOCUMENT);
  console.log('[docs] GDD created:', gdd.url);
  
  return {
    playerGuide: playerGuide.url,
    apiReference: apiReference.url,
    gdd: gdd.url,
  };
}
