const ESPN = {
  nfl: ['football','nfl'],
  'nfl preseason': ['football','nfl'],
  ncaaf: ['football','college-football'],
  nba: ['basketball','nba'],
  ncaab: ['basketball','mens-college-basketball'],
  mlb: ['baseball','mlb'],
  nhl: ['hockey','nhl'],
  mma: ['mma','ufc']
};

export default async (req) => {
  if (req.method !== 'GET') return json({ error: 'GET only' }, 405);
  const url = new URL(req.url);
  const league = (url.searchParams.get('league') || 'nfl').toLowerCase();
  const mapping = ESPN[league];
  if (!mapping) return json({ error: 'Unsupported sport' }, 400);

  const [sport, competition] = mapping;
  const date = url.searchParams.get('date') || ymd(new Date());
  const endpoint = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${competition}/scoreboard?dates=${date}&limit=100`;

  try {
    const response = await fetch(endpoint, { headers: { accept: 'application/json' } });
    if (!response.ok) return json({ error: 'Live score provider unavailable' }, 502);
    const body = await response.json();
    const events = (body.events || []).map(normalize).filter(Boolean);
    return json({ source: 'ESPN scoreboard feed', league, date, events }, 200, 20);
  } catch (error) {
    return json({ error: 'Unable to load live games', detail: String(error?.message || error) }, 502);
  }
};

export const config = { path: '/api/live-games' };

function normalize(event) {
  const competition = event?.competitions?.[0];
  const competitors = competition?.competitors || [];
  if (competitors.length < 2) return null;
  const home = competitors.find(x => x.homeAway === 'home') || competitors[0];
  const away = competitors.find(x => x.homeAway === 'away') || competitors[1];
  const status = event?.status?.type || competition?.status?.type || {};
  return {
    id: String(event.id),
    sport_title: event?.league?.abbreviation || event?.season?.type || '',
    commence_time: event.date,
    home_team: home?.team?.displayName || home?.team?.name || 'Home',
    away_team: away?.team?.displayName || away?.team?.name || 'Away',
    home_score: home?.score ?? null,
    away_score: away?.score ?? null,
    status: status.description || status.detail || status.name || 'Scheduled',
    status_short: status.shortDetail || status.detail || '',
    state: status.state || 'pre',
    completed: Boolean(status.completed),
    venue: competition?.venue?.fullName || '',
    broadcasts: (competition?.broadcasts || []).flatMap(x => x.names || []),
    bookmakers: []
  };
}

function ymd(date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date).replaceAll('-', '');
}

function json(body, status = 200, maxAge = 0) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
      'cache-control': maxAge ? `public, max-age=${maxAge}` : 'no-store'
    }
  });
}
