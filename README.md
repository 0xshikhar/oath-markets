# OATH — The Commitment Market on Solana

<p align="center">
  <strong>"Your word, on-chain."</strong>
</p>

OATH is a public accountability protocol where people stake SOL on their commitments, supporters co-stake on their success, and reputation compounds permanently on-chain.

Prediction markets let you bet on outcomes. OATH lets you stake on what you will *make happen*.

---

## Table of Contents

1. [The Problem & Solution](#the-problem--solution)
2. [How It Works](#how-it-works)
3. [Why Solana](#why-solana)
4. [What's Built](#whats-built)
5. [Tech Stack](#tech-stack)
6. [AI Coach](#ai-coach)
7. [Data Models](#data-models)
8. [Project Structure](#project-structure)
9. [Architecture Diagram](#architecture-diagram)
10. [Getting Started](#getting-started)
11. [Environment Variables](#environment-variables)
12. [Commands](#commands)
13. [Testing Against Local Validator](#testing-against-local-validator)
14. [Key Components](#key-components)
15. [Business Model](#business-model)
16. [Roadmap](#roadmap)
17. [Learn More](#learn-more)

---

## The Problem & Solution

### The Problem

Private goals fail quietly. Quitting is free. Existing accountability tools are:

- **Private** — nobody sees, nobody remembers
- **Low-cost** — no real stakes, easy to abandon
- **Soft** — StickK reports only **29% success rate** without financial stakes + public accountability

### The Solution

OATH turns follow-through into a visible, funded, and witnessed commitment:

| Role | Action |
|------|--------|
| **Maker** | Creates a goal, locks SOL in non-custodial Anchor escrow, posts daily proof |
| **Believer** | Co-stakes SOL on makers they believe in, earns faith-fee yield on success |
| **Reputation** | Compounds on-chain permanently — every completed oath adds to your Oath Score |

The product delivers: **pressure, support, proof, and memory**.

---

## How It Works

The four-step commitment loop:

```
MAKE → STAKE → PROVE → RESOLVE
```

### Step 1 — MAKE YOUR OATH
Set a goal with title, deadline, category, proof type, and daily requirement. Your public oath page is live the moment it's created.

### Step 2 — STAKE SOL
Deposit SOL into a non-custodial Anchor escrow vault. Minimum viable stake: **0.05 SOL** (~8) — low enough to be accessible, real enough to matter.

### Step 3 — DAILY PROOF
Submit text, image, or link as daily proof. Every submission is timestamped on-chain. The proof feed is public and immutable.

### Step 4 — RESOLVE
- **Complete:** 95% of stake returns + share of believer faith fees. Oath Score increments.
- **Fail:** Stake burns or routes to protocol treasury. Oath Score records the incomplete.

### The Believer Layer

Any wallet can co-stake on an active oath:
- **Principal protected** — believers get their stake back regardless of outcome
- **Faith fee yield** — on success, believers earn a proportional share of the faith fee pool
- **Positive expected value** — backers profit from backing high-conviction makers

---

## Why Solana

OATH was built for Solana specifically. This product cannot exist at this UX on other chains:

| Requirement | Ethereum L2 | Solana |
|-------------|-------------|--------|
| Micro-stake transaction cost | $0.50–$2.00 | **< $0.001** |
| Finality for proof confirmation | 12–60 seconds | **< 400ms** |
| Webhook infrastructure | Manual polling | **Helius native** |
| Active funded wallets | ~4M across all L2s | **11.44M** |

On Ethereum, a $5 stake with $2 gas is irrational. On Solana, a 0.05 SOL stake with $0.001 fee is accessible to anyone.

---

## What's Built

### Core Commitment Lifecycle
- ✅ Commitment creation with on-chain Anchor transaction
- ✅ Public commitment pages with proof feed
- ✅ Dashboard with proof submission (text, photo, link)
- ✅ Believer co-staking with on-chain instruction
- ✅ Auto-resolution cron + Helius webhook sync
- ✅ OpenGraph image generation + shareable pages

### Social Features
- ✅ Personalized activity feed from followed accounts
- ✅ Reputation profile with on-chain Oath Score
- ✅ Social graph: follow, proof reactions, comments
- ✅ AI coach with tone selection + timezone-aware daily nudges
- ✅ Activity ticker (live social pulse)
- ✅ Cheer wall (one-tap encouragement)
- ✅ Arena leaderboards (streaks, stakers, hype)
- ✅ Challenge system (P2P accountability)

### Identity & Auth
- ✅ Privy-backed wallet auth with embedded + external wallet support
- ✅ World ID verification for Sybil resistance (integration done)
- ✅ Private commitments with share tokens (partial implementation)

### Infrastructure
- ✅ PWA shell (offline page + install prompt)
- ✅ Dark/light mode, mobile-responsive
- ✅ Devnet deployment (Program ID: `CHyHVL8HzWw3VaZarPUuU2DNf5xJm3CkrrWz6GgYstBJ`)
- ✅ Vercel deployment ready

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, React 19, TypeScript |
| **Styling** | Tailwind CSS v4 |
| **Auth** | Privy |
| **Wallet** | wallet-standard, @solana/kit |
| **Program** | Anchor (Rust) |
| **Database** | PostgreSQL / Prisma |
| **AI Coach** | Claude Haiku 4.5 / Kimi K2.5 on AWS Bedrock |
| **Image Storage** | Cloudinary |
| **Real-time Sync** | Helius webhooks |
| **Deployment** | Vercel |

---

## AI Coach

OATH includes an AI coach that provides context-aware daily nudges and feedback.

### Model
- **Provider:** Kimi K2.5 (Moonshot AI)
- **Platform:** AWS Bedrock
- **Default Model ID:** `moonshotai.kimi-k2.5`

### Coach Tones
| Tone | Description |
|------|-------------|
| `DRILL_SERGEANT` | Strict, demanding, pushes hard |
| `SUPPORTIVE_FRIEND` | Encouraging, understanding, empathetic |
| `NEUTRAL_ANALYST` | Objective, data-driven, balanced |

### Coach Events
The coach responds to these events:
- `OATH_CREATED` — Welcome message + goal encouragement
- `DAILY_CHECKIN` — Reminder to submit proof
- `PROOF_SUBMITTED` — Acknowledge + next-step guidance
- `STREAK_RISK` — Warning when proof is overdue
- `MILESTONE` — Celebration at Day 7, 14, 30, 100
- `COMPLETION` — Congratulation + completion summary
- `FAILURE` — Encouragement for comeback

### Timezone-Aware
The coach sends daily nudges at user-configured times based on their timezone setting.

---

## Data Models

The Prisma schema includes these core models:

### User
```prisma
model User {
  id               String   @id
  walletAddress    String   @unique
  username         String?  @unique
  name             String?
  bio              String?
  avatarUrl        String?
  worldIdVerified  Boolean  @default(false)
  worldIdNullifier String?
  notifyPlatform   Boolean  @default(true)
  notifyTelegram   String?
  notifyEmail      String?
  notifyTime       String   @default("09:00")
  timezone         String   @default("UTC")
}
```

### Commitment
```prisma
model Commitment {
  id                  String             @id
  onchainAddress      String?            @unique
  slug                String             @unique
  title               String
  description         String?
  category            CommitmentCategory
  proofType           ProofType
  coachTone           CoachTone          @default(SUPPORTIVE_FRIEND)
  stakeAmountLamports BigInt
  slashDestination    SlashDest          @default(TREASURY)
  startDate           DateTime
  endDate             DateTime
  totalDays           Int
  requiredProofDays   Int
  status              CommitmentStatus   @default(ACTIVE)
  isPublic            Boolean            @default(true)
  proofCount          Int                @default(0)
  makerId             String
}
```

### Enums
```prisma
enum CommitmentCategory {
  FITNESS, LEARNING, CREATIVE, WORK, HEALTH, FINANCIAL, CUSTOM
}

enum ProofType {
  TEXT, PHOTO, LINK, GITHUB_COMMIT, CUSTOM
}

enum CommitmentStatus {
  ACTIVE, COMPLETED, FAILED, ABANDONED
}

enum CoachTone {
  DRILL_SERGEANT, SUPPORTIVE_FRIEND, NEUTRAL_ANALYST
}

enum ReactionType {
  MOMENTUM, STREAK, WATCHING, DOUBT
}
```

### Supporting Models
- **Proof** — Daily proof submissions with text/image/link
- **Belief** — Believer co-stakes with on-chain tracking
- **Comment** — Threaded comments on commitments
- **Reaction** — Proof reactions (MOMENTUM, STREAK, WATCHING, DOUBT)
- **Follow** — Social graph (follower/following)
- **CoachMessage** — AI coach interaction history
- **Cheer** — One-tap encouragement messages
- **Challenge** — P2P challenge system

---

## Project Structure

```
oath-markets/
├── app/                          # Next.js app router
│   ├── api/                     # API routes
│   │   ├── commitments/          # CRUD for commitments
│   │   ├── proofs/              # Proof submissions
│   │   ├── beliefs/             # Co-staking
│   │   ├── comments/            # Comments
│   │   ├── follows/             # Social graph
│   │   ├── feed/                # Activity feed
│   │   ├── coach/               # AI coach
│   │   ├── upload/proof/        # Image uploads
│   │   ├── webhooks/helius/     # On-chain sync
│   │   ├── cron/                # Scheduled jobs
│   │   │   ├── sync-onchain/   # DB ↔ chain sync
│   │   │   ├── resolve-commitments/  # Auto-resolve
│   │   │   └── daily-coach/     # Timezone-aware nudges
│   │   └── og/[slug]/           # OpenGraph image generation
│   ├── components/              # React components
│   │   ├── ui/                  # Design system (30+ components)
│   │   ├── cheer-wall.tsx       # One-tap cheers
│   │   ├── wallet-button.tsx    # Auth + wallet UI
│   │   └── ...
│   ├── lib/                     # Core logic
│   │   ├── data/                # Data access layer
│   │   ├── coach-ai.ts          # AI coach integration
│   │   ├── coach-tone.ts        # Coach tone config
│   │   ├── solana-client.ts     # Solana RPC client
│   │   ├── oath-program.ts     # Anchor program interface
│   │   ├── privy.ts            # Privy auth config
│   │   ├── cloudinary.ts       # Image upload
│   │   ├── helius-sync.ts      # Webhook processing
│   │   └── wallet/             # Wallet-standard layer
│   ├── create/                  # Commitment creation wizard
│   ├── dashboard/               # Maker dashboard
│   ├── explore/                 # Discovery feed
│   ├── feed/                    # Personalized activity
│   ├── c/[slug]/               # Public commitment page
│   ├── u/[wallet]/             # Reputation profile
│   ├── challenge/[token]/      # Challenge acceptance
│   └── page.tsx                # Landing page
│
├── anchor/                      # Anchor programs
│   └── programs/oath/          # OATH commitment program (Rust)
│
├── prisma/
│   └── schema.prisma           # Database schema
│
├── docs/                       # Documentation
│
└── public/                    # Static assets
```

---

## Architecture Diagram

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                    USERS                                         │
│                                                                                  │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐        │
│   │   Maker     │   │  Believer   │  │ Spectator   │   │   Admin     │        │
│   │  (Creator)  │   │ (Co-staker) │  │  (Viewer)   │   │ (Moderator) │        │
│   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘        │
│          │                 │                 │                 │               │
└──────────┼─────────────────┼─────────────────┼─────────────────┼───────────────┘
           │                 │                 │                 │
           ▼                 ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (Next.js 16)                               │
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────┐    │
│   │                        Next.js App Router                               │    │
│   │                                                                          │    │
│   │   / (Landing)   /explore   /feed   /create   /dashboard                 │    │
│   │   /c/[slug]     /u/[wallet]  /challenge/[token]                          │    │
│   │                                                                          │    │
│   └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────┐    │
│   │                      React Components (UI Layer)                       │    │
│   │   ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐            │    │
│   │   │Commitment  │ │ Activity   │ │  Leader-   │ │  Wallet    │            │    │
│   │   │Card/Surface│ │  Ticker    │ │  board     │ │  Button    │            │    │
│   │   └────────────┘ └────────────┘ └────────────┘ └────────────┘            │    │
│   └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
└──────────────────────────────┬──────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           NEXT.JS API ROUTES                                     │
│                                                                                  │
│   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐          │
│   │/api/commit-  │ │/api/proofs   │ │/api/beliefs  │ │/api/follows  │          │
│   │   ments      │ │              │ │              │ │              │          │
│   └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘          │
│                                                                                  │
│   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐          │
│   │/api/feed     │ │/api/coach    │ │/api/cheers   │ │/api/chal-    │          │
│   │              │ │              │ │              │ │   lenges     │          │
│   └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘          │
│                                                                                  │
│   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐          │
│   │/api/cron/    │ │/api/webhooks │ │/api/og/      │ │/api/upload/  │          │
│   │resolve       │ │/helius       │ │[slug]        │ │proof         │          │
│   └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘          │
│                                                                                  │
└──────────────────────────────┬──────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                          │
│                                                                                  │
│   ┌──────────────────────────────────────────────────────────────────────────┐   │
│   │                      Prisma ORM + PostgreSQL                            │   │
│   │                                                                           │   │
│   │   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │   │
│   │   │  User   │ │Commit-  │ │  Proof  │ │ Belief  │ │Follow   │          │   │
│   │   │         │ │  ment   │ │         │ │         │ │         │          │   │
│   │   └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘          │   │
│   │                                                                           │   │
│   │   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │   │
│   │   │Comment  │ │Reaction │ │Coach    │ │ Cheer   │ │Challenge│          │   │
│   │   │         │ │         │ │Message  │ │         │ │         │          │   │
│   │   └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘          │   │
│   │                                                                           │   │
│   └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└──────────────────────────────┬──────────────────────────────────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │     EXTERNAL APIS    │
                    └──────────┬──────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
         ▼                     ▼                     ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   CLOUDINARY    │  │  AWS BEDROCK    │  │    PRIVY        │
│   (Images)      │  │  (AI Coach)     │  │   (Auth)        │
│                 │  │                 │  │                 │
│ • Proof images  │  │ • Kimi K2.5     │  │ • Wallet auth   │
│ • Upload API    │  │ • Coach msgs    │  │ • Session mgmt  │
│                 │  │ • Daily nudges  │  │ • Embedded wallet│
└─────────────────┘  └─────────────────┘  └─────────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
         ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SOLANA BLOCKCHAIN                                      │
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                    OATH ANCHOR PROGRAM                                  │   │
│   │                                                                           │   │
│   │   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │   │
│   │   │ Commitment      │  │  Belief         │  │ Reputation     │        │   │
│   │   │ Account (PDA)   │  │  Account (PDA)  │  │ Account (PDA)  │        │   │
│   │   │                 │  │                 │  │                 │        │   │
│   │   │ • slug          │  │ • commitment    │  │ • total_made   │        │   │
│   │   │ • title         │  │ • believer      │  │ • total_passed │        │   │
│   │   │ • stake_amount  │  │ • stake_amount   │  │ • total_failed │        │   │
│   │   │ • status        │  │ • status         │  │ • oath_score   │        │   │
│   │   │ • proof_count   │  │ • settled        │  │                 │        │   │
│   │   └─────────────────┘  └─────────────────┘  └─────────────────┘        │   │
│   │                                                                           │   │
│   │   Instructions:                                                          │   │
│   │   • create_commitment    • submit_proof       • resolve_commitment      │   │
│   │   • co_stake_belief      • settle_believer                           │   │
│   │                                                                           │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                         HELIUS                                           │   │
│   │   Webhooks ─────────────────────────────────────────► DB Sync          │   │
│   │   RPC ──────────────────────────────────────────────► Read/Verify      │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Getting Started

```bash
# Install dependencies
pnpm install

# Build Anchor program + generate TypeScript client
pnpm run setup

# Start development server
pnpm run dev
```

Open http://localhost:3000 to explore the app.

---

## Environment Variables

Create a `.env.local` file with these variables:

```bash
# ===================
# PRIVY AUTH
# ===================
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
NEXT_PUBLIC_PRIVY_CLIENT_ID=your_client_id  # optional, for localhost/preview

# ===================
# SOLANA
# ===================
NEXT_PUBLIC_SOLANA_NETWORK=devnet  # devnet | testnet | mainnet

# ===================
# DATABASE
# ===================
DATABASE_URL=postgresql://user:password@localhost:5432/oath

# ===================
# CLOUDINARY (Proof Images)
# ===================
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ===================
# AI COACH (Kimi K2.5 on AWS Bedrock)
# ===================
BEDROCK_API_KEY=your_aws_bearer_token
BEDROCK_REGION=us-east-1
MOONSHOT_MODEL_ID=moonshotai.kimi-k2.5

# ===================
# WORLD ID (Optional - Sybil Resistance)
# ===================
NEXT_PUBLIC_WLD_APP_ID=your_world_id_app_id
WLD_API_KEY=your_world_id_api_key

# ===================
# PRIVATE SHARES (Optional)
# ===================
PRIVATE_SHARE_SECRET=your_secret_key_for_token_generation
```

---

## Commands

```bash
pnpm run dev              # Start development server
pnpm run build            # Build for production
pnpm run setup            # Build Anchor + regenerate client
pnpm run anchor-build     # Build Anchor program only
pnpm run anchor-test      # Run Anchor tests with LiteSVM
pnpm run codama:oath     # Regenerate TypeScript client from IDL
pnpm run lint            # Run ESLint
pnpm run typecheck       # Run TypeScript checks
```

---

## Testing Against Local Validator

```bash
# 1. Start local Solana validator
solana-test-validator

# 2. Configure CLI to use localnet
solana config set --url localhost

# 3. Build and deploy Anchor program
cd anchor && anchor build && anchor deploy

# 4. Regenerate TypeScript client
npm run codama:oath

# 5. Switch to localnet in the app using the cluster selector
```

---

## Key Components

### Pages
| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/explore` | Discovery feed with filters |
| `/feed` | Personalized activity feed |
| `/create` | Commitment creation wizard |
| `/dashboard` | Maker dashboard + proof submission |
| `/c/[slug]` | Public commitment page |
| `/u/[wallet]` | Reputation profile |
| `/challenge/[token]` | Challenge acceptance |

### Core Components
- **CommitmentCard** — Preview card with status, streak, believers
- **CommitmentSurfaceClient** — Full commitment page UI
- **ActivityTicker** — Live-scrolling social events
- **ArenaSidebar** — Leaderboards + stats
- **CheerWall** — One-tap encouragement
- **WalletButton** — Auth + wallet management
- **FollowButton** — Follow/unfollow with notifications framing

---

## Business Model

### Layer 1 — Protocol Fee (Day 1)
5% of staked amount routes to protocol treasury on every resolved commitment.

### Layer 2 — Believer Faith Fee (Day 1)
On oath completion, faith fee pool distributes across believers + protocol. Protocol takes fixed share (e.g., 10%).

### Layer 3 — Oath Score API (Phase 2)
DeFi protocols, DAOs, and platforms pay to query on-chain Oath Score for character signals.

### Layer 4 — Premium AI Coaching (Phase 2)
Premium coach tier (deeper behavioral analysis, weekly reports) as subscription.

**No token required. Protocol revenue-positive from first resolution.**

---

## Roadmap

### Phase 1-3 (Complete) ✅
- Core commitment lifecycle
- Social layer (follows, reactions, comments, challenges)
- AI coach with timezone-aware nudges

### Phase 4 (In Progress)
- Shareable proof cards
- Streak milestone celebrations
- Friend invite streak bonus
- Profile reputation cards

### Phase 5 (Future)
- Creator coins for high-reputation users
- Squad commitments
- Seasonal challenges

---

## Learn More

- [Solana Docs](https://solana.com/docs)
- [Anchor Docs](https://www.anchor-lang.com/docs/introduction)
- [@solana/kit](https://github.com/anza-xyz/kit)
- [Pitch Deck](docs/hackathon/pitch-deck.md)
- [Demo Script](docs/hackathon/demo-script.md)
- [Implementation Status](docs/status.md)

---

## License

MIT