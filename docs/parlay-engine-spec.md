# MarketIQ Parlay Engine Specification

## Goal
Allow a user to ask naturally:
- "Build me a 2-leg NBA parlay for this game."
- "Give me a conservative UFC parlay."
- "What are the best opportunities in Ravens vs Bills?"
- "Build a 3-leg same-game parlay, but only if the price is fair."

The engine returns ranked candidate legs, current odds by sportsbook, estimated calibrated probability, uncertainty, relationship/correlation information, and the actual combined parlay quote when available.

## Core rule
Do not compute a same-game parlay fair probability as a simple product of marginal leg probabilities when correlation exists.

For independent legs only:
P(A and B) = P(A) × P(B)

For correlated legs, use a calibrated joint model or sportsbook-observed joint pricing. If neither exists, status is QUOTE REQUIRED / CORRELATION UNVERIFIED.

## Required input object
ParlayRequest:
- sport
- league
- event_id
- natural_language_request
- requested_leg_count (2–5)
- risk_profile: conservative | balanced | aggressive
- market_preferences: optional
- sportsbook_preferences: optional
- max_correlation_risk
- max_signal_age

## Leg candidate features
Each candidate must include:
- market_id
- selection
- line
- sportsbook
- American and decimal odds
- quote timestamp / freshness
- market break-even probability
- market consensus probability
- sports/fighter model probability
- calibrated probability
- uncertainty interval
- estimated EV
- projected close
- CLV expectation
- signal state
- sample size
- relevant information events
- correlated market nodes
- invalidation price

## Candidate rejection filters
Reject/parlay-PASS if:
- stale quote
- weak provider coverage
- unresolved major injury/fighter status
- current price materially worse than consensus
- model is uncalibrated for this sport/market
- historical sample too small
- information conflict is unresolved
- correlation cannot be estimated for a same-game combination
- actual sportsbook parlay quote unavailable when a +EV claim is requested
- leg duplicates the same underlying outcome excessively
- edge disappears after reasonable uncertainty adjustment

## Risk profiles
Conservative:
- 2 legs preferred
- higher calibrated probability
- lower correlation uncertainty
- mainline/alt-line markets preferred
- avoid longshot combinations

Balanced:
- 2–3 legs
- require positive price-quality evidence
- allow explainable positive/negative correlations

Aggressive:
- up to 4–5 legs
- still must pass minimum quality gates
- clearly show increased variance and lower joint hit probability

No risk profile removes calibration rules.

## Same-game relationship graph examples
NBA:
- star points over ↔ star minutes/usage
- star assists over ↔ teammate made-field-goal opportunities
- team total over ↔ offensive player scoring overs
- favorite spread ↔ opponent unders may correlate depending on game script
- rebounds ↔ opponent shooting/miss profile

NFL:
- QB pass yards over ↔ WR/TE receiving yards over
- QB attempts ↔ trailing game script
- favorite ML/spread ↔ RB rush attempts may correlate through positive game script
- game total over ↔ passing/receiving overs

MLB:
- pitcher strikeouts ↔ pitcher innings / opponent K-rate
- team ML ↔ starting pitcher performance
- team total ↔ hitter props

UFC/MMA:
- fighter ML ↔ method-of-victory props
- fight goes distance ↔ decision-method props
- total rounds over ↔ fight-goes-distance
- submission/KO props are mutually exclusive outcome structures

These relationships must be learned/validated rather than hard-coded as fixed probability adjustments.

## Joint probability approaches, in order of maturity
V0: do not estimate correlation; only rank candidate legs and require sportsbook quote.
V1: empirical pairwise correlation from historical outcomes and market states.
V2: conditional probability models by sport/market/game state.
V3: multivariate simulation using player/team/fighter distributions and game/fight simulations.
V4: calibrated joint model trained against actual SGP outcomes and sportsbook combined prices.

## Actual parlay price comparison
When a sportsbook offers combined decimal odds D_book:
BreakEven_book = 1 / D_book

When MarketIQ has calibrated joint probability P_joint:
FairDecimal = 1 / P_joint
ExpectedValue per $1 stake = P_joint × (D_book - 1) - (1 - P_joint)

Only label parlay VALUE/+EV when:
- P_joint is calibrated for the relevant structure,
- actual D_book is fresh and executable,
- uncertainty-adjusted edge exceeds configured threshold,
- all negative filters pass.

## Response UI
Parlay card:
- Sportsbook / current combined odds
- Legs
- Joint calibrated probability
- Break-even probability at quote
- Estimated edge
- Probability uncertainty interval
- Correlation summary
- Market confirmation
- Information freshness
- Historical analog count
- Projected close
- Status: VALUE / INVESTIGATE / WAIT / PASS / QUOTE REQUIRED
- "Why this parlay?"
- "What could break it?"

## Accountability
Every generated parlay must be written to Proof Ledger before the event with:
- model version
- feature version
- source timestamps
- exact available leg quotes
- combined quote if available
- probability estimate
- uncertainty
- reasons
- rejection/acceptance status

After settlement append result, CLV where measurable, predicted-vs-actual calibration bucket and ROI. Never rewrite the original signal.