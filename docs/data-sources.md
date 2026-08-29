# MarketIQ Sports — Data Sources & Sportsbook Intelligence

This document captures the verified/current sportsbook and market-data sources MarketIQ should design around. It distinguishes **observable data** from **integratable/licensed data** so the product does not assume every public sportsbook page can be scraped or used commercially.

## Core principle

MarketIQ should not be a picks app. It should reconstruct market state and explain price discovery:

`SPORTSBOOK PRICES + EXCHANGE DATA + PUBLIC BETTING BEHAVIOR + SPORTS DATA + INFORMATION EVENTS + CLOSE + OUTCOME`

The strongest asset is the historical reaction graph, not the odds feed itself.

---

## Sportsbook / market sources

### VSiN Betting Splits — DraftKings and Circa

Current VSiN betting-splits pages expose handle % and bet % for spread, moneyline and totals. The page states that DraftKings-derived data updates every 5 minutes, and VSiN also exposes a Circa source view.

Use case:
- public ticket %
- public handle %
- handle-ticket divergence
- movement context
- source comparison between DraftKings and Circa

Important: these are **context features**, not proof of "sharp money."

Fields:
- `split_source`
- `market_type`
- `selection`
- `ticket_pct`
- `handle_pct`
- `handle_ticket_gap`
- `snapshot_timestamp`
- `source_update_interval_seconds`

### BetMGM public betting percentages

BetMGM publishes public betting percentages and market content that can include ticket/handle information. Treat as an independent betting-population sample when legally/technically available.

Use case:
- compare public behavior across books
- build sentiment dispersion
- detect when one book's betting population differs from another

### Action Network

Useful for public-betting and odds-comparison context where permitted. Do not treat their labels or editorial "sharp" interpretation as ground truth. Store the observable percentages and prices separately from any inference.

### Betfair Exchange

Betfair is structurally different from fixed-odds sportsbooks because exchange data can expose price, matched volume and available liquidity/order-book information through official APIs and historical products.

Use case:
- exchange reference price
- back/lay spread
- available liquidity
- matched volume
- low-latency price discovery
- market microstructure replay

Fields:
- `best_back_price`
- `best_lay_price`
- `back_size`
- `lay_size`
- `matched_volume`
- `exchange_timestamp`
- `exchange_market_id`

### DraftKings / FanDuel / BetMGM / Caesars / Fanatics

Use as observed sportsbook prices via an authorized odds provider where possible. Do **not** design direct integrations around undocumented/private endpoints.

Target data:
- moneyline
- spread
- total
- player props
- alternate lines
- bookmaker last-update timestamp

### Pinnacle

Treat as a valuable reference source if available through a licensed data provider or approved direct partnership. Do not assume unrestricted public API access.

---

# New proprietary features

## Sportsbook Fingerprint™

Learn sportsbook behavior separately by:

`sport × league × market × sportsbook`

Metrics:
- first-move frequency
- median lead time before consensus
- follower confirmation rate
- move persistence
- reversal rate
- close-prediction contribution
- price freshness/reliability

Do not permanently label a sportsbook "sharp."

## Flow Divergence™

Track disagreement between public betting and market price.

Example states:

1. `PUBLIC_CONFIRMATION`
   - tickets and handle favor same side
   - price moves same direction

2. `MONEY_DIVERGENCE`
   - ticket % and handle % materially disagree

3. `REVERSE_PRICE`
   - public metrics favor one side
   - market price moves opposite direction

4. `CROSS_BOOK_DISAGREEMENT`
   - one source moves while other books/exchange do not

5. `MARKET_WIDE_CONFIRMATION`
   - exchange/reference source moves
   - multiple books follow in short sequence

These are classifications for research, not automatic bets.

## Sentiment Dispersion™

Compare betting populations across sources.

Example:
- DraftKings ticket %
- DraftKings handle %
- Circa ticket %
- Circa handle %
- BetMGM public %
- Action Network sourced %

Calculate dispersion and disagreement. High disagreement may indicate different customer populations rather than true predictive information.

## Exchange Liquidity Layer

MarketIQ should distinguish theoretical edge from executable edge.

Store:
- current price
- quote age
- available size/liquidity
- exchange back/lay width
- market depth when available
- whether the apparent edge survives realistic execution

## Parlay Relationship Graph™

Do not multiply independent leg probabilities when legs are correlated.

Required future workflow:
1. estimate marginal leg probabilities
2. model dependence/correlation
3. estimate joint probability
4. obtain actual sportsbook same-game-parlay quote where authorized
5. calculate fair combined price
6. compare offered payout vs fair payout

Until an actual combined quote and correlation model exist, label candidate parlays as `QUOTE_REQUIRED` rather than claiming +EV.

---

# Canonical sportsbook market-state schema

```sql
CREATE TABLE sportsbook_market_state (
  id bigserial primary key,
  observed_at timestamptz not null,
  event_id text not null,
  sportsbook text not null,
  source_type text not null, -- sportsbook | exchange | split_provider
  market_type text not null,
  selection text not null,
  line numeric,
  american_odds integer,
  decimal_odds numeric,
  implied_probability numeric,
  devig_probability numeric,
  bookmaker_last_update timestamptz,
  quote_age_seconds integer,
  ticket_pct numeric,
  handle_pct numeric,
  handle_ticket_gap numeric,
  best_back_price numeric,
  best_lay_price numeric,
  back_size numeric,
  lay_size numeric,
  matched_volume numeric,
  open_line numeric,
  current_line numeric,
  consensus_line numeric,
  consensus_probability numeric,
  book_leadership_score numeric,
  time_to_start_seconds integer,
  source_quality numeric,
  ingestion_method text,
  raw_source_id text
);

CREATE INDEX idx_sms_event_market_time
  ON sportsbook_market_state(event_id, market_type, observed_at);
```

---

# Website/API implications

The website should be able to display:

- best available price
- consensus price/probability
- public betting split context
- cross-source sentiment dispersion
- first-mover and follower sequence
- exchange liquidity where available
- signal age and freshness
- market-wide vs operator-specific move classification
- parlay candidate legs with `QUOTE_REQUIRED` when joint pricing is not validated

The backend should use provider adapters so sources can be swapped without rewriting the decision engine.

Recommended interfaces:

```ts
interface OddsProvider { getEventMarkets(eventId: string): Promise<CanonicalMarket[]> }
interface BettingSplitsProvider { getSplits(eventId: string): Promise<BettingSplit[]> }
interface ExchangeProvider { getMarketState(eventId: string): Promise<ExchangeState[]> }
interface SportsDataProvider { getGameContext(eventId: string): Promise<GameContext> }
interface InformationProvider { getInformationEvents(eventId: string): Promise<InformationEvent[]> }
```

Never mix provider-specific payloads directly into scoring logic. Normalize first.

---

# Source / licensing rule

Before production ingestion, classify every source as:

- `OFFICIAL_API`
- `LICENSED_AGGREGATOR`
- `PUBLIC_PAGE_RESEARCH_ONLY`
- `MANUAL_REFERENCE`
- `NOT_APPROVED_FOR_INGESTION`

Public visibility is not permission to scrape or commercially redistribute data. Production connectors should prioritize official/licensed routes.
