import test from 'node:test';
import assert from 'node:assert/strict';
import odds from '../netlify/functions/odds.mjs';
import games from '../netlify/functions/live-games.mjs';
import scout from '../netlify/functions/information-scout.mjs';

function setup(t, values = {}) {
  const previous = globalThis.Netlify;
  globalThis.Netlify = {env: {get: name => values[name]}};
  t.after(() => { globalThis.Netlify = previous; });
}

test('missing odds credential fails honestly and cannot be cached', async t => {
  setup(t);
  const response = await odds(new Request('https://example.test/api/odds'));
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('successful odds get a short shared cache and collection timestamp', async t => {
  setup(t, {THE_ODDS_API_KEY: 'test-only'});
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    assert.ok(options.signal instanceof AbortSignal);
    return Response.json([]);
  });
  const response = await odds(new Request('https://example.test/api/odds'));
  assert.match(response.headers.get('cache-control'), /s-maxage=15/);
  assert.ok(Number.isFinite(Date.parse((await response.json()).fetchedAt)));
});

test('provider failures remain uncached', async t => {
  setup(t, {THE_ODDS_API_KEY: 'test-only'});
  t.mock.method(globalThis, 'fetch', async () => { throw Error('timeout'); });
  const response = await odds(new Request('https://example.test/api/odds'));
  assert.equal(response.status, 502);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('scoreboard rejects injected date parameters without calling provider', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', () => {throw Error('must not fetch');});
  const response = await games(new Request('https://example.test/api/live-games?date=20260912%26limit%3D999'));
  assert.equal(response.status, 400);
  assert.equal(fetch.mock.callCount(), 0);
});

test('scoreboard request has a bounded timeout and freshness metadata', async t => {
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    assert.ok(options.signal instanceof AbortSignal);
    return Response.json({events: []});
  });
  const response = await games(new Request('https://example.test/api/live-games?date=20260912'));
  assert.equal(response.status, 200);
  assert.ok(Number.isFinite(Date.parse((await response.json()).fetchedAt)));
});

test('scout authenticates by header and timestamps evidence after receipt', async t => {
  setup(t, {MARKETIQ_INFO_SCOUT_TOKEN: 'test-only'});
  let receivedAt;
  t.mock.method(globalThis, 'fetch', async () => {
    await new Promise(resolve => setTimeout(resolve, 15));
    receivedAt = Date.now();
    return Response.json({data: {web: [{url: 'https://example.org/report', title: 'Player injury report'}]}});
  });
  const response = await scout(new Request('https://example.test/api/information-scout?entity=Team', {headers: {authorization: 'Bearer test-only'}}));
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.ok(Date.parse(result.detectedAt) >= receivedAt);
  assert.equal(result.events[0].detected_at, result.detectedAt);
  assert.equal(result.persistence.status, 'not_enabled');
});
