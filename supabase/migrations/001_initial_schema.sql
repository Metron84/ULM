-- Ultimate League Manager - Initial production schema
-- Safe to run repeatedly in development environments.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'assistant_persona_enum') then
    create type assistant_persona_enum as enum ('analyst', 'diehard_fan', 'fantasy_veteran');
  end if;

  if not exists (select 1 from pg_type where typname = 'competition_type_enum') then
    create type competition_type_enum as enum ('main_season', 'tournament');
  end if;

  if not exists (select 1 from pg_type where typname = 'competition_status_enum') then
    create type competition_status_enum as enum ('upcoming', 'active', 'completed', 'archived');
  end if;

  if not exists (select 1 from pg_type where typname = 'player_position_enum') then
    create type player_position_enum as enum ('GK', 'DEF', 'MID', 'FWD');
  end if;

  if not exists (select 1 from pg_type where typname = 'fixture_status_enum') then
    create type fixture_status_enum as enum ('scheduled', 'live', 'finished');
  end if;

  if not exists (select 1 from pg_type where typname = 'league_mode_enum') then
    create type league_mode_enum as enum ('draft', 'open_selection');
  end if;

  if not exists (select 1 from pg_type where typname = 'league_type_enum') then
    create type league_type_enum as enum ('private', 'public');
  end if;

  if not exists (select 1 from pg_type where typname = 'assistant_function_type_enum') then
    create type assistant_function_type_enum as enum (
      'draft_advisor',
      'captain_recommender',
      'transfer_suggestion',
      'post_match_review',
      'roster_health',
      'quick_chat_generic'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'trade_status_enum') then
    create type trade_status_enum as enum (
      'proposed',
      'accepted',
      'rejected',
      'commissioner_pending',
      'completed'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'trade_item_type_enum') then
    create type trade_item_type_enum as enum ('player', 'captaincy_right', 'physical_item');
  end if;

  if not exists (select 1 from pg_type where typname = 'trade_item_direction_enum') then
    create type trade_item_direction_enum as enum ('offering', 'requesting');
  end if;
end $$;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  display_name text not null,
  avatar_url text,
  assistant_persona assistant_persona_enum not null default 'analyst',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.competitions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type competition_type_enum not null,
  start_date date not null,
  end_date date not null,
  status competition_status_enum not null default 'upcoming',
  roster_size_min int not null check (roster_size_min > 0),
  roster_size_max int not null check (roster_size_max >= roster_size_min),
  scoring_rules jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, type, start_date)
);

create table if not exists public.real_teams (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  name text not null,
  short_name text not null,
  logo_url text,
  league_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (competition_id, name)
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  real_team_id uuid references public.real_teams(id) on delete set null,
  name text not null,
  position player_position_enum not null,
  nationality text,
  photo_url text,
  sofascore_id text,
  current_club text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (competition_id, name)
);

create table if not exists public.fixtures (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  home_team_id uuid not null references public.real_teams(id) on delete cascade,
  away_team_id uuid not null references public.real_teams(id) on delete cascade,
  match_date timestamptz not null,
  status fixture_status_enum not null default 'scheduled',
  score_home int check (score_home is null or score_home >= 0),
  score_away int check (score_away is null or score_away >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (home_team_id <> away_team_id),
  unique (competition_id, home_team_id, away_team_id, match_date)
);

create table if not exists public.leagues (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  name text not null,
  mode league_mode_enum not null,
  type league_type_enum not null,
  commissioner_id uuid not null references public.users(id) on delete restrict,
  max_teams int not null check (max_teams > 1),
  invite_code text not null unique,
  allow_physical_trades boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (competition_id, name)
);

create table if not exists public.league_participants (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  team_name text not null,
  rank int,
  total_points int not null default 0,
  draft_order int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (league_id, user_id)
);

create table if not exists public.rosters (
  id uuid primary key default gen_random_uuid(),
  league_participant_id uuid not null references public.league_participants(id) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.roster_players (
  roster_id uuid not null references public.rosters(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  is_starting boolean not null default false,
  captain boolean not null default false,
  vice_captain boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (roster_id, player_id),
  check (not (captain and vice_captain))
);

create table if not exists public.player_performances (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  fixture_id uuid not null references public.fixtures(id) on delete cascade,
  goals int not null default 0 check (goals >= 0),
  assists int not null default 0 check (assists >= 0),
  sofascore_rating numeric(4,2),
  bonus_points int not null default 0,
  total_points int not null default 0,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (player_id, fixture_id)
);

create table if not exists public.assistant_templates (
  id uuid primary key default gen_random_uuid(),
  persona assistant_persona_enum not null,
  function_type assistant_function_type_enum not null,
  template_text text not null,
  variation_number int not null check (variation_number between 1 and 6),
  created_at timestamptz not null default now(),
  unique (persona, function_type, variation_number)
);

create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete cascade,
  league_participant_id uuid not null references public.league_participants(id) on delete cascade,
  fixture_id uuid not null references public.fixtures(id) on delete cascade,
  predicted_home_score int not null check (predicted_home_score >= 0),
  predicted_away_score int not null check (predicted_away_score >= 0),
  predicted_scorer_id uuid references public.players(id) on delete set null,
  is_no_scorer boolean not null default false,
  submitted_at timestamptz not null default now(),
  points_awarded int not null default 0,
  created_at timestamptz not null default now(),
  unique (league_participant_id, fixture_id),
  check (not (is_no_scorer and predicted_scorer_id is not null))
);

create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete cascade,
  proposer_id uuid not null references public.users(id) on delete cascade,
  receiver_id uuid not null references public.users(id) on delete cascade,
  status trade_status_enum not null default 'proposed',
  commissioner_id uuid references public.users(id) on delete set null,
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (proposer_id <> receiver_id)
);

create table if not exists public.trade_items (
  id uuid primary key default gen_random_uuid(),
  trade_id uuid not null references public.trades(id) on delete cascade,
  item_type trade_item_type_enum not null,
  player_id uuid references public.players(id) on delete set null,
  description text,
  direction trade_item_direction_enum not null,
  created_at timestamptz not null default now(),
  check (
    (item_type = 'player' and player_id is not null)
    or (item_type <> 'player')
  )
);

create table if not exists public.prediction_standings (
  league_id uuid not null references public.leagues(id) on delete cascade,
  week_number int not null check (week_number > 0),
  league_participant_id uuid not null references public.league_participants(id) on delete cascade,
  total_prediction_points int not null default 0,
  rank int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (league_id, week_number, league_participant_id)
);

-- Indexes
create index if not exists idx_users_email on public.users (email);
create index if not exists idx_competitions_status on public.competitions (status);
create index if not exists idx_real_teams_competition on public.real_teams (competition_id);
create index if not exists idx_players_competition on public.players (competition_id);
create index if not exists idx_players_real_team on public.players (real_team_id);
create index if not exists idx_players_position on public.players (position);
create index if not exists idx_fixtures_competition_date on public.fixtures (competition_id, match_date);
create index if not exists idx_fixtures_status on public.fixtures (status);
create index if not exists idx_leagues_competition on public.leagues (competition_id);
create index if not exists idx_leagues_commissioner on public.leagues (commissioner_id);
create index if not exists idx_league_participants_league on public.league_participants (league_id);
create index if not exists idx_rosters_participant_active on public.rosters (league_participant_id, is_active);
create index if not exists idx_roster_players_player on public.roster_players (player_id);
create index if not exists idx_roster_players_starting on public.roster_players (roster_id, is_starting);
create index if not exists idx_player_performances_fixture on public.player_performances (fixture_id);
create index if not exists idx_player_performances_player on public.player_performances (player_id);
create index if not exists idx_assistant_templates_lookup on public.assistant_templates (persona, function_type, variation_number);
create index if not exists idx_predictions_league_fixture on public.predictions (league_id, fixture_id);
create index if not exists idx_predictions_participant on public.predictions (league_participant_id);
create index if not exists idx_trades_league_status on public.trades (league_id, status);
create index if not exists idx_trade_items_trade on public.trade_items (trade_id);
create index if not exists idx_prediction_standings_lookup on public.prediction_standings (league_id, week_number, rank);

-- Trigger helper for updated_at maintenance.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_users_set_updated_at on public.users;
create trigger trg_users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists trg_competitions_set_updated_at on public.competitions;
create trigger trg_competitions_set_updated_at
before update on public.competitions
for each row execute function public.set_updated_at();

drop trigger if exists trg_real_teams_set_updated_at on public.real_teams;
create trigger trg_real_teams_set_updated_at
before update on public.real_teams
for each row execute function public.set_updated_at();

drop trigger if exists trg_players_set_updated_at on public.players;
create trigger trg_players_set_updated_at
before update on public.players
for each row execute function public.set_updated_at();

drop trigger if exists trg_fixtures_set_updated_at on public.fixtures;
create trigger trg_fixtures_set_updated_at
before update on public.fixtures
for each row execute function public.set_updated_at();

drop trigger if exists trg_leagues_set_updated_at on public.leagues;
create trigger trg_leagues_set_updated_at
before update on public.leagues
for each row execute function public.set_updated_at();

drop trigger if exists trg_league_participants_set_updated_at on public.league_participants;
create trigger trg_league_participants_set_updated_at
before update on public.league_participants
for each row execute function public.set_updated_at();

drop trigger if exists trg_rosters_set_updated_at on public.rosters;
create trigger trg_rosters_set_updated_at
before update on public.rosters
for each row execute function public.set_updated_at();

drop trigger if exists trg_player_performances_set_updated_at on public.player_performances;
create trigger trg_player_performances_set_updated_at
before update on public.player_performances
for each row execute function public.set_updated_at();

drop trigger if exists trg_trades_set_updated_at on public.trades;
create trigger trg_trades_set_updated_at
before update on public.trades
for each row execute function public.set_updated_at();

drop trigger if exists trg_prediction_standings_set_updated_at on public.prediction_standings;
create trigger trg_prediction_standings_set_updated_at
before update on public.prediction_standings
for each row execute function public.set_updated_at();

-- RLS
alter table public.users enable row level security;
alter table public.competitions enable row level security;
alter table public.real_teams enable row level security;
alter table public.players enable row level security;
alter table public.fixtures enable row level security;
alter table public.leagues enable row level security;
alter table public.league_participants enable row level security;
alter table public.rosters enable row level security;
alter table public.roster_players enable row level security;
alter table public.player_performances enable row level security;
alter table public.assistant_templates enable row level security;
alter table public.predictions enable row level security;
alter table public.trades enable row level security;
alter table public.trade_items enable row level security;
alter table public.prediction_standings enable row level security;

drop policy if exists "authenticated_read_users" on public.users;
create policy "authenticated_read_users"
on public.users
for select
to authenticated
using (true);

drop policy if exists "authenticated_read_competitions" on public.competitions;
create policy "authenticated_read_competitions"
on public.competitions
for select
to authenticated
using (true);

drop policy if exists "authenticated_read_real_teams" on public.real_teams;
create policy "authenticated_read_real_teams"
on public.real_teams
for select
to authenticated
using (true);

drop policy if exists "authenticated_read_players" on public.players;
create policy "authenticated_read_players"
on public.players
for select
to authenticated
using (true);

drop policy if exists "authenticated_read_fixtures" on public.fixtures;
create policy "authenticated_read_fixtures"
on public.fixtures
for select
to authenticated
using (true);

drop policy if exists "authenticated_read_leagues" on public.leagues;
create policy "authenticated_read_leagues"
on public.leagues
for select
to authenticated
using (true);

drop policy if exists "authenticated_read_league_participants" on public.league_participants;
create policy "authenticated_read_league_participants"
on public.league_participants
for select
to authenticated
using (true);

drop policy if exists "authenticated_read_rosters" on public.rosters;
create policy "authenticated_read_rosters"
on public.rosters
for select
to authenticated
using (true);

drop policy if exists "authenticated_read_roster_players" on public.roster_players;
create policy "authenticated_read_roster_players"
on public.roster_players
for select
to authenticated
using (true);

drop policy if exists "authenticated_read_player_performances" on public.player_performances;
create policy "authenticated_read_player_performances"
on public.player_performances
for select
to authenticated
using (true);

drop policy if exists "authenticated_read_assistant_templates" on public.assistant_templates;
create policy "authenticated_read_assistant_templates"
on public.assistant_templates
for select
to authenticated
using (true);

drop policy if exists "authenticated_read_predictions" on public.predictions;
create policy "authenticated_read_predictions"
on public.predictions
for select
to authenticated
using (true);

drop policy if exists "authenticated_read_trades" on public.trades;
create policy "authenticated_read_trades"
on public.trades
for select
to authenticated
using (true);

drop policy if exists "authenticated_read_trade_items" on public.trade_items;
create policy "authenticated_read_trade_items"
on public.trade_items
for select
to authenticated
using (true);

drop policy if exists "authenticated_read_prediction_standings" on public.prediction_standings;
create policy "authenticated_read_prediction_standings"
on public.prediction_standings
for select
to authenticated
using (true);
