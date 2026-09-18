-- GyaanSetu community-first MVP additions
-- Keeps the existing course tables and adds rooms, discussions, streaks, leaderboard, and future PDF metadata.

create table if not exists public.subjects (
  id text primary key,
  name text not null,
  description text,
  learner_count text not null default 'new room',
  accent text not null default 'green',
  icon text not null default '✦',
  position integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  subject_id text not null references public.subjects(id) on delete cascade,
  author_name text not null,
  initials text not null,
  role text not null default 'Learner',
  content text not null,
  likes integer not null default 0,
  comments integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.community_members (
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id text not null references public.subjects(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, subject_id)
);

create table if not exists public.daily_activity (
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_date date not null,
  points integer not null default 10,
  created_at timestamptz not null default now(),
  primary key (user_id, activity_date)
);

create table if not exists public.leaderboard_points (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  display_name text not null,
  initials text not null,
  points integer not null default 0,
  streak integer not null default 0,
  avatar text not null default 'av-one',
  created_at timestamptz not null default now()
);

create table if not exists public.study_materials (
  id uuid primary key default gen_random_uuid(),
  subject_id text not null references public.subjects(id) on delete cascade,
  title text not null,
  material_type text not null default 'pdf',
  file_url text,
  is_available boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.subjects enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_members enable row level security;
alter table public.daily_activity enable row level security;
alter table public.leaderboard_points enable row level security;
alter table public.study_materials enable row level security;

drop policy if exists "Anyone can view subjects" on public.subjects;
create policy "Anyone can view subjects" on public.subjects for select using (true);
drop policy if exists "Anyone can view community posts" on public.community_posts;
create policy "Anyone can view community posts" on public.community_posts for select using (true);
drop policy if exists "Anyone can view leaderboard" on public.leaderboard_points;
create policy "Anyone can view leaderboard" on public.leaderboard_points for select using (true);
drop policy if exists "Anyone can view study materials" on public.study_materials;
create policy "Anyone can view study materials" on public.study_materials for select using (true);
drop policy if exists "Learners view memberships" on public.community_members;
create policy "Learners view memberships" on public.community_members for select using ((select auth.uid()) = user_id);
drop policy if exists "Learners join rooms" on public.community_members;
create policy "Learners join rooms" on public.community_members for insert with check ((select auth.uid()) = user_id);
drop policy if exists "Learners leave rooms" on public.community_members;
create policy "Learners leave rooms" on public.community_members for delete using ((select auth.uid()) = user_id);
drop policy if exists "Learners view their activity" on public.daily_activity;
create policy "Learners view their activity" on public.daily_activity for select using ((select auth.uid()) = user_id);
drop policy if exists "Learners record activity" on public.daily_activity;
create policy "Learners record activity" on public.daily_activity for insert with check ((select auth.uid()) = user_id);
drop policy if exists "Learners update activity" on public.daily_activity;
create policy "Learners update activity" on public.daily_activity for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

insert into public.subjects (id, name, description, learner_count, accent, icon, position)
values
  ('botany', 'Botany', 'plants, diagrams, revision', '6.8k learners', 'green', '❧', 1),
  ('physics', 'Physics', 'concepts, numericals, doubts', '8.2k learners', 'orange', '∿', 2),
  ('chemistry', 'Chemistry', 'reactions, notes, practice', '7.4k learners', 'blue', '⌬', 3),
  ('zoology', 'Zoology', 'human systems, NEET prep', '5.1k learners', 'purple', '◒', 4),
  ('maths', 'Maths', 'shortcuts, problems, wins', '4.6k learners', 'ink', 'π', 5)
on conflict (id) do update set description = excluded.description, learner_count = excluded.learner_count, accent = excluded.accent, icon = excluded.icon, position = excluded.position;

insert into public.community_posts (subject_id, author_name, initials, role, content, likes, comments)
select 'physics', 'Aarav K.', 'AK', 'NEET 2027', 'Finally understood why the direction changes in circular motion. The diagram-first approach made it click — sharing it here in case someone else is stuck too.', 42, 8
where not exists (select 1 from public.community_posts where author_name = 'Aarav K.');
insert into public.community_posts (subject_id, author_name, initials, role, content, likes, comments)
select 'botany', 'Priya S.', 'PS', 'Botany room guide', 'Quick reminder: revise plant hormones with one real-life example each. I made a tiny memory map for auxin, gibberellin, cytokinin, ABA and ethylene.', 67, 14
where not exists (select 1 from public.community_posts where author_name = 'Priya S.');
insert into public.community_posts (subject_id, author_name, initials, role, content, likes, comments)
select 'chemistry', 'Naman M.', 'NM', 'JEE / NEET', 'Small win: 30/30 in today''s organic reaction sprint. Consistency is feeling better than motivation this week.', 31, 5
where not exists (select 1 from public.community_posts where author_name = 'Naman M.');

insert into public.leaderboard_points (display_name, initials, points, streak, avatar)
select 'Mahi R.', 'MR', 492, 21, 'av-two' where not exists (select 1 from public.leaderboard_points where display_name = 'Mahi R.');
insert into public.leaderboard_points (display_name, initials, points, streak, avatar)
select 'Dev P.', 'DP', 411, 18, 'av-one' where not exists (select 1 from public.leaderboard_points where display_name = 'Dev P.');
insert into public.leaderboard_points (display_name, initials, points, streak, avatar)
select 'You', 'RS', 268, 14, 'av-three' where not exists (select 1 from public.leaderboard_points where display_name = 'You');
insert into public.leaderboard_points (display_name, initials, points, streak, avatar)
select 'Ishita S.', 'IS', 244, 12, 'av-four' where not exists (select 1 from public.leaderboard_points where display_name = 'Ishita S.');

insert into public.study_materials (subject_id, title, material_type, is_available)
select 'botany', 'Plant physiology quick notes', 'pdf', false where not exists (select 1 from public.study_materials where title = 'Plant physiology quick notes');
insert into public.study_materials (subject_id, title, material_type, is_available)
select 'physics', 'Motion formula sheet', 'pdf', false where not exists (select 1 from public.study_materials where title = 'Motion formula sheet');

create index if not exists community_posts_subject_created_idx on public.community_posts(subject_id, created_at desc);
create index if not exists community_members_subject_idx on public.community_members(subject_id);
create index if not exists daily_activity_user_date_idx on public.daily_activity(user_id, activity_date desc);
create index if not exists leaderboard_points_points_idx on public.leaderboard_points(points desc);
