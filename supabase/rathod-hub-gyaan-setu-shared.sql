-- Shared data contract for RATHOD-HUB and GyaanSetu.
-- Applied to Supabase project oicluhfdvaroqvhwfwyp.
-- Keep community posts, doubts, todos, notes, and batch access scoped to GyaanSetu.
-- Share only leaderboard, score/XP, study materials, and coupon access.

alter table public.profiles add column if not exists xp integer not null default 0;

create table if not exists public.league_state (
  id smallint primary key default 1 check (id = 1),
  season_number integer not null default 1,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null default (now() + interval '13 days'),
  updated_at timestamptz not null default now()
);
insert into public.league_state(id, season_number, starts_at, ends_at)
values (1, 1, now(), now() + interval '13 days') on conflict (id) do nothing;

create table if not exists public.league_members (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  league_level smallint not null default 1 check (league_level between 1 and 10),
  group_no integer not null default 1 check (group_no >= 1),
  season_xp integer not null default 0 check (season_xp >= 0),
  season_number integer not null default 1,
  updated_at timestamptz not null default now()
);
create index if not exists league_members_board_idx
  on public.league_members(season_number, league_level, group_no, season_xp desc, updated_at, user_id);
insert into public.league_members(user_id, league_level, group_no, season_xp, season_number)
select id, 1, 1, 0, 1 from public.profiles on conflict (user_id) do nothing;

create table if not exists public.hub_access_coupons (
  id uuid primary key default gen_random_uuid(), code text not null unique,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(), expires_at timestamptz not null,
  access_days integer not null default 5 check (access_days between 1 and 30), active boolean not null default true
);
create table if not exists public.hub_coupon_redemptions (
  id uuid primary key default gen_random_uuid(), coupon_id uuid not null references public.hub_access_coupons(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  redeemed_at timestamptz not null default now(), access_expires_at timestamptz not null,
  unique (coupon_id, user_id)
);

create or replace function public.get_shared_leaderboard(p_limit integer default 50)
returns table (rank bigint, user_id uuid, display_name text, xp integer, saka_score integer, season_xp integer, league_level smallint, streak_days integer)
language sql stable security definer set search_path = public as $$
  select row_number() over (order by coalesce(p.xp,0) desc, coalesce(l.season_xp,0) desc, p.id), p.id,
    coalesce(nullif(p.display_name,''),'Learner'), coalesce(p.xp,0), coalesce(p.saka_score,0),
    coalesce(l.season_xp,0), coalesce(l.league_level,1), coalesce(p.streak_days,0)
  from public.profiles p left join public.league_members l on l.user_id=p.id
  order by coalesce(p.xp,0) desc, coalesce(l.season_xp,0) desc, p.id
  limit greatest(1, least(coalesce(p_limit,50),100));
$$;

create or replace function public.ensure_shared_league_member()
returns public.league_members language plpgsql security definer set search_path = public as $$
declare r public.league_members;
begin
  if auth.uid() is null then raise exception 'Login required'; end if;
  insert into public.league_members(user_id, season_number) values(auth.uid(), coalesce((select season_number from public.league_state where id=1),1)) on conflict(user_id) do nothing;
  select * into r from public.league_members where user_id=auth.uid(); return r;
end; $$;

create or replace function public.grant_league_xp(p_amount integer)
returns public.league_members language plpgsql security definer set search_path = public as $$
declare r public.league_members;
begin
  if auth.uid() is null then raise exception 'Login required';
  if p_amount is null or p_amount <= 0 or p_amount > 5000 then raise exception 'Invalid XP amount'; end if;
  perform public.ensure_shared_league_member();
  update public.profiles set xp=coalesce(xp,0)+p_amount where id=auth.uid();
  update public.league_members set season_xp=season_xp+p_amount, updated_at=now() where user_id=auth.uid() returning * into r;
  return r;
end; $$;

create or replace function public.create_hub_coupon(p_code text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_code text; v_exp timestamptz;
begin
  if not public.is_gyaan_setu_staff() then raise exception 'Staff only'; end if;
  v_code:=upper(trim(coalesce(nullif(p_code,''),'RATHOD-'||substr(replace(gen_random_uuid()::text,'-',''),1,10))));
  v_exp:=now()+interval '3 days';
  insert into public.hub_access_coupons(code,created_by,expires_at,access_days) values(v_code,auth.uid(),v_exp,5);
  return jsonb_build_object('success',true,'code',v_code,'expires_at',v_exp,'access_days',5);
end; $$;

create or replace function public.redeem_hub_coupon(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid:=auth.uid(); v_coupon public.hub_access_coupons; v_exp timestamptz;
begin
  if v_uid is null then raise exception 'Login required'; end if;
  select * into v_coupon from public.hub_access_coupons where code=upper(trim(p_code)) and active=true and expires_at>now() for update;
  if not found then return jsonb_build_object('success',false,'error','Coupon invalid or expired'); end if;
  select access_expires_at into v_exp from public.hub_coupon_redemptions where coupon_id=v_coupon.id and user_id=v_uid;
  if v_exp is not null then return jsonb_build_object('success',true,'code',v_coupon.code,'expires_at',v_exp,'already_redeemed',true); end if;
  v_exp:=now()+(v_coupon.access_days||' days')::interval;
  insert into public.hub_coupon_redemptions(coupon_id,user_id,access_expires_at) values(v_coupon.id,v_uid,v_exp);
  return jsonb_build_object('success',true,'code',v_coupon.code,'expires_at',v_exp,'already_redeemed',false);
end; $$;

create or replace function public.get_hub_coupon_access()
returns jsonb language plpgsql security definer stable set search_path = public as $$
declare v_row record;
begin
  select r.access_expires_at,c.code into v_row from public.hub_coupon_redemptions r join public.hub_access_coupons c on c.id=r.coupon_id where r.user_id=auth.uid() and r.access_expires_at>now() order by r.access_expires_at desc limit 1;
  if not found then return jsonb_build_object('active',false); end if;
  return jsonb_build_object('active',true,'code',v_row.code,'expires_at',v_row.access_expires_at);
end; $$;

alter table public.league_state enable row level security;
alter table public.league_members enable row level security;
alter table public.hub_access_coupons enable row level security;
alter table public.hub_coupon_redemptions enable row level security;
drop policy if exists shared_league_state_read on public.league_state;
create policy shared_league_state_read on public.league_state for select to authenticated using(true);
drop policy if exists shared_league_members_read on public.league_members;
create policy shared_league_members_read on public.league_members for select to authenticated using(true);
drop policy if exists shared_coupon_staff_read on public.hub_access_coupons;
create policy shared_coupon_staff_read on public.hub_access_coupons for select to authenticated using(public.is_gyaan_setu_staff());
drop policy if exists shared_coupon_redemption_own_read on public.hub_coupon_redemptions;
create policy shared_coupon_redemption_own_read on public.hub_coupon_redemptions for select to authenticated using(user_id=auth.uid());
grant select on public.league_state,public.league_members,public.hub_access_coupons,public.hub_coupon_redemptions to authenticated;
grant execute on function public.get_shared_leaderboard(integer),public.ensure_shared_league_member(),public.grant_league_xp(integer),public.create_hub_coupon(text),public.redeem_hub_coupon(text),public.get_hub_coupon_access() to authenticated;
