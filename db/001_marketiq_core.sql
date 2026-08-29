-- MarketIQ Sports core research schema
-- Designed for Postgres/Supabase. Append-only market observations and frozen predictions.

create table if not exists canonical_events (
  id text primary key,
  sport text not null,
  league text not null,
  provider_event_ids jsonb not null default '{}'::jsonb,
  home_team text,
  away_team text,
  commence_time timestamptz not null,
  venue text,
  status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists odds_observations (
  id bigserial primary key,
  event_id text not null references canonical_events(id),
  sport text not null,
  league text not null,
  market text not null,
  selection text not null,
  sportsbook text not null,
  line numeric,
  american_odds integer,
  decimal_odds numeric,
  raw_implied_probability numeric,
  devig_probability numeric,
  source_timestamp timestamptz,
  observed_at timestamptz not null,
  ingested_at timestamptz not null default now(),
  latency_ms integer,
  time_to_start_seconds integer,
  availability_status text not null default 'unknown',
  snapshot_quality numeric,
  raw_source_id text,
  unique(event_id, market, selection, sportsbook, observed_at)
);
create index if not exists idx_odds_event_market_time on odds_observations(event_id, market, observed_at);
create index if not exists idx_odds_book_market_time on odds_observations(sportsbook, market, observed_at);

create table if not exists information_events (
  id bigserial primary key,
  event_id text references canonical_events(id),
  entity text not null,
  category text not null,
  previous_state text,
  new_state text,
  published_at timestamptz,
  detected_at timestamptz not null,
  source text,
  source_reliability numeric,
  market_relevance numeric,
  surprise_score numeric,
  raw_source_id text
);
create index if not exists idx_info_event_time on information_events(event_id, detected_at);

create table if not exists hypotheses (
  id bigserial primary key,
  name text not null,
  version integer not null default 1,
  hypothesis text not null,
  entry_condition jsonb not null,
  settlement_condition jsonb,
  sport text,
  league text,
  market text,
  evaluation_metric text not null,
  minimum_sample integer not null,
  status text not null default 'EXPLORATORY',
  preregistered_at timestamptz not null default now(),
  unique(name, version)
);

create table if not exists frozen_predictions (
  id uuid primary key,
  created_at timestamptz not null,
  event_id text not null references canonical_events(id),
  market_state_at timestamptz not null,
  model_version text not null,
  feature_version text not null,
  data_version text not null,
  sportsbook text,
  market text not null,
  selection text not null,
  line numeric,
  american_odds integer,
  consensus_probability numeric,
  market_prior numeric,
  marketiq_probability numeric,
  projected_close_probability numeric,
  next_move_prediction jsonb,
  signal_type text,
  signal_age_seconds integer,
  decision text not null check (decision in ('VALUE','INVESTIGATE','WAIT','PASS')),
  invalidation_condition text,
  hypothesis_id bigint references hypotheses(id),
  payload jsonb not null,
  frozen_hash text not null,
  unique(frozen_hash)
);

create table if not exists prediction_results (
  prediction_id uuid primary key references frozen_predictions(id),
  appended_at timestamptz not null default now(),
  closing_line numeric,
  closing_odds integer,
  closing_probability numeric,
  clv numeric,
  outcome text,
  settled_return numeric,
  brier_component numeric,
  log_loss_component numeric
);

create table if not exists model_versions (
  id text primary key,
  model_family text not null,
  feature_version text not null,
  data_cutoff timestamptz not null,
  created_at timestamptz not null default now(),
  notes text
);

-- Application rule: odds_observations and frozen_predictions are append-only.
-- Production should enforce this with database roles/RLS and write-only service procedures.
