import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildInformationQuery,
  classifyInformation,
  marketRelevance,
  normalizeFirecrawlResults,
  sourceReliability,
  summarizeInformation,
} from '../information-scout-core.mjs';

test('buildInformationQuery focuses on market-moving context', () => {
  const query = buildInformationQuery({ league: 'NFL', away: 'Baltimore Ravens', home: 'Buffalo Bills' });
  assert.match(query, /Baltimore Ravens vs Buffalo Bills/);
  assert.match(query, /injury/);
  assert.match(query, /weather/);
});

test('classifyInformation finds high-value categories', () => {
  assert.equal(classifyInformation('Quarterback ruled out with injury'), 'injury');
  assert.equal(classifyInformation('Heavy wind and rain in forecast'), 'weather');
  assert.equal(classifyInformation('Starting lineup confirmed'), 'lineup');
});

test('reliability and relevance are routing weights, not certainty claims', () => {
  assert.ok(sourceReliability('https://www.nfl.com/news/example') > sourceReliability('https://x.com/example'));
  assert.ok(marketRelevance('injury', 'player ruled out') > marketRelevance('other', 'general feature story'));
});

test('normalizeFirecrawlResults produces information_events-compatible evidence', () => {
  const payload = {
    data: {
      news: [{
        title: 'Quarterback ruled out before game',
        url: 'https://www.espn.com/example',
        description: 'The starter will not play because of an injury.',
        date: '2026-09-12T18:00:00Z',
        position: 1,
      }],
      web: [{
        title: 'Game-day weather forecast',
        url: 'https://www.weather.gov/example',
        description: 'Strong wind and rain expected near kickoff.',
        position: 2,
      }],
    },
  };
  const events = normalizeFirecrawlResults(
    payload,
    { eventId: 'evt_1', league: 'NFL', away: 'Ravens', home: 'Bills' },
    '2026-09-12T18:30:00Z',
  );
  assert.equal(events.length, 2);
  assert.equal(events[0].event_id, 'evt_1');
  assert.equal(events[0].category, 'injury');
  assert.equal(events[1].category, 'weather');
  assert.equal(events[0].detected_at, '2026-09-12T18:30:00Z');
  assert.ok(events[0].raw_source_id.length >= 20);

  const summary = summarizeInformation(events);
  assert.equal(summary.count, 2);
  assert.equal(summary.byCategory.injury, 1);
  assert.equal(summary.byCategory.weather, 1);
});
