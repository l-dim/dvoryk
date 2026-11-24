-- ============================================================
-- Дворик: хмарні збереження
-- Один рядок на гравця. Пише лише функція push_save (з перевіркою версії rev),
-- читати можна лише свій рядок. Попередні версії лишаються в save_history (останні 10).
-- ============================================================

create table if not exists public.saves (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb       not null,
  rev        bigint      not null default 1,
  level      int,
  chapter    int,
  device     text,
  updated_at timestamptz not null default now()
);

create table if not exists public.save_history (
  id         bigint generated always as identity primary key,
  user_id    uuid        not null references auth.users (id) on delete cascade,
  data       jsonb       not null,
  rev        bigint      not null,
  level      int,
  chapter    int,
  device     text,
  saved_at   timestamptz not null,
  replaced_at timestamptz not null default now()
);
create index if not exists save_history_user_idx on public.save_history (user_id, id desc);

alter table public.saves        enable row level security;
alter table public.save_history enable row level security;

drop policy if exists "saves: read own" on public.saves;
create policy "saves: read own" on public.saves
  for select to authenticated using (user_id = (select auth.uid()));
-- save_history: без політик — клієнтам недоступна (лише для підтримки через панель)

revoke all on public.saves        from anon, authenticated;
revoke all on public.save_history from anon, authenticated;
grant select on public.saves to authenticated;

-- ------------------------------------------------------------
-- push_save: записати сейв, якщо хмарна версія досі та, на якій він базується.
--   p_base_rev = rev, який клієнт бачив востаннє (0 — ще жодного разу не синхронізувався)
--   p_force    = перезаписати, навіть якщо в хмарі новіша версія (гравець сам так вирішив)
-- Повертає ok=false і поточний rev хмари, якщо там новіше (інший пристрій).
-- ------------------------------------------------------------
create or replace function public.push_save(
  p_data jsonb, p_base_rev bigint, p_device text default null, p_force boolean default false
)
returns table (ok boolean, rev bigint, level int, chapter int, updated_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  uid uuid := auth.uid();
  cur public.saves%rowtype;
  lvl int;
  chp int;
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if jsonb_typeof(p_data) is distinct from 'object' or jsonb_typeof(p_data -> 'board') is distinct from 'array' then
    raise exception 'bad save' using errcode = '22023';
  end if;
  if octet_length(p_data::text) > 2000000 then
    raise exception 'save too large' using errcode = '54000';
  end if;

  lvl := case when jsonb_typeof(p_data -> 'level')   = 'number' then (p_data ->> 'level')::numeric::int end;
  chp := case when jsonb_typeof(p_data -> 'chapter') = 'number' then (p_data ->> 'chapter')::numeric::int end;
  p_device := left(p_device, 40);

  select * into cur from public.saves s where s.user_id = uid for update;

  if not found then
    insert into public.saves (user_id, data, rev, level, chapter, device)
    values (uid, p_data, 1, lvl, chp, p_device)
    on conflict (user_id) do nothing;
    if found then
      return query select true, 1::bigint, lvl, chp, now();
      return;
    end if;
    -- паралельний запис встиг першим — далі як із наявним рядком
    select * into cur from public.saves s where s.user_id = uid for update;
  end if;

  if cur.rev <> p_base_rev and not p_force then
    return query select false, cur.rev, cur.level, cur.chapter, cur.updated_at;
    return;
  end if;

  insert into public.save_history (user_id, data, rev, level, chapter, device, saved_at)
  values (uid, cur.data, cur.rev, cur.level, cur.chapter, cur.device, cur.updated_at);
  delete from public.save_history h
  where h.user_id = uid
    and h.id not in (select h2.id from public.save_history h2 where h2.user_id = uid order by h2.id desc limit 10);

  update public.saves s
  set data = p_data, rev = cur.rev + 1, level = lvl, chapter = chp, device = p_device, updated_at = now()
  where s.user_id = uid;

  return query select true, cur.rev + 1, lvl, chp, now();
end;
$$;

revoke execute on function public.push_save(jsonb, bigint, text, boolean) from public, anon;
grant  execute on function public.push_save(jsonb, bigint, text, boolean) to authenticated;

-- ------------------------------------------------------------
-- delete_me: видалити свій акаунт разом з усіма даними (вимога App Store / Google Play).
-- saves і save_history видаляються каскадом.
-- ------------------------------------------------------------
create or replace function public.delete_me()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.delete_me() from public, anon;
grant  execute on function public.delete_me() to authenticated;
