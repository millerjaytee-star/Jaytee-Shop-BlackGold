const SPORT_KEYS = {
  nfl: 'americanfootball_nfl',
  'nfl preseason': 'americanfootball_nfl_preseason',
  ncaaf: 'americanfootball_ncaaf',
  nba: 'basketball_nba',
  ncaab: 'basketball_ncaab',
  mlb: 'baseball_mlb',
  nhl: 'icehockey_nhl'
};

const PROP_MARKETS = {
  nfl: ['player_pass_yds','player_pass_tds','player_rush_yds','player_reception_yds','player_receptions'],
  nba: ['player_points','player_rebounds','player_assists','player_threes'],
  mlb: ['batter_hits','batter_total_bases','pitcher_strikeouts'],
  nhl: ['player_points','player_shots_on_goal']
};

export async function handler(event) {
  if (event.httpMethod !== 'GET') return json(405, {error:'GET only'});
  const apiKey = process.env.THE_ODDS_API_KEY;
  if (!apiKey) return json(503, {error:'THE_ODDS_API_KEY is not configured', demo:true});
  const league = (event.queryStringParameters?.league || 'nfl').toLowerCase();
  const sport = SPORT_KEYS[league] || league;
  const region = process.env.ODDS_REGION || 'us';
  const eventId = event.queryStringParameters?.eventId;
  const includeProps = event.queryStringParameters?.props === '1';
  const base = 'https://api.the-odds-api.com/v4';
  let url;
  if (eventId) {
    const markets = ['h2h','spreads','totals'];
    if (includeProps && PROP_MARKETS[league]) markets.push(...PROP_MARKETS[league]);
    url = `${base}/sports/${encodeURIComponent(sport)}/events/${encodeURIComponent(eventId)}/odds?apiKey=${encodeURIComponent(apiKey)}&regions=${encodeURIComponent(region)}&markets=${encodeURIComponent(markets.join(','))}&oddsFormat=american&dateFormat=iso`;
  } else {
    url = `${base}/sports/${encodeURIComponent(sport)}/odds?apiKey=${encodeURIComponent(apiKey)}&regions=${encodeURIComponent(region)}&markets=h2h,spreads,totals&oddsFormat=american&dateFormat=iso`;
  }
  try {
    const resp = await fetch(url, {headers:{accept:'application/json'}});
    const body = await resp.json();
    if (!resp.ok) return json(resp.status, {error:body?.message || body?.error || 'Odds provider request failed'});
    return json(200, {data:body, quota:{remaining:resp.headers.get('x-requests-remaining'), used:resp.headers.get('x-requests-used'), last:resp.headers.get('x-requests-last')}});
  } catch (err) {
    return json(502, {error:'Unable to reach odds provider', detail:String(err?.message || err)});
  }
}

function json(statusCode, body) {
  return {statusCode, headers:{'content-type':'application/json','cache-control':'no-store'}, body:JSON.stringify(body)};
}
