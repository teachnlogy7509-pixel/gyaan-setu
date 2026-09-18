# GyaanSetu

GyaanSetu is a batch-wise student community for focused learning, discussion, and doubt solving.

## Current batch community MVP

- Collapsible left sidebar with enrolled-batch navigation.
- Batches: Yakeen NEET Hindi 2027, Yakeen NEET Hindi 2.0 2027, and Yakeen NEET Hindi 3.0 2027.
- Every batch has two isolated sections: Community and Doubt Section.
- Posts and comments are linked to a section, so content cannot cross between batches or section types.
- Supabase Auth and role-aware batch enrollment (`student`, `teacher`, `admin`).
- Row Level Security allows only active enrolled users to read or write a batch.
- Streak and leaderboard UI remain available as the next layer around the community.

## Data model

- `batches`: id, name, slug, description, position.
- `sections`: id, batch_id, type (`community` or `doubt`), name.
- `batch_enrollments`: batch_id, user_id, role, status.
- `posts`: id, section_id, user_id, content, created_at.
- `comments`: post_id, user_id, content, created_at.

## Stack

HTML, CSS, browser JavaScript, Supabase Auth/Postgres/RLS, and GitHub.

Run `supabase/schema.sql` in the connected Supabase project before using real enrolled accounts.
