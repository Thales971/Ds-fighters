-- DS Fighters: RANKING das contas (email). Cole no SQL Editor do projeto do
-- jogo e rode UMA vez (pode rodar de novo, e idempotente).
-- Duas listas: quem tem MAIS VITORIAS e quem fechou o TORNEIO MAIS RAPIDO
-- (soma dos segundos de luta das 7 lutas). So guarda apelido + numeros:
-- nada de email. Cada conta so escreve a PROPRIA linha (RLS por auth.uid()).
create table if not exists public.ds_fighters_ranking (
  uid uuid primary key references auth.users (id) on delete cascade,
  name text not null default 'Jogador' check (char_length(name) between 1 and 24),
  wins integer not null default 0 check (wins between 0 and 1000000),
  fights integer not null default 0 check (fights between 0 and 2000000),
  best_tourney_secs integer check (best_tourney_secs is null or best_tourney_secs between 30 and 100000),
  fighter text check (fighter is null or fighter ~ '^[a-z][a-z0-9_-]{0,40}$'),
  updated_at timestamptz not null default now()
);
create index if not exists ds_fighters_ranking_wins on public.ds_fighters_ranking (wins desc);
create index if not exists ds_fighters_ranking_tourney on public.ds_fighters_ranking (best_tourney_secs asc) where best_tourney_secs is not null;

alter table public.ds_fighters_ranking enable row level security;

drop policy if exists "ranking publico" on public.ds_fighters_ranking;
create policy "ranking publico" on public.ds_fighters_ranking
  for select to anon, authenticated using (true);

drop policy if exists "dono insere" on public.ds_fighters_ranking;
create policy "dono insere" on public.ds_fighters_ranking
  for insert to authenticated with check ((select auth.uid()) = uid);

drop policy if exists "dono atualiza" on public.ds_fighters_ranking;
create policy "dono atualiza" on public.ds_fighters_ranking
  for update to authenticated using ((select auth.uid()) = uid) with check ((select auth.uid()) = uid);

grant select on public.ds_fighters_ranking to anon, authenticated;
grant insert, update on public.ds_fighters_ranking to authenticated;
