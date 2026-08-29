const $ = (s, root=document) => root.querySelector(s);

const audit = [
  ['Live schedule / scores','DONE','ESPN scoreboard relay','Live board is active'],
  ['Current sportsbook odds','BLOCKED','The Odds API','Needs THE_ODDS_API_KEY'],
  ['Canonical event identity','PARTIAL','App + new DB schema','Provider IDs still need reconciliation'],
  ['Timestamped multi-book history','SCHEMA READY','odds_observations','Persistent database not connected'],
  ['De-vig consensus','PARTIAL','logic.mjs','Basic normalization exists; power/Shin pending'],
  ['Open / current / close','SCHEMA READY','odds_observations','Recorder + close capture pending'],
  ['Movement velocity / acceleration','NOT LIVE','Historical snapshots','Needs recorder history'],
  ['Book leadership graph','NOT LIVE','Historical snapshots','Needs enough cross-book sequences'],
  ['Propagation half-life','NOT LIVE','Historical snapshots','Needs T0/T25/T50/T75/T90 history'],
  ['Information timeline','NOT LIVE','information_events','News/injury providers pending'],
  ['Projected closing line','NOT VALIDATED','Model interface planned','Needs historical train/validate/OOS data'],
  ['Cross-market graph','PARTIAL','Current market relationships','Historical convergence model pending'],
  ['Execution quality','PARTIAL','Quote age + availability','Stake/liquidity data limited by provider'],
  ['Proof Ledger','SCHEMA READY','frozen_predictions','Server-side immutable writer pending'],
  ['CLV / calibration','NOT LIVE','prediction_results','Requires frozen predictions + closes'],
  ['Flaw Finder','RESEARCH UI','Pre-registered hypotheses','Validation pipeline pending']
];

const hypotheses = [
  ['H1','Leader continuation','Fast synchronized movement from historically leading books predicts continued closing-line movement.'],
  ['H2','Reversal regime','Fast synchronized movement that quickly reverses predicts different subsequent behavior.'],
  ['H3','Availability surprise','Unexpected availability changes create larger/slower adjustment than expected confirmations.'],
  ['H4','Prop lag','Lagging related player markets converge toward information already reflected in major markets.'],
  ['H5','Weather surprise','Forecast surprise predicts totals movement better than absolute weather alone.'],
  ['H6','Book specialization','Different books systematically lead different sports and market categories.'],
  ['H7','Signal half-life','Move usefulness decays according to measurable sport-specific half-lives.'],
  ['H8','Close prediction','Projected closing price is more predictable than individual sports outcomes.'],
  ['H9','Market as prior','Market-prior models outperform sports-only models in calibration.'],
  ['H10','Execution drag','Theoretical EV falls materially after latency and actual price availability are included.']
];

export function initResearchCockpit(){
  renderAudit();
  renderHypotheses();
  renderProofLedger();
  wireResearchNav();
}

function renderAudit(){
  const el = $('#system-audit');
  if(!el) return;
  el.innerHTML = audit.map(([feature,status,source,missing]) => `<article class="audit-row"><div><b>${feature}</b><small>${source}</small></div><span class="sys-status ${slug(status)}">${status}</span><p>${missing}</p></article>`).join('');
}

function renderHypotheses(){
  const el = $('#hypothesis-grid');
  if(!el) return;
  el.innerHTML = hypotheses.map(([id,title,text]) => `<article class="hypothesis-card"><div class="opp-top"><span class="badge neutral">${id}</span><span class="sys-status exploratory">EXPLORATORY</span></div><h4>${title}</h4><p>${text}</p><small>Not validated. Attempt to falsify before promotion.</small></article>`).join('');
}

function renderProofLedger(){
  const el = $('#proof-ledger');
  if(!el) return;
  const local = JSON.parse(localStorage.getItem('marketiq_local_ledger') || '[]');
  el.innerHTML = `<div class="proof-metrics"><div><strong>${local.length}</strong><span>LOCAL TEST SNAPSHOTS</span></div><div><strong>—</strong><span>AVERAGE CLV</span></div><div><strong>—</strong><span>BRIER SCORE</span></div><div><strong>—</strong><span>AFTER-VIG ROI</span></div></div><p class="muted-copy">The production Proof Ledger is not active until server-side persistence is connected. Local test snapshots are convenience records only and are <b>not</b> considered immutable research evidence.</p>`;
}

function wireResearchNav(){
  document.querySelectorAll('[data-jump]').forEach(btn => btn.addEventListener('click',()=> document.querySelector(btn.dataset.jump)?.scrollIntoView({behavior:'smooth',block:'start'})));
}

function slug(s){return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
