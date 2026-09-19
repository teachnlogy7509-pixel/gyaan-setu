-- GyaanSetu batch-wise community and doubt system
-- Every post/comment is scoped through section -> batch, and RLS checks enrollment.

create extension if not exists pgcrypto;

create table if not exists public.batches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  position integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.sections (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.batches(id) on delete cascade,
  type text not null check (type in ('community', 'doubt')),
  name text not null,
  created_at timestamptz not null default now(),
  unique (batch_id, type)
);

create table if not exists public.batch_enrollments (
  batch_id uuid not null references public.batches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'student' check (role in ('student', 'teacher', 'admin')),
  status text not null default 'active' check (status in ('active', 'revoked')),
  enrolled_at timestamptz not null default now(),
  primary key (batch_id, user_id)
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.sections(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  author_name text,
  initials text,
  content text not null check (length(trim(content)) > 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  author_name text,
  content text not null check (length(trim(content)) > 0),
  created_at timestamptz not null default now()
);

create or replace function public.is_batch_enrolled(target_batch uuid)
returns boolean language sql security definer stable set search_path = public
as $$
  select exists (select 1 from public.batch_enrollments where batch_id = target_batch and user_id = auth.uid() and status = 'active');
$$;

create or replace function public.is_section_enrolled(target_section uuid)
returns boolean language sql security definer stable set search_path = public
as $$
  select exists (select 1 from public.sections s join public.batch_enrollments e on e.batch_id = s.batch_id where s.id = target_section and e.user_id = auth.uid() and e.status = 'active');
$$;

create or replace function public.is_post_enrolled(target_post uuid)
returns boolean language sql security definer stable set search_path = public
as $$
  select exists (select 1 from public.posts p where p.id = target_post and public.is_section_enrolled(p.section_id));
$$;

alter table public.batches enable row level security;
alter table public.sections enable row level security;
alter table public.batch_enrollments enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;

drop policy if exists "Enrolled users view batches" on public.batches;
create policy "Enrolled users view batches" on public.batches for select using (public.is_batch_enrolled(id));
drop policy if exists "Enrolled users view sections" on public.sections;
create policy "Enrolled users view sections" on public.sections for select using (public.is_batch_enrolled(batch_id));
drop policy if exists "Users view own enrollments" on public.batch_enrollments;
create policy "Users view own enrollments" on public.batch_enrollments for select using ((select auth.uid()) = user_id);
drop policy if exists "Enrolled users view posts" on public.posts;
create policy "Enrolled users view posts" on public.posts for select using (public.is_section_enrolled(section_id));
drop policy if exists "Enrolled users create posts" on public.posts;
create policy "Enrolled users create posts" on public.posts for insert with check ((select auth.uid()) = user_id and public.is_section_enrolled(section_id));
drop policy if exists "Authors update posts" on public.posts;
create policy "Authors update posts" on public.posts for update using ((select auth.uid()) = user_id and public.is_section_enrolled(section_id)) with check ((select auth.uid()) = user_id and public.is_section_enrolled(section_id));
drop policy if exists "Authors delete posts" on public.posts;
create policy "Authors delete posts" on public.posts for delete using ((select auth.uid()) = user_id);
drop policy if exists "Enrolled users view comments" on public.comments;
create policy "Enrolled users view comments" on public.comments for select using (public.is_post_enrolled(post_id));
drop policy if exists "Enrolled users create comments" on public.comments;
create policy "Enrolled users create comments" on public.comments for insert with check ((select auth.uid()) = user_id and public.is_post_enrolled(post_id));
drop policy if exists "Authors update comments" on public.comments;
create policy "Authors update comments" on public.comments for update using ((select auth.uid()) = user_id and public.is_post_enrolled(post_id)) with check ((select auth.uid()) = user_id and public.is_post_enrolled(post_id));
drop policy if exists "Authors delete comments" on public.comments;
create policy "Authors delete comments" on public.comments for delete using ((select auth.uid()) = user_id);

insert into public.batches (name, slug, description, position)
values
  ('Yakeen NEET Hindi 2027', 'yakeen-neet-hindi-2027', 'A focused NEET Hindi learning community.', 1),
  ('Yakeen NEET Hindi 2025', 'yakeen-neet-hindi-2025', 'Yakeen NEET Hindi 2025 learning room.', 2),
  ('Yakeen NEET Hindi 2.0 2025', 'yakeen-neet-hindi-2-0-2025', 'Yakeen NEET Hindi 2.0 2025 learning room.', 3),
  ('Yakeen NEET Hindi 3.0 2025', 'yakeen-neet-hindi-3-0-2025', 'Yakeen NEET Hindi 3.0 2025 learning room.', 4),
  ('Yakeen NEET Hindi 3.0 2027', 'yakeen-neet-hindi-3-0-2027', 'The third Yakeen NEET Hindi 2027 learning room.', 5),
  ('Yakeen NEET Hindi 2.0 2027', 'yakeen-neet-hindi-2-0-2027', 'The second Yakeen NEET Hindi 2027 learning room.', 6)
on conflict (slug) do update set name = excluded.name, description = excluded.description, position = excluded.position;

insert into public.sections (batch_id, type, name)
select b.id, s.type, s.name from public.batches b cross join (values ('community'::text, 'Community'::text), ('doubt'::text, 'Doubt Section'::text)) s(type, name)
on conflict (batch_id, type) do update set name = excluded.name;

create index if not exists sections_batch_idx on public.sections(batch_id);
create index if not exists posts_section_created_idx on public.posts(section_id, created_at desc);
create index if not exists comments_post_created_idx on public.comments(post_id, created_at asc);
create index if not exists batch_enrollments_user_idx on public.batch_enrollments(user_id, status);

-- Five lightweight reactions, isolated through the same post -> section -> batch access rule.
create table if not exists public.post_reactions (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction_type text not null check (reaction_type in ('like', 'love', 'helpful', 'fire', 'celebrate')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id, reaction_type)
);

alter table public.post_reactions enable row level security;
drop policy if exists "Enrolled users view reactions" on public.post_reactions;
create policy "Enrolled users view reactions" on public.post_reactions for select using (public.is_post_enrolled(post_id));
drop policy if exists "Enrolled users add reactions" on public.post_reactions;
create policy "Enrolled users add reactions" on public.post_reactions for insert with check ((select auth.uid()) = user_id and public.is_post_enrolled(post_id));
drop policy if exists "Users remove own reactions" on public.post_reactions;
create policy "Users remove own reactions" on public.post_reactions for delete using ((select auth.uid()) = user_id and public.is_post_enrolled(post_id));
create index if not exists post_reactions_post_idx on public.post_reactions(post_id, reaction_type);


-- YPT / Focus sessions
-- Local-first timers can sync to this table when the user is signed in.
create table if not exists public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  seconds integer not null default 0 check (seconds >= 0),
  subject text,
  started_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.focus_sessions enable row level security;

drop policy if exists "Users view own focus sessions" on public.focus_sessions;
create policy "Users view own focus sessions"
  on public.focus_sessions for select
  using ((select auth.uid()) = user_id);

drop policy if exists "Users create own focus sessions" on public.focus_sessions;
create policy "Users create own focus sessions"
  on public.focus_sessions for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users update own focus sessions" on public.focus_sessions;
create policy "Users update own focus sessions"
  on public.focus_sessions for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users delete own focus sessions" on public.focus_sessions;
create policy "Users delete own focus sessions"
  on public.focus_sessions for delete
  using ((select auth.uid()) = user_id);

create index if not exists focus_sessions_user_started_idx
  on public.focus_sessions(user_id, started_at desc);


-- Designated GyaanSetu admin
create or replace function public.gyaan_set_admin_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if lower(coalesce(new.email,'')) = 'ashisharmy1982@gmail.com' then
    new.role := 'admin';
  end if;
  return new;
end;
$$;

create or replace function public.gyaan_provision_admin_batches()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if lower(coalesce(new.email,'')) = 'ashisharmy1982@gmail.com'
     and lower(coalesce(new.role,'')) = 'admin' then
    insert into public.batch_enrollments(batch_id,user_id,role,status,enrolled_at)
    select b.id,new.id,'admin','active',now()
    from public.batches b
    on conflict (batch_id,user_id) do update
      set role='admin',status='active';
  end if;
  return new;
end;
$$;

drop trigger if exists gyaan_profile_admin_role on public.profiles;
create trigger gyaan_profile_admin_role
before insert or update of email on public.profiles
for each row execute function public.gyaan_set_admin_role();

drop trigger if exists gyaan_profile_admin_batches on public.profiles;
create trigger gyaan_profile_admin_batches
after insert or update of email,role on public.profiles
for each row execute function public.gyaan_provision_admin_batches();
