# MarketIQ Sports — Firecrawl Information Scout

## Purpose

The Information Scout adds a public-web evidence layer to MarketIQ so the system can begin answering:

- What information appeared before a price move?
- Was there an injury, availability, lineup, weather, suspension, roster, coaching, or travel signal?
- When did MarketIQ detect that information?
- Which source produced it?

Firecrawl is **not** used as a sportsbook-price feed. Odds continue to come from The Odds API or another legitimate market-data provider.

## Current flow

```text
The Odds API -> odds / market-price layer
                    |
                    v
              MarketIQ analysis
                    ^
                    |
Firecrawl -> Information Scout -> normalized information_events-compatible evidence
```

Phase 1 is discovery only. The protected endpoint returns normalized evidence shaped for the existing `information_events` schema but does not write to the database yet.

## Endpoint

`GET /api/information-scout`

Required authorization:

- `MARKETIQ_INFO_SCOUT_TOKEN` is a server-only secret.
- Supply the matching token in the request query when calling the internal endpoint.

Search context accepts:

- `league`
- `home`
- `away`
- `entity`
- `eventId`
- `limit` (1–12)
- `window=day|week`

At least one team/entity is required.

## Credit discipline

The scout uses Firecrawl Search first and does **not** automatically scrape every result page. That keeps the research layer inexpensive and prevents one broad query from consuming large numbers of credits.

Selective page retrieval should be added later only for evidence that passes relevance and source checks.

## Evidence categories

The initial deterministic router recognizes:

- injury
- availability
- suspension
- lineup
- weather
- roster
- coaching
- travel
- other

`source_reliability` and `market_relevance` are routing weights. They are not calibrated probabilities and must not be presented as certainty.

## Safety / truth boundary

- No guaranteed picks or lock language.
- No Firecrawl result is treated as authoritative merely because it was found on the web.
- No wager placement or live-money execution is added.
- No automatic prediction state is changed from a single article.
- Detection timestamps are preserved separately from publication timestamps.
- MarketIQ should later compare information time against odds movement time before concluding that information may explain repricing.

## Next phase

Persist reviewed evidence into the existing `information_events` table and align those timestamps with `odds_observations` to build the first real information-to-price market clock.
