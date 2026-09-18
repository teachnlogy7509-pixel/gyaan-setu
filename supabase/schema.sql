-- GyaanSetu MVP schema
-- Public course catalog + private student progress.

create extension if not exists pgcrypto;

create table if not exists public.courses (
  id text primary key,
  title text not null,
  subtitle text not null,
  category text not null,
  level text not null default 'Beginner',
  duration text not null default '0 lessons',
  price text not null default 'Free',
  accent text not null default 'green',
  glyph text not null default '✦',
  featured boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id text not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  duration_minutes integer not null default 10,
  position integer not null default 1,
  is_free boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.tests (
  id uuid primary key default gen_random_uuid(),
  course_id text references public.courses(id) on delete cascade,
  title text not null,
  total_questions integer not null default 10,
  duration_minutes integer not null default 10,
  created_at timestamptz not null default now()
);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null references public.courses(id) on delete cascade,
  progress integer not null default 0 check (progress between 0 and 100),
  last_lesson_id uuid references public.lessons(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, course_id)
);

alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.tests enable row level security;
alter table public.enrollments enable row level security;

drop policy if exists "Anyone can view courses" on public.courses;
create policy "Anyone can view courses" on public.courses for select using (true);
drop policy if exists "Anyone can view lessons" on public.lessons;
create policy "Anyone can view lessons" on public.lessons for select using (true);
drop policy if exists "Anyone can view tests" on public.tests;
create policy "Anyone can view tests" on public.tests for select using (true);
drop policy if exists "Students view their enrollments" on public.enrollments;
create policy "Students view their enrollments" on public.enrollments for select using (auth.uid() = user_id);
drop policy if exists "Students create their enrollments" on public.enrollments;
create policy "Students create their enrollments" on public.enrollments for insert with check (auth.uid() = user_id);
drop policy if exists "Students update their enrollments" on public.enrollments;
create policy "Students update their enrollments" on public.enrollments for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into public.courses (id, title, subtitle, category, level, duration, price, accent, glyph, featured)
values
  ('physics-foundations', 'Physics fundamentals', 'Vectors, kinematics, and the language of motion.', 'JEE / NEET', 'Beginner', '24 lessons', 'Free', 'green', '∿', true),
  ('organic-chemistry', 'Organic chemistry, simply', 'Build intuition before you memorise reactions.', 'JEE / NEET', 'Intermediate', '31 lessons', '₹499', 'orange', '⌬', true),
  ('maths-class-10', 'Maths that makes sense', 'A calm, visual route through Class 10 maths.', 'School', 'Class 10', '42 lessons', '₹299', 'blue', 'π', false),
  ('public-speaking', 'Speak with confidence', 'Turn clear thoughts into words people remember.', 'Skills', 'All levels', '12 lessons', '₹399', 'purple', '✦', false),
  ('upsc-essentials', 'UPSC essentials', 'Current affairs, structure, and an honest study plan.', 'UPSC', 'Foundation', '28 lessons', '₹599', 'green', '◒', false),
  ('biology-revision', 'Biology revision lab', 'High-yield concepts for faster, smarter recall.', 'JEE / NEET', 'Revision', '18 lessons', 'Free', 'orange', '⌁', false)
on conflict (id) do update set subtitle = excluded.subtitle, duration = excluded.duration, price = excluded.price, featured = excluded.featured;

insert into public.lessons (course_id, title, description, duration_minutes, position, is_free)
values
  ('physics-foundations', 'Vectors, made visual', 'A visual introduction to direction and magnitude.', 12, 1, true),
  ('physics-foundations', 'Motion in a plane', 'Read motion like a story, not a formula sheet.', 18, 2, true),
  ('physics-foundations', 'Relative motion', 'Change the frame, change the insight.', 21, 3, false),
  ('organic-chemistry', 'The carbon toolkit', 'The few ideas that unlock organic chemistry.', 15, 1, true),
  ('maths-class-10', 'Quadratic equations', 'See the pattern before solving the problem.', 16, 1, true)
on conflict do nothing;

create index if not exists enrollments_user_id_idx on public.enrollments(user_id);
create index if not exists lessons_course_position_idx on public.lessons(course_id, position);
