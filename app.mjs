import { analyzeEvent, buildParlayCandidates, matchGame } from './logic.mjs';
import { sampleEvents } from './sample-data.mjs';

const $ = s => document.querySelector(s);
const state = {events: sampleEvents, live:false, quota:null};
const form = $('#game-form');
const queryEl = $('#game-query');
const leagueEl = $('#league');
const propsEl = $('#include-props');
const parlayLegsEl = $('#parlay-legs');
const results = $('#results');
const status = $('#status');
const gameList = $('#game-list');

form.addEventListener('submit', async e => { e.preventDefault(); await loadAndAnalyze(); });
$('#demo-btn').addEventListener('click', () => { state.events = sampleEvents; state.live=false; renderGames(sampleEvents); analyze(sampleEvents[0]); });

async function loadAndAnalyze() {
  setStatus('Checking current market prices…');
  try {
    const r = await fetch(`/api/odds?league=${encodeURIComponent(leagueEl.value)}`);
    const body = await r.json();
    if (!r.ok) throw new Error(body.error || 'Live odds unavailable');
    state.events = Array.isArray(body.data) ? body.data : [body.data];
    state.live = true; state.quota = body.quota;
    const q = queryEl.value.trim();
    const matches = q ? matchGame(state.events, q) : state.events;
    renderGames(matches);
    if (matches[0]) await analyze(matches[0], true);
    else setStatus('No matching upcoming event found. Try one team or fighter name.', true);
  } catch (err) {
    state.live=false;
    setStatus(`${err.message}. Demo mode is active until the live API key is configured.`, true);
    renderGames(sampleEvents);
    analyze(sampleEvents[0]);
  }
}

async function analyze(event, maybeLoadProps=false) {
  let game = event;
  if (maybeLoadProps && propsEl.checked && event.id && leagueEl.value !== 'mma') {
    setStatus('Loading event props only for this matchup…');
    try {
      const r = await fetch(`/api/odds?league=${encodeURIComponent(leagueEl.value)}&eventId=${encodeURIComponent(event.id)}&props=1`);
      const b = await r.json();
      if (r.ok && b.data) { game = b.data; state.quota = b.quota || state.quota; }
    } catch {}
  }
  const opps = analyzeEvent(game);
  const desiredLegs = Number(parlayLegsEl.value || 3);
  const parlays = buildParlayCandidates(opps, Math.min(desiredLegs, 3));
  renderAnalysis(game, opps, parlays, desiredLegs);
  const quotaText = state.quota?.remaining != null ? ` · API credits remaining: ${state.quota.remaining}` : '';
  setStatus(state.live ? `Live market loaded${quotaText}` : 'Demo market analysis');
}

function renderGames(events) {
  gameList.innerHTML='';
  for (const event of events.slice(0,14)) {
    const b=document.createElement('button');
    b.type='button'; b.className='game-chip';
    b.textContent=`${event.away_team} vs ${event.home_team}`;
    b.addEventListener('click',()=>analyze(event,state.live));
    gameList.appendChild(b);
  }
}

function renderAnalysis(game, opps, parlays, desiredLegs) {
  const top = opps.slice(0,10);
  const time = new Date(game.commence_time).toLocaleString();
  const actionable = top.filter(x=>['VALUE','INVESTIGATE'].includes(x.status));
  const best = actionable[0];
  results.innerHTML = `
    <section class="hero-card">
      <div><span class="eyebrow">MARKET X-RAY · ${escapeHtml(game.sport_title || '')}</span><h2>${escapeHtml(game.away_team)} <span>vs</span> ${escapeHtml(game.home_team)}</h2><p>${escapeHtml(time)}</p></div>
      <div class="summary"><strong>${top.filter(x=>x.status==='VALUE').length}</strong><span>VALUE</span><strong>${top.filter(x=>x.status==='INVESTIGATE').length}</strong><span>INVESTIGATE</span></div>
    </section>
    <section class="decision-banner ${best ? 'go' : 'pass'}"><div><span class="eyebrow">MARKETIQ READ</span><h3>${best ? `Best evidence: ${marketName(best.market)} · ${escapeHtml(best.selection)}` : 'No strong edge found right now'}</h3><p>${best ? `Best listed price ${fmtOdds(best.price)} at ${escapeHtml(best.book)} · estimated price edge ${signedPct(best.estimatedEdge)}.` : 'The correct move can be WAIT or PASS. Do not force a bet because an event is available.'}</p></div><div class="decision-score">${best ? Math.round(best.score) : 'PASS'}<small>${best ? '/100 evidence score' : 'no forced action'}</small></div></section>
    <section><div class="section-head"><h3>Best current opportunities</h3><p>Ranked using cross-book pricing, consensus probability, freshness and market depth. A high score is evidence quality—not a guaranteed win percentage.</p></div>
      <div class="opps">${top.length ? top.map(card).join('') : '<div class="empty">Not enough comparable book prices to score this event.</div>'}</div>
    </section>
    <section><div class="section-head"><h3>Parlay Lab · requested ${desiredLegs} legs</h3><p>${desiredLegs>3 ? 'Current MVP only validates up to 3 candidate legs while the correlation engine is being built. ' : ''}Candidate parlays require the actual sportsbook combined quote before value can be judged.</p></div>
      <div class="parlays">${parlays.length ? parlays.map(parlayCard).join('') : '<div class="empty">No parlay candidates clear the current leg-quality filter. PASS rather than force weak legs.</div>'}</div>
    </section>
    <section class="method"><h3>How to read MarketIQ</h3><div class="method-grid"><div><b>VALUE</b><span>Strongest current pricing evidence. Still not a guarantee.</span></div><div><b>INVESTIGATE</b><span>Possible edge, but more confirmation is needed.</span></div><div><b>WAIT</b><span>Signal may improve with a better price or more information.</span></div><div><b>PASS</b><span>Evidence or price does not justify action.</span></div></div></section>`;
}

function card(o){
  const point = o.point == null ? '' : ` ${o.point>0?'+':''}${o.point}`;
  return `<article class="opp ${o.status.toLowerCase()}"><div class="opp-top"><span class="badge">${o.status}</span><span class="score">Evidence ${o.score.toFixed(0)}/100</span></div><h4>${marketName(o.market)} · ${escapeHtml(o.selection)}${point}</h4><div class="price"><strong>${fmtOdds(o.price)}</strong><span>${escapeHtml(o.book)}</span></div><dl><div><dt>Market consensus</dt><dd>${pct(o.fairProbability)}</dd></div><div><dt>Est. price edge</dt><dd>${signedPct(o.estimatedEdge)}</dd></div><div><dt>Books compared</dt><dd>${o.books}</dd></div><div><dt>Freshness</dt><dd>${pct(o.freshness)}</dd></div></dl><p>${escapeHtml(o.reason)}</p><small>Invalidation: if the best price worsens enough to erase the estimated edge, PASS.</small></article>`;
}
function parlayCard(p){return `<article class="parlay"><div><span class="badge neutral">${p.status}</span><span class="score">Leg quality ${p.score.toFixed(0)}</span></div><ol>${p.legs.map(l=>`<li>${marketName(l.market)} · ${escapeHtml(l.selection)}${l.point==null?'':` ${l.point>0?'+':''}${l.point}`} @ ${fmtOdds(l.price)} <span>${escapeHtml(l.book||'')}</span></li>`).join('')}</ol><p><b>Correlation:</b> ${escapeHtml(p.correlation)}. Enter/check the actual combined sportsbook quote before judging this parlay as value.</p></article>`}
function marketName(k){return ({h2h:'Moneyline / Fight Winner',spreads:'Spread',totals:'Total / Rounds',player_points:'Points',player_rebounds:'Rebounds',player_assists:'Assists',player_threes:'3-Pointers',player_pass_yds:'Pass Yards',player_pass_tds:'Pass TDs',player_rush_yds:'Rush Yards',player_reception_yds:'Receiving Yards',player_receptions:'Receptions',batter_hits:'Hits',batter_total_bases:'Total Bases',pitcher_strikeouts:'Pitcher Ks',player_shots_on_goal:'Shots on Goal',player_total_saves:'Saves'}[k]||k.replaceAll('_',' '));}
function pct(n){return Number.isFinite(n)?`${(n*100).toFixed(1)}%`:'—'}
function signedPct(n){return Number.isFinite(n)?`${n>=0?'+':''}${(n*100).toFixed(1)}%`:'—'}
function fmtOdds(n){return Number(n)>0?`+${n}`:`${n}`}
function escapeHtml(s){return String(s??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function setStatus(msg,err=false){status.textContent=msg;status.classList.toggle('error',err)}

renderGames(sampleEvents); analyze(sampleEvents[0]);
