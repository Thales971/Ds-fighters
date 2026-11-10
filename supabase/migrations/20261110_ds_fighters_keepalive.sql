-- Batimento do DS Fighters.
-- Uma linha só, atualizada por RPC. Isso conta como atividade real no
-- Postgres e evita a pausa do plano gratuito (~7 dias sem uso).
-- Cole este arquivo inteiro no SQL Editor do projeto ownxbuailthavxgfxtem
-- e rode uma vez. Não coloca segredo nenhum no repositório.

create table if not exists public.ds_fighters_keepalive (
  id smallint primary key default 1 check (id = 1),
  touched_at timestamptz not null default now(),
  hits bigint not null default 0
);

insert into public.ds_fighters_keepalive (id)
values (1)
on conflict (id) do nothing;

alter table public.ds_fighters_keepalive enable row level security;

drop policy if exists ds_fighters_keepalive_read on public.ds_fighters_keepalive;
create policy ds_fighters_keepalive_read
  on public.ds_fighters_keepalive
  for select
  to anon, authenticated
  using (true);

revoke insert, update, delete on table public.ds_fighters_keepalive from anon, authenticated;
grant select on table public.ds_fighters_keepalive to anon, authenticated;

create or replace function public.ds_fighters_touch()
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  ts timestamptz;
begin
  update public.ds_fighters_keepalive
     set touched_at = now(),
         hits = hits + 1
   where id = 1
  returning touched_at into ts;

  if ts is null then
    insert into public.ds_fighters_keepalive (id, touched_at, hits)
    values (1, now(), 1)
    returning touched_at into ts;
  end if;

  return ts;
end;
$$;

revoke all on function public.ds_fighters_touch() from public;
grant execute on function public.ds_fighters_touch() to anon, authenticated;

comment on table public.ds_fighters_keepalive is
  'Uma linha. O workflow e o cron da Vercel chamam ds_fighters_touch() para o projeto não pausar.';
comment on function public.ds_fighters_touch() is
  'Incrementa o batimento. Pode ser chamada com a chave publicável (role anon).';
