import { createHash } from 'node:crypto';

const CATEGORY_RULES = [
  ['injury', ['injury', 'injured', 'questionable', 'doubtful', 'out with', 'hurt', 'medical']],
  ['availability', ['inactive', 'active status', 'available', 'unavailable', 'game-time decision', 'ruled out']],
  ['suspension', ['suspend', 'suspension', 'discipline', 'banned']],
  ['lineup', ['lineup', 'starting', 'starter', 'depth chart', 'rotation', 'starting five', 'starting pitcher']],
  ['weather', ['weather', 'wind', 'rain', 'snow', 'temperature', 'forecast', 'storm', 'humidity']],
  ['roster', ['roster', 'signed', 'waived', 'released', 'trade', 'acquired', 'called up', 'activated']],
  ['coaching', ['coach', 'coaching', 'play caller', 'coordinator', 'scheme']],
  ['travel', ['travel', 'flight', 'delay', 'rest disadvantage', 'back-to-back', 'road trip']],
];

const HIGH_TRUST_DOMAINS = [
  'nfl.com',
  'nba.com',
  'wnba.com',
  'mlb.com',
  'nhl.com',
  'ncaa.com',
  'espn.com',
  'cbssports.com',
  'foxsports.com',
  'sports.yahoo.com',
];

function clean(value = '') {
  return String(value).trim().replace(/\s+/g, ' ');
}

export function buildInformationQuery({ league = '', home = '', away = '', entity = '' } = {}) {
  const leagueName = clean(league);
  const homeTeam = clean(home);
  const awayTeam = clean(away);
  const namedEntity = clean(entity);
  const subject = namedEntity || [awayTeam, homeTeam].filter(Boolean).join(' vs ');
  if (!subject) throw new Error('At least one team or entity is required');
  return `${leagueName} ${subject} latest injury availability lineup weather suspension roster coaching news`.trim();
}

export function classifyInformation(text = '') {
  const haystack = clean(text).toLowerCase();
  for (const [category, terms] of CATEGORY_RULES) {
    if (terms.some((term) => haystack.includes(term))) return category;
  }
  return 'other';
}

export function sourceReliability(url = '') {
  let hostname = '';
  try {
    hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return 0.35;
  }
  if (HIGH_TRUST_DOMAINS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))) return 0.85;
  if (hostname.endsWith('.edu') || hostname.endsWith('.gov')) return 0.85;
  if (hostname.includes('x.com') || hostname.includes('twitter.com') || hostname.includes('facebook.com') || hostname.includes('instagram.com')) return 0.4;
  return 0.6;
}

export function marketRelevance(category, text = '') {
  const base = {
    injury: 0.9,
    availability: 0.9,
    suspension: 0.9,
    lineup: 0.82,
    weather: 0.8,
    roster: 0.72,
    coaching: 0.58,
    travel: 0.5,
    other: 0.3,
  }[category] ?? 0.3;
  const haystack = clean(text).toLowerCase();
  const urgencyBoost = /ruled out|inactive|starting|confirmed|suspended|questionable|doubtful|severe|storm/.test(haystack) ? 0.06 : 0;
  return Math.min(Number((base + urgencyBoost).toFixed(2)), 1);
}

function publishedAt(row) {
  const metadata = row?.metadata && typeof row.metadata === 'object' ? row.metadata : {};
  return row?.date || metadata?.publishedTime || metadata?.['article:published_time'] || metadata?.datePublished || null;
}

function sourceId(url, detectedAt) {
  return createHash('sha256').update(`${url}|${detectedAt}`).digest('hex').slice(0, 32);
}

export function normalizeFirecrawlResults(payload, context = {}, detectedAt = new Date().toISOString()) {
  const data = payload?.data && typeof payload.data === 'object' ? payload.data : {};
  const rows = [
    ...(Array.isArray(data.web) ? data.web.map((row) => ({ ...row, sourceType: 'web' })) : []),
    ...(Array.isArray(data.news) ? data.news.map((row) => ({ ...row, sourceType: 'news' })) : []),
  ];

  return rows.flatMap((row) => {
    const url = clean(row?.url);
    const title = clean(row?.title);
    if (!url || !title) return [];
    const description = clean(row?.description || row?.snippet || row?.summary || '');
    const category = classifyInformation(`${title} ${description}`);
    return [{
      event_id: clean(context.eventId) || null,
      entity: clean(context.entity) || [clean(context.away), clean(context.home)].filter(Boolean).join(' vs '),
      category,
      previous_state: null,
      new_state: description || title,
      published_at: publishedAt(row),
      detected_at: detectedAt,
      source: url,
      source_type: row.sourceType,
      source_reliability: sourceReliability(url),
      market_relevance: marketRelevance(category, `${title} ${description}`),
      surprise_score: null,
      raw_source_id: sourceId(url, detectedAt),
      title,
      description: description || null,
      position: Number.isInteger(row?.position) ? row.position : null,
    }];
  });
}

export function summarizeInformation(events = []) {
  const byCategory = {};
  for (const event of events) byCategory[event.category] = (byCategory[event.category] || 0) + 1;
  const top = [...events].sort((a, b) => (b.market_relevance ?? 0) - (a.market_relevance ?? 0))[0] || null;
  return {
    count: events.length,
    byCategory,
    highestRelevance: top ? {
      category: top.category,
      title: top.title,
      source: top.source,
      market_relevance: top.market_relevance,
      source_reliability: top.source_reliability,
    } : null,
  };
}
