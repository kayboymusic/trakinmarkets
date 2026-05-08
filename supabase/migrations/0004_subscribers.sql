create table if not exists subscribers (
  chat_id bigint primary key,
  username text,
  joined_at timestamptz not null default now(),
  paused boolean not null default false
);
create index if not exists subscribers_paused_idx on subscribers(paused);
