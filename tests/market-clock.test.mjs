import test from 'node:test';
import assert from 'node:assert/strict';

import {
  detectPriceMoves,
  alignInformationToMoves,
  buildMarketClock,
} from '../market-clock-core.mjs';

const odds = [
  { event_id: 'g1', market: 'spreads', selection: 'Away', sportsbook: 'BookA', line: 3, american_odds: -110, observed_at: '2026-09-12T16:00:00Z' },
  { event_id: 'g1', market: 'spreads', selection: 'Away', sportsbook: 'BookB', line: 3, american_odds: -110, observed_at: '2026-09-12T16:00:05Z' },
  { event_id: 'g1', market: 'spreads', selection: 'Away', sportsbook: 'BookA', line: 3.5, american_odds: -110, observed_at: '2026-09-12T16:05:00Z' },
  { event_id: 'g1', market: 'spreads', selection: 'Away', sportsbook: 'BookB', line: 3.5, american_odds: -115, observed_at: '2026-09-12T16:06:30Z' },
  { event_id: 'g1', market: 'totals', selection: 'Over', sportsbook: 'BookA', line: 44.5, american_odds: -110, observed_at: '2026-09-12T16:00:00Z' },
  { event_id: 'g1', market: 'totals', selection: 'Over', sportsbook: 'BookA', line: 44.5, american_odds: -105, observed_at: '2026-09-12T16:07:00Z' },
];

const info = [
  {
    id: 10,
    event_id: 'g1',
    category: 'injury',
    source: 'https://example.com/injury',
    detected_at: '2026-09-12T16:04:00Z',
    published_at: '2026-09-12T16:03:30Z',
    source_reliability: 0.85,
    market_relevance: 0.9,
  },
];

test('detectPriceMoves finds line and price changes by sportsbook', () => {
  const moves = detectPriceMoves(odds);
  assert.equal(moves.length, 3);
  assert.equal(moves[0].sportsbook, 'BookA');
  assert.equal(moves[0].line_delta, 0.5);
  assert.equal(moves[1].sportsbook, 'BookB');
  assert.equal(moves[1].odds_delta, -5);
});

test('alignInformationToMoves measures lag without claiming causality', () => {
  const moves = detectPriceMoves(odds);
  const rows = alignInformationToMoves(info, moves);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].temporal_status, 'POST_INFO_MOVEMENT');
  assert.equal(rows[0].first_mover_book, 'BookA');
  assert.equal(rows[0].reaction_lag_seconds, 60);
  assert.equal(rows[0].affected_book_count, 2);
  assert.equal(rows[0].causality_claimed, false);
});

test('preexisting movement is flagged instead of misattributed', () => {
  const earlierInfo = [{ ...info[0], detected_at: '2026-09-12T16:05:30Z' }];
  const rows = alignInformationToMoves(earlierInfo, detectPriceMoves(odds));
  assert.equal(rows[0].preexisting_move_count, 1);
  assert.equal(rows[0].temporal_status, 'PREEXISTING_AND_POST_INFO_MOVEMENT');
});

test('buildMarketClock produces ordered timeline and leadership summary', () => {
  const clock = buildMarketClock({ informationEvents: info, oddsObservations: odds });
  assert.equal(clock.summary.information_events, 1);
  assert.equal(clock.summary.price_moves, 3);
  assert.equal(clock.summary.median_reaction_lag_seconds, 60);
  assert.equal(clock.book_leadership[0].sportsbook, 'BookA');
  assert.equal(clock.timeline[0].type, 'INFORMATION');
  assert.match(clock.methodology, /does not infer causality/i);
});
