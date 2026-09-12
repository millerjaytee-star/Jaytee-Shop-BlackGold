function asTime(value) {
  const ms = Date.parse(value || '');
  return Number.isFinite(ms) ? ms : null;
}

function clean(value = '') {
  return String(value ?? '').trim();
}

function numberOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function median(values = []) {
  const nums = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!nums.length) return null;
  const mid = Math.floor(nums.length / 2);
  return nums.length % 2 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
}

function observationKey(row = {}) {
  return [
    clean(row.event_id),
    clean(row.market),
    clean(row.selection),
    clean(row.sportsbook),
  ].join('|');
}

function changed(prev, curr) {
  const prevLine = numberOrNull(prev?.line);
  const currLine = numberOrNull(curr?.line);
  const prevOdds = numberOrNull(prev?.american_odds);
  const currOdds = numberOrNull(curr?.american_odds);
  return prevLine !== currLine || prevOdds !== currOdds;
}

export function detectPriceMoves(observations = []) {
  const groups = new Map();
  for (const row of observations) {
    if (!row || !clean(row.event_id) || !clean(row.market) || !clean(row.selection) || !clean(row.sportsbook)) continue;
    const observedMs = asTime(row.observed_at);
    if (observedMs === null) continue;
    const key = observationKey(row);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ ...row, _observedMs: observedMs });
  }

  const moves = [];
  for (const rows of groups.values()) {
    rows.sort((a, b) => a._observedMs - b._observedMs);
    for (let i = 1; i < rows.length; i += 1) {
      const prev = rows[i - 1];
      const curr = rows[i];
      if (!changed(prev, curr)) continue;
      const fromLine = numberOrNull(prev.line);
      const toLine = numberOrNull(curr.line);
      const fromOdds = numberOrNull(prev.american_odds);
      const toOdds = numberOrNull(curr.american_odds);
      moves.push({
        event_id: clean(curr.event_id),
        market: clean(curr.market),
        selection: clean(curr.selection),
        sportsbook: clean(curr.sportsbook),
        moved_at: curr.observed_at,
        from_line: fromLine,
        to_line: toLine,
        line_delta: fromLine !== null && toLine !== null ? Number((toLine - fromLine).toFixed(4)) : null,
        from_odds: fromOdds,
        to_odds: toOdds,
        odds_delta: fromOdds !== null && toOdds !== null ? toOdds - fromOdds : null,
        source_timestamp: curr.source_timestamp || null,
        ingested_at: curr.ingested_at || null,
        latency_ms: numberOrNull(curr.latency_ms),
      });
    }
  }

  return moves.sort((a, b) => asTime(a.moved_at) - asTime(b.moved_at));
}

export function alignInformationToMoves(informationEvents = [], priceMoves = [], options = {}) {
  const lookbackSeconds = Number.isFinite(options.lookbackSeconds) ? options.lookbackSeconds : 900;
  const lookaheadSeconds = Number.isFinite(options.lookaheadSeconds) ? options.lookaheadSeconds : 1800;
  const lookbackMs = Math.max(0, lookbackSeconds) * 1000;
  const lookaheadMs = Math.max(0, lookaheadSeconds) * 1000;

  return informationEvents.flatMap((info) => {
    const detectedMs = asTime(info?.detected_at);
    const eventId = clean(info?.event_id);
    if (detectedMs === null || !eventId) return [];

    const sameEvent = priceMoves.filter((move) => clean(move.event_id) === eventId && asTime(move.moved_at) !== null);
    const before = sameEvent.filter((move) => {
      const t = asTime(move.moved_at);
      return t >= detectedMs - lookbackMs && t < detectedMs;
    });
    const after = sameEvent.filter((move) => {
      const t = asTime(move.moved_at);
      return t >= detectedMs && t <= detectedMs + lookaheadMs;
    });

    const first = after[0] || null;
    const affectedBooks = [...new Set(after.map((move) => move.sportsbook).filter(Boolean))];
    const firstMs = first ? asTime(first.moved_at) : null;
    const lastMs = after.length ? asTime(after[after.length - 1].moved_at) : null;

    let temporal_status = 'NO_REACTION_OBSERVED';
    if (before.length && first) temporal_status = 'PREEXISTING_AND_POST_INFO_MOVEMENT';
    else if (before.length) temporal_status = 'PREEXISTING_MOVEMENT';
    else if (first) temporal_status = 'POST_INFO_MOVEMENT';

    return [{
      event_id: eventId,
      information_event_id: info.id ?? info.raw_source_id ?? null,
      category: clean(info.category) || 'other',
      source: info.source || null,
      published_at: info.published_at || null,
      detected_at: info.detected_at,
      source_reliability: numberOrNull(info.source_reliability),
      market_relevance: numberOrNull(info.market_relevance),
      temporal_status,
      preexisting_move_count: before.length,
      post_info_move_count: after.length,
      first_move_at: first?.moved_at || null,
      first_mover_book: first?.sportsbook || null,
      first_market: first?.market || null,
      first_selection: first?.selection || null,
      reaction_lag_seconds: firstMs === null ? null : Number(((firstMs - detectedMs) / 1000).toFixed(3)),
      affected_books: affectedBooks,
      affected_book_count: affectedBooks.length,
      propagation_span_seconds: firstMs === null || lastMs === null ? null : Number(((lastMs - firstMs) / 1000).toFixed(3)),
      causality_claimed: false,
    }];
  });
}

export function buildMarketClock({ informationEvents = [], oddsObservations = [] } = {}) {
  const priceMoves = detectPriceMoves(oddsObservations);
  const alignments = alignInformationToMoves(informationEvents, priceMoves);

  const timeline = [
    ...informationEvents.flatMap((row) => asTime(row?.detected_at) === null ? [] : [{
      type: 'INFORMATION',
      at: row.detected_at,
      event_id: row.event_id || null,
      category: row.category || 'other',
      source: row.source || null,
      title: row.title || null,
    }]),
    ...priceMoves.map((move) => ({
      type: 'PRICE_MOVE',
      at: move.moved_at,
      event_id: move.event_id,
      sportsbook: move.sportsbook,
      market: move.market,
      selection: move.selection,
      line_delta: move.line_delta,
      odds_delta: move.odds_delta,
    })),
  ].sort((a, b) => asTime(a.at) - asTime(b.at));

  const reactionLags = alignments.map((row) => row.reaction_lag_seconds).filter(Number.isFinite);
  const firstMoverCounts = {};
  for (const row of alignments) {
    if (row.first_mover_book) firstMoverCounts[row.first_mover_book] = (firstMoverCounts[row.first_mover_book] || 0) + 1;
  }
  const bookLeadership = Object.entries(firstMoverCounts)
    .map(([sportsbook, first_moves]) => ({ sportsbook, first_moves }))
    .sort((a, b) => b.first_moves - a.first_moves || a.sportsbook.localeCompare(b.sportsbook));

  return {
    methodology: 'Temporal alignment only. MarketIQ does not infer causality from timing alone.',
    summary: {
      information_events: informationEvents.length,
      price_moves: priceMoves.length,
      aligned_events: alignments.length,
      post_info_movements: alignments.filter((row) => row.first_move_at).length,
      events_with_preexisting_movement: alignments.filter((row) => row.preexisting_move_count > 0).length,
      median_reaction_lag_seconds: median(reactionLags),
    },
    book_leadership: bookLeadership,
    alignments,
    price_moves: priceMoves,
    timeline,
  };
}
