-- Executar via Supabase apply_migration no projeto autorizado.
-- Escopo: somente objetos ds_fighters_*. Nenhum objeto Aero Ball é modificado.
create table public.ds_fighters_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile jsonb not null,
  name text not null default 'Jogador' check (length(name) <= 64),
  photo text not null default '' check (length(photo) <= 2048),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ds_fighters_profile_object check (jsonb_typeof(profile) = 'object'),
  constraint ds_fighters_profile_size check (octet_length(profile::text) <= 32768),
  constraint ds_fighters_unlock_limit check (jsonb_array_length(profile->'unlocked') <= 64)
);

alter table public.ds_fighters_profiles enable row level security;
revoke all on public.ds_fighters_profiles from anon, authenticated;
grant select, insert, update on public.ds_fighters_profiles to authenticated;
grant select, insert, update, delete on public.ds_fighters_profiles to service_role;

create policy ds_fighters_select_own on public.ds_fighters_profiles
  for select to authenticated using ((select auth.uid()) = user_id);
create policy ds_fighters_insert_own on public.ds_fighters_profiles
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy ds_fighters_update_own on public.ds_fighters_profiles
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- O relógio é do servidor; um cliente não pode forjar prioridade por timestamp.
-- Em atualizações concorrentes, desbloqueios e melhores estatísticas não regridem.
-- SECURITY INVOKER: não bypassa RLS. Não expõe RPC privilegiada.
create function public.ds_fighters_merge_profile()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  key text;
  value numeric;
  previous numeric;
  unlocks jsonb;
begin
  if pg_catalog.jsonb_typeof(new.profile->'unlocked') is distinct from 'array'
     or pg_catalog.jsonb_typeof(new.profile->'stats') is distinct from 'object' then
    raise exception 'Perfil DS Fighters inválido' using errcode = '22023';
  end if;
  if exists (
    select 1 from pg_catalog.jsonb_array_elements(new.profile->'unlocked') as item(value)
    where pg_catalog.jsonb_typeof(item.value) <> 'string'
       or pg_catalog.length(item.value #>> '{}') not between 1 and 64
  ) then
    raise exception 'Desbloqueios DS Fighters inválidos' using errcode = '22023';
  end if;
  if tg_op = 'UPDATE' then
    select coalesce(pg_catalog.jsonb_agg(distinct item.value), '[]'::jsonb)
      into unlocks
      from pg_catalog.jsonb_array_elements((old.profile->'unlocked') || (new.profile->'unlocked')) as item(value);
    new.profile := pg_catalog.jsonb_set(new.profile, '{unlocked}', unlocks);
  end if;
  foreach key in array array['fights', 'wins', 'bestArcade', 'maxCombo'] loop
    if pg_catalog.jsonb_typeof(new.profile->'stats'->key) is distinct from 'number' then
      raise exception 'Estatística DS Fighters inválida: %', key using errcode = '22023';
    end if;
    value := (new.profile->'stats'->>key)::numeric;
    if value < 0 then
      raise exception 'Estatística negativa: %', key using errcode = '22023';
    end if;
    previous := 0;
    if tg_op = 'UPDATE' then previous := (old.profile->'stats'->>key)::numeric; end if;
    new.profile := pg_catalog.jsonb_set(new.profile, array['stats', key],
      pg_catalog.to_jsonb(pg_catalog.floor(least(9999999999::numeric, greatest(value, previous)))));
  end loop;
  new.updated_at := pg_catalog.clock_timestamp();
  if tg_op = 'INSERT' then new.created_at := new.updated_at;
  else new.created_at := old.created_at; end if;
  return new;
end;
$$;
revoke all on function public.ds_fighters_merge_profile() from public, anon, authenticated;
create trigger ds_fighters_profile_before_write
  before insert or update on public.ds_fighters_profiles
  for each row execute function public.ds_fighters_merge_profile();
comment on table public.ds_fighters_profiles is 'Progresso DS Fighters separado do Aero Ball; somente o próprio usuário acessa sua linha.';
