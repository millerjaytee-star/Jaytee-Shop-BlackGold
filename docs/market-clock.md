# MarketIQ Market Clock

The Market Clock is the temporal evidence layer that aligns public information with sportsbook price movement without claiming causality from timing alone.

## Why it exists

MarketIQ's core research question is not simply whether a team wins. It is whether publicly observable information and market prices temporarily disagree, how quickly books reprice, which books appear to move first, and whether any apparent gap survives long enough to matter.

The Market Clock therefore keeps two separate histories:

1. information events — publication time, MarketIQ detection time, category, source, reliability routing weight, market relevance routing weight;
2. odds observations — sportsbook, market, selection, line, price, source time, observation time, ingestion time, and latency where known.

## Phase 1 capabilities

`market-clock-core.mjs` provides:

- deterministic price-change detection by event / market / selection / sportsbook;
- temporal alignment of information detection to subsequent price moves;
- explicit detection of price movement that began before the information was detected;
- reaction-lag measurement;
- first-mover sportsbook counts;
- observed propagation span across books;
- an ordered INFORMATION / PRICE_MOVE timeline;
- no causal inference.

## Important interpretation rule

A post-information move is a temporal relationship, not proof that the information caused the move.

`PREEXISTING_MOVEMENT` and `PREEXISTING_AND_POST_INFO_MOVEMENT` are intentionally first-class outcomes. MarketIQ must be willing to conclude that the market was already repricing before a discovered news item and must not rewrite the sequence after the fact.

## Next data step

Persist timestamped odds observations and reviewed information events. Then run Market Clock calculations over append-only historical data so MarketIQ can estimate:

- reaction speed by sport and market;
- sportsbook leadership by category;
- propagation time;
- signal half-life;
- information categories that historically preceded meaningful repricing;
- cases where news arrived after the market had already moved.

These outputs become research features only after adequate out-of-sample validation. They are not guaranteed betting signals.
