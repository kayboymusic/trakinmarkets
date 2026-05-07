create extension if not exists pg_trgm;

create table if not exists markets (
  id text primary key,
  platform text not null check (platform in ('polymarket','bayse')),
  native_id text not null,
  title text not null,
  url text not null,
  category text,
  liquidity numeric,
  volume numeric,
  probability numeric,
  closes_at timestamptz,
  updated_at timestamptz not null default now()
);
create index if not exists markets_platform_idx on markets(platform);
create index if not exists markets_updated_idx on markets(updated_at desc);
create index if not exists markets_title_trgm_idx on markets using gin (title gin_trgm_ops);

create table if not exists snapshots (
  market_id text references markets(id) on delete cascade,
  ts timestamptz not null,
  probability numeric not null,
  volume numeric,
  primary key (market_id, ts)
);
create index if not exists snapshots_ts_idx on snapshots(ts desc);

create table if not exists moves (
  id bigserial primary key,
  market_id text references markets(id) on delete cascade,
  time_window text not null check (time_window in ('15m','1h','4h')),
  prob_from numeric not null,
  prob_to numeric not null,
  delta numeric not null,
  score numeric not null,
  detected_at timestamptz not null default now()
);
create index if not exists moves_window_score_idx on moves(time_window, score desc);
create index if not exists moves_detected_idx on moves(detected_at desc);
create index if not exists moves_market_window_detected_idx on moves(market_id, time_window, detected_at desc);
