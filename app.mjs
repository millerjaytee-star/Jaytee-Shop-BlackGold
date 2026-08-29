import { analyzeEvent, buildParlayCandidates, matchGame } from './logic.mjs';
import { sampleEvents } from './sample-data.mjs';

const $ = s => document.querySelector(s);
const state = {events: sampleEvents, live:false, quota:null};
const form = $('#game-form');
const queryEl = $('#game-query');
const leagueEl = $('#league');
const propsEl = $('#include-props');
const results = $('#results');
const status = $('#status');
const gameList = $('#game-list');

form.addEventListener('submit', async e => {
  e.preventDefault();
  await loadAndAnalyze();
});
$('#demo-btn').addEventListener('click', () => { state.events = sampleEvents; state.live=false; renderGames(sampleEvents); analyze(sampleEvents[0]); });

async function loadAndAnalyze() {
  setStatus('Loading current market prices…');
  try {
    const r = await fetch(`/api/odds?league=${encodeURIComponent(leagueEl.value)}`);
    const body = await r.json();
    if (!r.ok) throw new Error(body.error || 'Live odds unavailable');
    state.events = Array.isArray(body.data) ? body.data : [body.data];
    state.live = true; state.quota = body.quota;
    const matches = matchGame(state.events, queryEl.value);
    renderGames(matches);
    if (matches[0]) await analyze(matches[0], true);
    else setStatus('No matching upcoming game found. Try one team name.', true);
  } catch (err) {
    state.live=false;
    setStatus(`${err.message}. Showing demo data until an API key is configured.`, true);
    renderGames(sampleEvents);
    analyze(sampleEvents[0]);
  }
}

async function analyze(event, maybeLoadProps=false) {
  let game = event;
  if (maybeLoadProps && propsEl.checked && event.id) {
    try {
      const r = await fetch(`/api/odds?league=${encodeURIComponent(leagueEl.value)}&eventId=${encodeURIComponent(event.id)}&props=1`);
      const b = await r.json();
      if (r.ok && b.data) game = b.data;
    } catch {}
  }
  const opps = analyzeEvent(game);
  const parlays = buildParlayCandidates(opps, 3);
  renderAnalysis(game, opps, parlays);
  setStatus(state.live ? `Live market loaded${state.quota?.remaining ? ` · API credits remaining: ${state.quota.remaining}` : ''}` : 'Demo market analysis');
}

function renderGames(events) {
  gameList.innerHTML='';
  for (const event of events.slice(0,12)) {
    const b=document.createElement('button');
    b.type='button'; b.className='game-chip';
    b.textContent=`${event.away_team} @ ${event.home_team}`;
    b.addEventListener('click',()=>analyze(event,state.live));
    gameList.appendChild(b);
  }
}

function renderAnalysis(game, opps, parlays) {
  const top = opps.slice(0,10);
  const time = new Date(game.commence_time).toLocaleString();
  results.innerHTML = `
    <section class="hero-card">
      <div><span class="eyebrow">MARKET X-RAY · ${escapeHtml(game.sport_title || '')}</span><h2>${escapeHtml(game.away_team)} <span>@</span> ${escapeHtml(game.home_team)}</h2><p>${escapeHtml(time)}</p></div>
      <div class="summary"><strong>${top.filter(x=>x.status==='VALUE').length}</strong><span>VALUE</span><strong>${top.filter(x=>x.status==='INVESTIGATE').length}</strong><span>INVESTIGATE</span></div>
    </section>
    <section><div class="section-head"><h3>Best current opportunities</h3><p>Ranked from cross-book pricing, consensus-implied probability, freshness and market depth. Not a guarantee.</p></div>
      <div class="opps">${top.length ? top.map(card).join('') : '<div class="empty">Not enough comparable book prices to score this game.</div>'}</div>
    </section>
    <section><div class="section-head"><h3>Parlay lab</h3><p>These are candidate leg combinations only. Same-game correlations and the actual sportsbook parlay quote must be modeled before calling a parlay +EV.</p></div>
      <div class="parlays">${parlays.length ? parlays.map(parlayCard).join('') : '<div class="empty">No parlay candidates clear the current leg-quality filter.</div>'}</div>
    </section>
    <section class="method"><h3>Decision rules</h3><div class="method-grid"><div><b>VALUE</b><span>Estimated price edge ≥3.5%, fresh quote, 3+ books.</span></div><div><b>INVESTIGATE</b><span>Estimated edge ≥1.5% with acceptable freshness.</span></div><div><b>WATCH</b><span>Small edge; not enough evidence yet.</span></div><div><b>PASS</b><span>Price/evidence does not justify action.</span></div></div></section>`;
}

function card(o){
  const point = o.point == null ? '' : ` ${o.point>0?'+':''}${o.point}`;
  return `<article class="opp ${o.status.toLowerCase()}"><div class="opp-top"><span class="badge">${o.status}</span><span class="score">${o.score.toFixed(0)}/100</span></div><h4>${marketName(o.market)} · ${escapeHtml(o.selection)}${point}</h4><div class="price"><strong>${fmtOdds(o.price)}</strong><span>${escapeHtml(o.book)}</span></div><dl><div><dt>Consensus fair</dt><dd>${pct(o.fairProbability)}</dd></div><div><dt>Est. price edge</dt><dd>${signedPct(o.estimatedEdge)}</dd></div><div><dt>Books compared</dt><dd>${o.books}</dd></div><div><dt>Freshness</dt><dd>${pct(o.freshness)}</dd></div></dl><p>${escapeHtml(o.reason)}</p><small>Invalidation: if the best available price deteriorates enough to erase the estimated edge, PASS.</small></article>`;
}
function parlayCard(p){return `<article class="parlay"><div><span class="badge neutral">${p.status}</span><span class="score">Leg quality ${p.score.toFixed(0)}</span></div><ol>${p.legs.map(l=>`<li>${marketName(l.market)} · ${escapeHtml(l.selection)}${l.point==null?'':` ${l.point>0?'+':''}${l.point}`} @ ${fmtOdds(l.price)}</li>`).join('')}</ol><p>Correlation: ${p.correlation}. Get the actual parlay price from the book before judging value.</p></article>`}
function marketName(k){return ({h2h:'Moneyline',spreads:'Spread',totals:'Total',player_points:'Points',player_rebounds:'Rebounds',player_assists:'Assists',player_threes:'3-Pointers',player_pass_yds:'Pass Yards',player_rush_yds:'Rush Yards',player_reception_yds:'Receiving Yards'}[k]||k.replaceAll('_',' '));}
function pct(n){return Number.isFinite(n)?`${(n*100).toFixed(1)}%`:'—'}
function signedPct(n){return Number.isFinite(n)?`${n>=0?'+':''}${(n*100).toFixed(1)}%`:'—'}
function fmtOdds(n){return Number(n)>0?`+${n}`:`${n}`}
function escapeHtml(s){return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function setStatus(msg,err=false){status.textContent=msg;status.classList.toggle('error',err)}

renderGames(sampleEvents); analyze(sampleEvents[0]);
