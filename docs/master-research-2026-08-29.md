# MarketIQ Sports — Master Research Pass (2026-08-29)

## Product objective
MarketIQ should accept a game or fight, ingest currently available prices and relevant sports/fighter data, estimate fair probabilities with uncertainty, compare those estimates with sportsbook prices, identify whether a market is still moving, and return VALUE / INVESTIGATE / WAIT / PASS. It should also be able to construct 2–5 leg parlay candidates, but only label a parlay as +EV when the joint probability model and the actual combined sportsbook quote are available.

The product must not claim guaranteed winning bets or manufacture a high-confidence percentage from a single odds feed.

## Competitor research and the strengths to borrow

### OddsJam
Observed strengths:
- Real-time odds across 100+ sportsbooks/exchanges.
- Arbitrage, positive-EV, middles, low-hold and live tools.
- Bet tracking and CLV.
- Fast refresh is a major differentiator.

MarketIQ improvement:
- Explain *why* a price may be attractive rather than only surface a discrepancy.
- Combine market movement with sports fundamentals, injuries/news, time-to-start, correlated markets, historical analogs and calibration.
- Show invalidation conditions and PASS when the quote is no longer strong.

### Unabated
Observed strengths:
- Real-time odds screen across sportsbooks, exchanges and prediction markets.
- Vig-free consensus (Unabated Line), Edge Tool, synthetic hold, line comparison, alt lines and in-game tools.
- Explicit latency display.

MarketIQ improvement:
- Learn book leadership statistically by sport/market rather than rely on a fixed sharp-book hierarchy.
- Add information-event timelines, cause classification, cross-market graphs, historical analogs and calibrated probability reports.
- Add a Proof Ledger that freezes every signal before outcome.

### Outlier
Observed strengths:
- Prop Finder spanning FanDuel, DraftKings, BetMGM and Caesars.
- EV+ filters and prop-centric research workflows.
- Player/team/matchup statistics around props.

MarketIQ improvement:
- Join prop data to full market microstructure and movement history.
- Explicitly model injury/news timing, projected close, signal age and correlated markets.
- Grade prop models using Brier/log-loss/calibration in addition to ROI.

### Pikkit
Observed strengths:
- BookSync automatically imports bets from 30+ sportsbooks.
- Portfolio tracking, ROI, win rate, CLV and bet-history analytics.

MarketIQ improvement:
- Make pre-bet decision intelligence the core product.
- Later sync/track bets so Proof Ledger and user outcomes can be compared with model quality.
- Separate a good decision from a lucky outcome.

### Action Network / VSiN
Observed strengths:
- Public bet percentage, money percentage and best odds.
- VSiN exposes DraftKings and Circa split views and updates split data every five minutes.

MarketIQ improvement:
- Treat public splits as context only, not evidence of 'sharp' truth.
- Build Flow Divergence features and test them historically with movement, book propagation and close behavior.

## Verified production-grade data candidates

### The Odds API
Use as the fast MVP odds layer and fallback provider.
- Current/live/upcoming odds.
- US and global bookmakers.
- Mainline markets and event-specific markets where supported.
- Historical odds from June 2020 on paid plans.
- MMA/UFC current and historical fight-winner odds, with limited total-round coverage from some books.

### SportsDataIO — preferred evaluation for the full-depth production layer
SportsDataIO advertises a broad REST API stack for NFL, NBA, MLB, NHL, CFB, CBB, MMA/UFC, soccer, golf and others.
Betting feeds include aggregated odds, opening/closing lines, line-movement timestamps, player props, futures, in-play and historical data.

For MMA/UFC specifically it advertises:
- schedules
- fighter profiles (including reach/height/weight-class style fields through fighter records)
- fight odds
- player/fighter props and futures
- line movement
- live fight stats
- in-play odds
- results and grading
- historical data

This makes SportsDataIO the first full-depth provider to evaluate for the Game/Fight Analyzer.

### Sportradar Odds Comparison Player Props
Enterprise candidate.
- Aggregated player props from top US bookmakers.
- NFL, NBA, MLB, NHL, NCAA football and top soccer coverage.
- Useful if MarketIQ needs a licensed, normalized prop feed at scale.

### Betfair Exchange
Use where licensing, jurisdiction and access permit.
- Exchange prices
- volume
- order/market updates via streaming
- historical timestamped data

This is uniquely valuable for liquidity, price discovery and microstructure analysis.

### Pinnacle
Direct general-public API access has been closed since 2025-07-23. Do not architect MarketIQ around direct Pinnacle API availability. If Pinnacle prices are needed, obtain them through licensed aggregators or a commercial partnership.

## MarketIQ's competitive moat
Commodity: odds feeds.
Moat: MARKET STATE → INFORMATION EVENT → FIRST REACTION → BOOK PROPAGATION → CROSS-MARKET RESPONSE → REVERSAL/PERSISTENCE → CONSENSUS → CLOSE → OUTCOME → CALIBRATION.

## Probability truth standard
Never show one mystery confidence percentage. The UI must distinguish:
- market-implied probability
- de-vigged consensus probability
- independent sports/fighter model probability
- calibrated final probability
- confidence/uncertainty interval
- price-implied break-even probability
- estimated edge
- sample size
- historical analog count
- projected close / CLV expectation

A high displayed probability does not mean a guaranteed win. It must be a calibrated estimate tested on held-out historical data.

## Five-Brain model
1. Market Brain — consensus, de-vigging, best price, dispersion, open/current/close, projected close.
2. Sports Brain — team/player/fighter fundamentals, matchup, usage, availability, rest, travel, weather, sport-specific factors.
3. Information Brain — injuries, lineups, fighter status, weather, news and timestamps.
4. Microstructure Brain — movement speed, acceleration, synchronization, book leadership, propagation, reversals, liquidity, stale quotes.
5. Calibration Brain — Brier score, log loss, CLV, reliability curves, ROI after vig, drawdown, sample size and uncertainty.

## Product pages required
- Today / Live Board
- Ask MarketIQ
- Game/Fight Analyzer
- Market X-Ray
- Prop Lab
- Parlay Lab
- Sportsbook Fingerprint
- Flow Divergence
- Research Lab
- Proof Ledger
- Calibration Dashboard
- Bet Tracker / Portfolio (later)

## Decision states
VALUE — current quote appears better than calibrated fair price and passes negative filters.
INVESTIGATE — interesting disagreement but unresolved evidence.
WAIT — thesis may be valid but information/price discovery is incomplete.
PASS — edge is too small, stale, contradicted, low-confidence or poorly priced.

No LOCK label.

## Key competitor-strength features to combine
- odds comparison and speed (OddsJam/Unabated)
- fair-price consensus and low-hold logic (Unabated)
- prop discovery and context (Outlier)
- sportsbook/bet tracking (Pikkit)
- public-money context (Action/VSiN)
- exchange liquidity (Betfair)
- sport/fighter depth + normalized odds/props/history (SportsDataIO)

The differentiated layer is causality, time, calibration, cross-market relationships, transparency and the Proof Ledger.