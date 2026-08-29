# MarketIQ Sports — Website Build Spec

This spec translates the research into the website experience.

## Primary user workflow

1. User selects league.
2. User searches a game/team.
3. MarketIQ loads the game and current markets.
4. MarketIQ normalizes all book/exchange/split data.
5. MarketIQ ranks opportunities.
6. User opens one opportunity to see WHY it ranks.
7. User may add strong legs to Parlay Lab.
8. System blocks or downgrades weak/stale/conflicting combinations.
9. User can choose VALUE / INVESTIGATE / WAIT / PASS.

## Main navigation

- Dashboard
- Game Analyzer
- Market X-Ray
- Parlay Lab
- Research Lab
- Proof Ledger
- Market School

## Dashboard

Cards/sections:
- Today's Games
- Fresh Market Moves
- Market-Wide Confirmations
- Reverse Price Signals
- Biggest Cross-Book Disagreements
- Highest Executable Edge candidates
- Signals Aging / Stale
- Recent Reversals
- Best PASS decisions

Filters:
- sport
- league
- game
- market type
- sportsbook
- time to start
- signal state
- opportunity status

## Game Analyzer

Top header:
- Away vs Home
- start time
- venue
- market maturity
- current injury/news status

Market overview:
- spread
- ML
- total
- best price
- consensus
- de-vigged consensus probability
- projected close (when model available)

Opportunity table columns:
- selection
- market
- best book
- current price
- fair/consensus probability
- estimated edge
- freshness
- cross-book confirmation
- public/handle context
- status

Statuses:
- VALUE
- INVESTIGATE
- WATCH
- WAIT
- PASS
- STALE
- REVERSED

## Opportunity Detail Drawer

Show:
- current price
- best available book
- consensus
- estimated edge
- source count
- quote age
- movement path
- sportsbook leadership
- public ticket/handle context
- sentiment dispersion
- exchange confirmation/liquidity
- correlated market agreement
- signal state
- what would invalidate it
- reason for PASS if rejected

Evidence labels:
- FACT
- MODEL ESTIMATE
- HISTORICAL PATTERN
- INFERENCE
- UNKNOWN

## Market X-Ray

Single synchronized timeline:
- odds moves
- book sequence
- exchange moves
- public split changes
- news/injuries
- weather
- lineup/status changes

Movement annotations:
- first mover
- 25% propagation
- 50% propagation
- 75% propagation
- consensus
- reversal

Cause classification:
- INFORMATION_LED
- MARKET_FOLLOWING
- OPERATOR_SPECIFIC
- EXPOSURE_RISK
- LIQUIDITY
- CORRELATED_MARKET_REACTION
- UNKNOWN

Never present inferred cause as fact.

## Sportsbook Fingerprint panel

For selected market type show:
- first-move frequency
- median lead time
- consensus follow rate
- reversal rate
- persistence rate
- current reliability score

These metrics are market-specific, not global labels.

## Flow Divergence panel

Show ticket/handle/price relationships:
- public confirmation
- money divergence
- reverse price
- cross-book disagreement
- market-wide confirmation

Display source coverage. Missing split data should not be interpreted as zero.

## Parlay Lab

Purpose: find combinations worthy of investigation, not blindly maximize payout.

Each leg shows:
- individual estimated edge
- price freshness
- market confirmation
- status
- relationship to other selected legs

Combination checks:
- direct contradiction
- likely positive correlation
- likely negative correlation
- unknown relationship
- stale leg
- bad price
- unresolved injury/news

Until MarketIQ receives an actual sportsbook SGP price and validated correlation model:
- label combined price `QUOTE REQUIRED`
- do not claim a combined EV
- rank combinations on leg quality and relationship quality only

Once available:
- sportsbook offered parlay odds
- modeled joint probability
- fair parlay odds
- estimated parlay EV

## Proof Ledger

Freeze every generated opportunity:
- timestamp
- data-provider versions
- model version
- game
- book
- line/price
- consensus
- estimated edge
- signal state
- evidence
- invalidation threshold

Later append:
- closing price
- CLV
- result
- ROI
- model calibration result

Never overwrite the original prediction.

## Website visual direction

Financial-market-terminal clarity with consumer accessibility.

Recommended hierarchy:
- dark neutral base
- gold/accent used for selected/actionable states
- green only for validated positive/value state
- yellow for investigate/wait
- muted gray for pass/stale
- red only for reversal/invalid/conflict

Avoid casino visual language, flashing 'locks', jackpot imagery, or guaranteed-win messaging.

## MVP build order

### V0.2
- new data schemas
- provider adapters
- sportsbook state UI
- public split context UI
- sportsbook fingerprint placeholders
- Flow Divergence classifier

### V0.3
- historical snapshot recorder
- movement paths
- Market X-Ray timeline
- persistence/reversal calculations

### V0.4
- sports fundamentals model
- injuries/news information timeline
- projected close
- Proof Ledger

### V0.5
- Parlay Relationship Graph
- actual SGP quote adapter where licensed
- joint probability research
- historical analogs

### V1
- calibrated model
- Research Lab
- Market School replay
- user accounts/watchlists/alerts
