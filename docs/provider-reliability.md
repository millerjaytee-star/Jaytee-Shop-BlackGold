# Provider latency and freshness

Odds and scoreboard fetches now abort after ten seconds. Successful odds responses request a 15-second shared cache; errors remain no-store and browser max-age is zero. Responses expose fetchedAt so a caller can distinguish a cached snapshot from a fresh collection. Do not use the cached user-facing odds endpoint as a tick recorder. Upstream bookmaker timestamps remain in the data.

The information scout accepts Authorization: Bearer while retaining legacy query-token callers. detectedAt is assigned only after the response has been received and parsed; request-start time is not evidence availability. Information persistence remains explicitly disabled.

Scoreboard date values must be eight digits, preventing injection of additional provider query parameters. The existing 20-second scoreboard cache remains unchanged.

## Verification

Run npm test: 19 tests, including provider failure caching, timeout signals, freshness, unauthorized configuration, date input, and receipt-time evidence. Tests use mocks and do not spend API credits.

## Live blockers observed September 12, 2026

/api/odds returned 503: THE_ODDS_API_KEY is not configured. /api/live-games returned a valid ESPN response. The MarketIQ Supabase project is inactive and the organization's two free active-project slots are occupied. Neither this patch nor a working Firecrawl connection supplies sportsbook odds or durable history. Configure only existing authorized credentials, then verify collection and persistent write/read separately. Do not pause Concrete databases to free capacity without authorization.
