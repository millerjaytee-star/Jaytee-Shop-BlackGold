export function americanToDecimal(odds) {
  const n = Number(odds);
  if (!Number.isFinite(n) || n === 0) return null;
  return n > 0 ? 1 + n / 100 : 1 + 100 / Math.abs(n);
}

export function impliedProbability(odds) {
  const d = americanToDecimal(odds);
  return d ? 1 / d : null;
}

export function decimalToAmerican(decimal) {
  const d = Number(decimal);
  if (!Number.isFinite(d) || d <= 1) return null;
  return d >= 2 ? Math.round((d - 1) * 100) : Math.round(-100 / (d - 1));
}

export function normalizedConsensusProbability(rows) {
  const probs = rows.map(r => impliedProbability(r.price)).filter(Number.isFinite);
  if (!probs.length) return null;
  probs.sort((a, b) => a - b);
  const mid = Math.floor(probs.length / 2);
  return probs.length % 2 ? probs[mid] : (probs[mid - 1] + probs[mid]) / 2;
}

export function devigTwoWay(aPrice, bPrice) {
  const a = impliedProbability(aPrice);
  const b = impliedProbability(bPrice);
  if (!a || !b) return null;
  const sum = a + b;
  return { a: a / sum, b: b / sum, hold: sum - 1 };
}

export function evPerDollar(fairProbability, americanOdds) {
  const d = americanToDecimal(americanOdds);
  if (!d || !Number.isFinite(fairProbability)) return null;
  return fairProbability * d - 1;
}

export function freshnessWeight(lastUpdate, now = Date.now()) {
  const t = Date.parse(lastUpdate || '');
  if (!Number.isFinite(t)) return 0.55;
  const mins = Math.max(0, (now - t) / 60000);
  if (mins <= 2) return 1;
  if (mins <= 10) return 0.92;
  if (mins <= 30) return 0.78;
  if (mins <= 60) return 0.62;
  return 0.4;
}

function marketId(market, outcome) {
  return [market.key, outcome.name, outcome.point ?? ''].join('|');
}

export function flattenEvent(event) {
  const rows = [];
  for (const book of event.bookmakers || []) {
    for (const market of book.markets || []) {
      for (const outcome of market.outcomes || []) {
        rows.push({
          eventId: event.id,
          sport: event.sport_title,
          home: event.home_team,
          away: event.away_team,
          commenceTime: event.commence_time,
          bookKey: book.key,
          book: book.title,
          lastUpdate: book.last_update,
          market: market.key,
          selection: outcome.name,
          point: outcome.point ?? null,
          price: outcome.price,
          key: marketId(market, outcome)
        });
      }
    }
  }
  return rows;
}

export function analyzeEvent(event, now = Date.now()) {
  const rows = flattenEvent(event);
  const groups = new Map();
  for (const row of rows) {
    if (!groups.has(row.key)) groups.set(row.key, []);
    groups.get(row.key).push(row);
  }

  const opportunities = [];
  for (const [key, offers] of groups) {
    if (offers.length < 2) continue;
    const best = offers.reduce((a, b) => americanToDecimal(b.price) > americanToDecimal(a.price) ? b : a);
    const otherOffers = offers.filter(o => o.bookKey !== best.bookKey);
    const fair = normalizedConsensusProbability(otherOffers.length >= 2 ? otherOffers : offers);
    if (!fair) continue;
    const ev = evPerDollar(fair, best.price);
    const implieds = offers.map(o => impliedProbability(o.price)).filter(Number.isFinite);
    const dispersion = Math.max(...implieds) - Math.min(...implieds);
    const fresh = freshnessWeight(best.lastUpdate, now);
    const marketDepth = Math.min(1, offers.length / 6);
    const score = Math.max(0, Math.min(100,
      50 + (ev * 420) + (dispersion * 80) + ((fresh - 0.5) * 18) + ((marketDepth - 0.5) * 8)
    ));
    let status = 'PASS';
    if (ev >= 0.035 && fresh >= 0.75 && offers.length >= 3) status = 'VALUE';
    else if (ev >= 0.015 && fresh >= 0.6) status = 'INVESTIGATE';
    else if (ev >= 0.005) status = 'WATCH';
    opportunities.push({
      id: key,
      market: best.market,
      selection: best.selection,
      point: best.point,
      book: best.book,
      price: best.price,
      fairProbability: fair,
      bestImplied: impliedProbability(best.price),
      estimatedEdge: ev,
      dispersion,
      freshness: fresh,
      books: offers.length,
      score,
      status,
      lastUpdate: best.lastUpdate,
      reason: explain({ev, fresh, offers: offers.length, dispersion, status})
    });
  }
  return opportunities.sort((a,b)=>b.score-a.score);
}

function explain({ev, fresh, offers, dispersion, status}) {
  const bits = [];
  if (ev > 0.02) bits.push(`best price is ${(ev*100).toFixed(1)}% above the consensus-implied fair estimate`);
  else if (ev > 0) bits.push('best price is modestly better than consensus');
  else bits.push('no measurable price edge versus consensus');
  if (offers >= 5) bits.push(`${offers} books contribute to the comparison`);
  if (dispersion > 0.04) bits.push('book disagreement is elevated');
  if (fresh < 0.6) bits.push('quote freshness is weak');
  if (status === 'PASS') bits.push('does not clear current value/freshness thresholds');
  return bits.join('; ') + '.';
}

export function buildParlayCandidates(opportunities, maxLegs = 3) {
  const eligible = opportunities.filter(o => ['VALUE','INVESTIGATE'].includes(o.status) && o.estimatedEdge > 0);
  const combos = [];
  for (let i=0; i<eligible.length; i++) {
    for (let j=i+1; j<eligible.length; j++) {
      const a = eligible[i], b = eligible[j];
      if (a.market === b.market && a.selection === b.selection && a.point === b.point) continue;
      const legs = [a,b];
      const base = Math.min(a.score,b.score) + (a.score+b.score)/20;
      combos.push({legs, score: Math.min(100, base), correlation: 'UNKNOWN', status: 'QUOTE REQUIRED'});
      if (maxLegs >= 3) {
        for (let k=j+1; k<eligible.length; k++) {
          const c = eligible[k];
          combos.push({legs:[a,b,c], score: Math.min(100, Math.min(a.score,b.score,c.score)+(a.score+b.score+c.score)/30), correlation:'UNKNOWN', status:'QUOTE REQUIRED'});
        }
      }
    }
  }
  return combos.sort((a,b)=>b.score-a.score).slice(0,5);
}

export function matchGame(events, query) {
  const q = String(query || '').toLowerCase().trim();
  if (!q) return events;
  return events.filter(e => `${e.away_team} ${e.home_team}`.toLowerCase().includes(q) ||
    q.split(/\s+/).every(token => `${e.away_team} ${e.home_team}`.toLowerCase().includes(token)));
}
