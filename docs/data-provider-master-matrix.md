# MarketIQ Data Provider Master Matrix

## Principle
Use provider abstractions so MarketIQ can replace vendors without rewriting analytics. No scraping or private sportsbook integration should be assumed unless terms, licensing and technical access permit it.

## Tier 1 — MVP / immediate

### The Odds API
Role: broad bookmaker odds fallback and fast MVP.
Use for:
- NFL/NBA/MLB/NHL/college and other supported sports
- live/upcoming events
- moneyline/spread/total
- event markets/props where supported
- historical odds on paid plans
- MMA/UFC fight-winner odds and limited total-round markets

Limits:
- not a complete sport-stat/injury/news platform
- historical resolution and market depth vary
- not sufficient alone for a calibrated sports model

### Open/free sport-specific research sources
Use only where license permits product use.
Examples include league/open-data ecosystems for historical statistics, play-by-play, schedules and model research. Production commercialization must honor source terms.

## Tier 2 — production candidate

### SportsDataIO
Role: full-depth normalized sports + betting provider candidate.
Coverage advertised across NFL, MLB, NBA, NHL, CFB, CBB, MMA/UFC, soccer and more.

Relevant capabilities:
- schedules and event lifecycle
- teams/players/fighters
- sports statistics
- betting odds
- opening/closing prices
- line movement timestamps
- props and futures
- in-play odds
- historical odds
- news/content depending package
- MMA fighter profiles, fight stats and odds

Why it fits MarketIQ:
A single normalized provider can reduce entity-resolution failures between odds, stats, props and event IDs. It is especially promising for the Game/Fight Analyzer and live decision engine.

Action:
- use free trial/replay to build adapter
- evaluate exact production pricing/licensing before commercial launch
- map SportsDataIO IDs to canonical MarketIQ IDs

## Tier 3 — enterprise / enhancement

### Sportradar Odds Comparison Player Props
Role: licensed aggregated props at scale.
Observed support:
- top US bookmakers
- NFL
- NBA
- MLB
- NHL
- NCAA Football
- top soccer leagues

Use when prop breadth/reliability justifies enterprise spend.

### Genius Sports
Role: evaluate for official/low-latency feeds, betting data and sportsbook-grade pricing partnerships where commercially justified.
Use later when MarketIQ needs institutional real-time coverage and official data rights.

### Betfair Exchange
Role: market microstructure.
Use for:
- back/lay prices
- market depth/liquidity where exposed
- traded volume
- streaming market changes
- historical exchange data

Adds information unavailable from a simple sportsbook quote: how price discovery is occurring and whether quoted prices have meaningful market support.

Constraints:
- access, fees, geography, licensing and market availability must be checked.

## Context feeds — never truth labels

### VSiN DraftKings / Circa betting splits
Available fields include spread/ML/total handle % and bet %, with stated five-minute updates.
MarketIQ use:
- public sentiment
- handle-ticket gap
- source disagreement
- split change velocity

Do not use "big money" as automatic proof of an informed side.

### Action Network
Available public page fields include bets %, money %, differential and best price for many markets.
MarketIQ use:
- context / sentiment
- cross-source dispersion
- historical hypothesis testing

### BetMGM public betting content
Where reliably available and licensed, use public ticket/money information as an additional sentiment sample.

## Direct sportsbook observation
Sportsbooks such as DraftKings, FanDuel, BetMGM, Caesars and Fanatics are important market participants. MarketIQ needs their prices and markets, but direct app/web display does not imply a public commercial API.
Preferred method: licensed aggregator/provider feed with sportsbook attribution.

## Pinnacle
General public API access has been closed since 2025-07-23.
Do not make direct Pinnacle access a required dependency.
Use an authorized aggregator or pursue commercial access if needed.

## Required provider interfaces
OddsProvider:
- listSports()
- listEvents(sport, dateRange)
- getEventOdds(eventId, markets)
- getHistoricalOdds(eventId, window)
- getBookmakers()

SportsDataProvider:
- getEvent(eventId)
- getTeamStats(teamId, asOf)
- getPlayerStats(playerId, asOf)
- getAvailability(eventId, asOf)
- getLineup(eventId, asOf)
- getPlayByPlay(eventId, asOf)

FightDataProvider:
- getEvent(eventId)
- getFight(fightId)
- getFighterProfile(fighterId)
- getFighterHistory(fighterId, asOf)
- getFightStats(fightId, asOf)
- getWeighInOrStatusChanges(eventId, asOf)

NewsProvider:
- getEvents(entities, from, to)
- source quality
- published timestamp
- detected timestamp

ExchangeProvider:
- market book
- best back/lay
- depth
- traded volume
- stream updates

PublicFlowProvider:
- source
- ticket_pct
- handle_pct
- market
- timestamp

ParlayQuoteProvider:
- request exact combined quote for selected legs where authorized
- return sportsbook, leg IDs, combined odds, quote timestamp, expiration/availability metadata

## Canonical data storage
Never overwrite market history.
Store raw provider payload reference plus normalized record.

Core tables:
- events
- participants
- teams
- players
- fighters
- sportsbooks
- markets
- selections
- odds_snapshots
- exchange_snapshots
- betting_flow_snapshots
- injuries_and_status
- lineups
- news_events
- weather_snapshots
- sport_stats_snapshots
- fight_stats_snapshots
- market_movements
- cross_market_relationships
- model_predictions
- signals
- parlay_quotes
- parlay_predictions
- proof_ledger
- closing_results
- calibration_metrics

## Data quality fields on every critical observation
- provider
- provider_event_id
- canonical_event_id
- source_timestamp
- ingested_timestamp
- source_latency_ms if measurable
- freshness_seconds
- source_quality
- market_availability
- is_live
- schema_version

## Real-time strategy
Not every input needs the same refresh rate.
- live/in-play odds: seconds-level where feed permits
- pregame odds: provider-appropriate frequent updates
- injury/lineup/status: event-driven + polling fallback
- public splits: respect source update interval (e.g. VSiN states 5 min)
- weather: frequency increases near event
- static player/fighter profiles: slow cache

## Licensing gate
Before production, classify every provider as:
1. Commercially licensed for display + analytics
2. Licensed for analytics but not redistribution/display
3. Research-only
4. Public contextual reference not suitable for automated ingestion
5. Prohibited/unapproved

No production feature should depend on category 3–5 data without a compliant replacement.