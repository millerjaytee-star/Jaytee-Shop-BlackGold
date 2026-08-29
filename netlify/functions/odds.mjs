const SPORT_KEYS = {
  nfl: 'americanfootball_nfl',
  'nfl preseason': 'americanfootball_nfl_preseason',
  ncaaf: 'americanfootball_ncaaf',
  nba: 'basketball_nba',
  ncaab: 'basketball_ncaab',
  mlb: 'baseball_mlb',
  nhl: 'icehockey_nhl',
  mma: 'mma_mixed_martial_arts'
};

const FEATURED_MARKETS = {
  mma: ['h2h','totals']
};

const PROP_MARKETS = {
  nfl: ['player_pass_yds','player_pass_tds','player_rush_yds','player_reception_yds','player_receptions'],
  ncaaf: ['player_pass_yds','player_pass_tds','player_rush_yds','player_reception_yds'],
  nba: ['player_points','player_rebounds','player_assists','player_threes'],
  ncaab: ['player_points','player_rebounds','player_assists','player_threes'],
  mlb: ['batter_hits','batter_total_bases','pitcher_strikeouts'],
  nhl: ['player_points','player_shots_on_goal','player_total_saves']
};

export default async (req) => {
  if (req.method !== 'GET') return json(405, {error:'GET only'});
  const apiKey = Netlify.env.get('THE_ODDS_API_KEY');
  if (!apiKey) return json(503, {error:'THE_ODDS_API_KEY is not configured', demo:true});
  const urlIn = new URL(req.url);
  const league = (urlIn.searchParams.get('league') || 'nfl').toLowerCase();
  const sport = SPORT_KEYS[league] || league;
  const region = Netlify.env.get('ODDS_REGION') || 'us';
  const eventId = urlIn.searchParams.get('eventId');
  const includeProps = urlIn.searchParams.get('props') === '1';
  const base = 'https://api.the-odds-api.com/v4';
  const markets = [...(FEATURED_MARKETS[league] || ['h2h','spreads','totals'])];
  if (eventId && includeProps && PROP_MARKETS[league]) markets.push(...PROP_MARKETS[league]);
  const path = eventId ? `/sports/${encodeURIComponent(sport)}/events/${encodeURIComponent(eventId)}/odds` : `/sports/${encodeURIComponent(sport)}/odds`;
  const upstream = new URL(base + path);
  upstream.searchParams.set('apiKey', apiKey);
  upstream.searchParams.set('regions', region);
  upstream.searchParams.set('markets', markets.join(','));
  upstream.searchParams.set('oddsFormat', 'american');
  upstream.searchParams.set('dateFormat', 'iso');
  try {
    const resp = await fetch(upstream, {headers:{accept:'application/json'}});
    const body = await resp.json();
    if (!resp.ok) return json(resp.status, {error:body?.message || body?.error || 'Odds provider request failed'});
    return json(200, {data:body, quota:{remaining:resp.headers.get('x-requests-remaining'), used:resp.headers.get('x-requests-used'), last:resp.headers.get('x-requests-last')}});
  } catch (err) {
    return json(502, {error:'Unable to reach odds provider', detail:String(err?.message || err)});
  }
};

export const config = { path: '/api/odds' };

function json(status, body) {
  return new Response(JSON.stringify(body), {status, headers:{'content-type':'application/json','cache-control':'no-store'}});
}
