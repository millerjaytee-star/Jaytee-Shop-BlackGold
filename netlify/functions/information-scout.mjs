import { buildInformationQuery, normalizeFirecrawlResults, summarizeInformation } from '../../information-scout-core.mjs';

const FIRECRAWL_URL = 'https://api.firecrawl.dev/v2/search';

export default async (req) => {
  if (req.method !== 'GET') return json(405, { ok: false, error: 'GET only' });

  const gate = Netlify.env.get('MARKETIQ_INFO_SCOUT_TOKEN') || '';
  const url = new URL(req.url);
  if (!gate || url.searchParams.get('token') !== gate) return json(404, { ok: false });

  const league = clean(url.searchParams.get('league') || '');
  const home = clean(url.searchParams.get('home') || '');
  const away = clean(url.searchParams.get('away') || '');
  const entity = clean(url.searchParams.get('entity') || '');
  const eventId = clean(url.searchParams.get('eventId') || '');
  const limit = clamp(Number(url.searchParams.get('limit') || 8), 1, 12);
  const window = (url.searchParams.get('window') || 'day').toLowerCase();
  const tbs = window === 'week' ? 'qdr:w' : 'qdr:d';

  let query;
  try {
    query = buildInformationQuery({ league, home, away, entity });
  } catch (error) {
    return json(400, { ok: false, error: String(error?.message || error) });
  }

  const apiKey = Netlify.env.get('FIRECRAWL_API_KEY') || '';
  const headers = { 'content-type': 'application/json', accept: 'application/json' };
  if (apiKey) headers.authorization = `Bearer ${apiKey}`;

  const body = {
    query,
    limit,
    tbs,
    sources: [{ type: 'web' }, { type: 'news' }],
  };

  const detectedAt = new Date().toISOString();
  try {
    const response = await fetch(FIRECRAWL_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20_000),
    });
    const payload = await response.json();
    if (!response.ok || payload?.success === false) {
      return json(502, {
        ok: false,
        error: payload?.error || payload?.message || `Firecrawl HTTP ${response.status}`,
      });
    }

    const events = normalizeFirecrawlResults(payload, { eventId, league, home, away, entity }, detectedAt);
    return json(200, {
      ok: true,
      mode: apiKey ? 'authenticated' : 'keyless-starter',
      detectedAt,
      query,
      context: { eventId: eventId || null, league: league || null, home: home || null, away: away || null, entity: entity || null },
      summary: summarizeInformation(events),
      events,
      persistence: {
        status: 'not_enabled',
        target: 'information_events',
        note: 'Phase 1 is evidence acquisition only. Database writes remain behind the next persistence gate.',
      },
    });
  } catch (error) {
    return json(502, { ok: false, error: 'Unable to reach Firecrawl', detail: String(error?.message || error) });
  }
};

export const config = {
  path: '/api/information-scout',
  method: 'GET',
  rateLimit: {
    windowLimit: 10,
    windowSize: 60,
    aggregateBy: ['ip', 'domain'],
  },
};

function clean(value = '') {
  return String(value).trim().replace(/\s+/g, ' ');
}

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.trunc(value)));
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}
