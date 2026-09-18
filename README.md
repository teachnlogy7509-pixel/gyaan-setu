# GyaanSetu

A community-first learning app for subject rooms, streaks, leaderboards, doubts, and shared study material. The visual language is original and inspired by the warmth and structure of modern Indian learning communities.

## Current MVP

- Subject rooms: Botany, Physics, Chemistry, Zoology, and Maths.
- Community pulse with learner posts, likes, comments, and sharing affordances.
- Streak check-in flow with Supabase-backed daily activity.
- Weekly leaderboard with points and streaks.
- Supabase Auth for learner accounts.
- PDF/study vault placeholder ready for the next phase.
- Responsive desktop/mobile navigation.

## Stack

- HTML, CSS, and modern browser JavaScript.
- Supabase Auth and Postgres with Row Level Security.
- GitHub source control.

## Supabase setup

The existing course MVP tables remain in the connected project. Run `supabase/schema.sql` to add the community-first tables and seed the subject rooms, sample posts, leaderboard, and future PDF metadata.

## Next build slices

- Real post creation, replies, moderation, and notifications.
- Upload PDFs to Supabase Storage and show them inside each subject room.
- Full leaderboard history and streak recovery rules.
- Admin/teacher room controls.
- Payments and live classes later, after the community foundation is stable.
