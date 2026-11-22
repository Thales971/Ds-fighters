-- DS Fighters: resultado de cada luta (anonimo) pra balancear com dados REAIS.
-- Cole no SQL Editor do projeto do jogo e rode uma vez.
-- Guarda so: modo, mapa, lutador de cada lado, quem e CPU, dificuldade,
-- rounds e quem venceu. Nada de nome, e-mail, IP ou id de usuario.
create table if not exists public.ds_fighters_match_results (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  mode text not null check (char_length(mode) <= 20),
  stage text check (char_length(stage) <= 60),
  p1 text not null check (char_length(p1) <= 40),
  p2 text not null check (char_length(p2) <= 40),
  p1_cpu boolean not null default false,
  p2_cpu boolean not null default false,
  difficulty smallint check (difficulty between 0 and 3),
  rounds_p1 smallint check (rounds_p1 between 0 and 9),
  rounds_p2 smallint check (rounds_p2 between 0 and 9),
  winner smallint check (winner in (-1, 0, 1)),
  seconds smallint check (seconds between 0 and 3600),
  build text check (char_length(build) <= 40)
);
alter table public.ds_fighters_match_results enable row level security;
-- o jogo (chave publica) so pode INSERIR; ler fica so pra quem e dono do projeto
drop policy if exists "insere resultado" on public.ds_fighters_match_results;
create policy "insere resultado" on public.ds_fighters_match_results
  for insert to anon, authenticated with check (true);
grant insert on public.ds_fighters_match_results to anon, authenticated;

-- taxa de vitoria por lutador (humano contra qualquer um), pra consultar:
-- select p, count(*) lutas, round(100.0*avg(v),1) pct from (
--   select p1 p, (winner=0)::int v from ds_fighters_match_results where not p1_cpu
--   union all select p2, (winner=1)::int from ds_fighters_match_results where not p2_cpu
-- ) t group by p having count(*) >= 10 order by pct desc;
