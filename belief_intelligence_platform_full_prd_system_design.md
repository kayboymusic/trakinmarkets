# Belief Intelligence Platform — Full PRD + Technical Specification + Architecture

---

# 1. Product Overview

## Definition
A web-based platform that aggregates prediction markets (Polymarket, Kalshi, Bayse) and surfaces real-time probability changes, ranked by significance, with contextual explanations.

## Core Value Proposition
“See what the world just started believing — and why.”

## Product Type
- Intelligence layer (not a trading app)
- Real-time signal detection system

---

# 2. Goals

## Primary
- Surface top probability movements in real-time
- Provide concise explanations for each move
- Enable quick navigation to underlying markets

## Secondary
- Become default discovery layer for prediction markets
- Serve as belief-based alternative to news feeds

---

# 3. Users

- Traders (crypto, macro)
- Analysts & researchers
- Journalists
- Curious retail users

---

# 4. Core Use Cases

1. Scan belief shifts
2. Understand why a move happened
3. Navigate to underlying market
4. Discover emerging signals before news
5. Filter by topic/platform (MVP+)

---

# 5. Core Features (MVP)

## 5.1 Feed
- Ranked list of top movers
- Each item:
  - Market title
  - Probability change (from → to)
  - Delta (%)
  - Time window
  - Trigger summary
  - Sparkline
  - Platform source

## 5.2 Detail View
- Sparkline chart
- Timeline of events
- Probability movement summary

## 5.3 Actions
- View Market (external link)
- See Why (modal)

## 5.4 Filters
- Time window
- Platform
- Minimum movement

---

# 6. System Overview

## High-Level Flow

External APIs → Ingestion → Normalization → Storage → Detection → Ranking → Attribution → API → UI

---

# 7. Technical Architecture

## 7.1 Stack

Frontend:
- Next.js
- Tailwind + shadcn/ui
- Recharts

Backend:
- Node.js (TypeScript)
- Express/NestJS

Infra:
- Redis
- PostgreSQL
- TimescaleDB (optional)

---

# 8. Data Model

## Market
- id
- platform
- title
- probability
- volume
- liquidity
- url

## Snapshot
- marketId
- timestamp
- probability
- volume

---

# 9. Ingestion Layer

## Responsibilities
- Fetch market data
- Normalize format
- Emit events

## Strategy
- Polling (MVP)
- WebSocket (later)

---

# 10. Event System

## Technology
- Redis Streams (MVP)

## Topics
- market.snapshots
- market.moves

---

# 11. Storage

## Databases
- PostgreSQL (core data)
- Time-series storage (snapshots)

## Cache
- Redis (feed + computed results)

---

# 12. Change Detection Engine

## Purpose
Detect significant probability movements

## Logic
- Compare current vs past values (15m, 1h, 4h)
- Compute delta
- Apply threshold (≥5%)
- Filter low liquidity

## Output
SIGNIFICANT_MOVE event

---

# 13. Ranking Engine

## Formula
score = |delta| × liquidityWeight × recencyWeight

## Output
Sorted Top Movers

---

# 14. Attribution Engine

## MVP
- Keyword match
- Time correlation

## Output
Timeline of events

## Future
- Embeddings
- LLM-based reasoning

---

# 15. API Layer

## Endpoints

GET /feed
GET /market/:id

---

# 16. Frontend Architecture

## Pages
- Feed
- Modal detail

## Components
- FeedCard
- Sparkline
- Modal
- Filters

---

# 17. Real-Time Strategy

MVP:
- Poll every 30s

Future:
- WebSocket push

---

# 18. Caching Strategy

- Feed cached in Redis
- Precomputed every 10–30s

---

# 19. Scaling Strategy

- Stateless services
- Event-driven processing
- Horizontal scaling

---

# 20. Fault Tolerance

- Retry ingestion
- Fallback to cache
- Handle missing data

---

# 21. Observability

- Logs
- Metrics (latency, throughput)

---

# 22. Security

- Rate limiting
- Input validation

---

# 23. Deployment

## MVP
- Monolith backend
- Single DB
- Redis

## Scale
- Microservices
- Kafka

---

# 24. Success Metrics

- DAU
- Session time
- CTR to markets

---

# 25. Risks

- Low liquidity noise
- Weak attribution
- API instability

---

# 26. Definition of Done (MVP)

- Top movers feed
- Updates ≤30s
- Basic attribution
- Working UI

---

# 27. Product Insight

This system is a:

Real-time belief intelligence layer

Built on:
- signal detection
- ranking
- attribution

---

# 28. Key Principle

Precompute everything. Serve instantly.

---

# END
