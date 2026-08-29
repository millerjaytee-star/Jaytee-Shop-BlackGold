# MarketIQ Sports

**See the market. Understand the move.**

MarketIQ Sports is a sports-market intelligence MVP. It is deliberately not a “lock picks” product. The app lets a user select a league, type a game/team, retrieve current multi-book prices, and rank price opportunities using cross-book consensus, estimated price edge, quote freshness, and market depth. It also builds small **parlay candidate baskets** while explicitly refusing to claim same-game parlay EV until correlation and the actual sportsbook quote are available.

## What works now

- Game/team search for NFL, NFL preseason, NCAAF, NBA, NCAAB, MLB, NHL.
- Current moneyline, spread and total prices via The Odds API v4.
- Optional event-level player-prop request for supported leagues/markets.
- Best-price detection across books.
- Consensus-implied probability using other books when possible.
- Estimated price edge and opportunity ranking.
- VALUE / INVESTIGATE / WATCH / PASS states.
- Quote freshness and book-depth checks.
- Parlay candidate lab with correlation warning.
- Demo mode that works without an API key.
- Unit tests for odds math, de-vigging, EV, ranking and parlay filtering.
- Netlify serverless proxy so the API key is not exposed in browser code.

## Important model limitation

The MVP is a **market-price engine**, not yet the full five-brain system. Consensus is being used as the initial market prior. It does not yet ingest injuries, weather, historical line movement, book leadership, projected closing lines, or calibrated sports models. Those are the next layers from the product blueprint.

The current estimated edge answers: “Is this offered price favorable relative to the other books’ implied market consensus?” It does **not** mean “this team is guaranteed to win.”

## Setup

1. Create an API key at The Odds API.
2. Copy `.env.example` to `.env`.
3. Set `THE_ODDS_API_KEY`.
4. Run `npm install`.
5. Run `npm run dev`.
6. Open the Netlify Dev URL.

### Netlify environment variables

Set:

- `THE_ODDS_API_KEY`
- `ODDS_REGION=us`

No API secret is committed to GitHub.

## Provider design

The live function currently uses The Odds API v4 because it exposes current event IDs, moneylines, spreads, totals and event-level additional markets in one API. The core analysis code is provider-agnostic: normalized event/book/market/outcome objects feed `logic.mjs`.

Future adapters should normalize to the same internal shape so MarketIQ is not permanently tied to one vendor.

## Opportunity scoring (MVP)

Inputs are shown separately in the UI rather than pretending one score is certainty:

- estimated price edge vs consensus
- number of books contributing
- cross-book dispersion
- quote freshness
- best offered price

Current status thresholds are explicit MVP defaults and **must be backtested/calibrated before being treated as production decision rules**.

## Parlays

Parlays are intentionally conservative in this version. A candidate parlay is only a combination of individually qualifying legs. MarketIQ does not estimate same-game parlay EV by blindly multiplying probabilities, because same-game legs can be correlated and the sportsbook's actual parlay quote matters.

The production Parlay Brain should add:

1. estimated joint probability / correlation model,
2. actual quoted parlay payout,
3. de-vigged fair joint price,
4. covariance by market type,
5. exposure/variance controls,
6. rejection of duplicate or logically conflicting legs.

## Roadmap

1. Persist odds snapshots in Postgres/Supabase.
2. Build opening/current/closing price history.
3. Add injury/news/weather timestamps.
4. Build market movement + synchronization engine.
5. Learn book leadership by sport/market.
6. Add market-as-prior sports model.
7. Add projected closing-line model.
8. Add historical analog engine.
9. Add calibrated parlay correlation model.
10. Add Proof Ledger and backtesting dashboard.

## Responsible use

MarketIQ is decision-support software. It does not promise profits, guaranteed winners or loss recovery. PASS is a successful analytical result when price/evidence is poor.
