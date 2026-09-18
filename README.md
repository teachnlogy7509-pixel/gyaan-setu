# GyaanSetu

A focused learning platform for courses, practice, and visible progress. The experience takes inspiration from modern Indian edtech products while using an original brand, layout, copy, and visual language.

## What is included

- Responsive learner home with daily streak, weekly learning stats, resume-learning card, course discovery, and practice CTA.
- Search and category filters for JEE / NEET, School, Skills, and UPSC.
- Supabase-backed course catalogue and enrollment flow.
- Email/password authentication through Supabase Auth.
- Row Level Security for student enrollments.
- Offline-friendly preview fallback when the Supabase client cannot load.

## Stack

- HTML, CSS, and modern browser JavaScript for a fast starter MVP.
- Supabase for Auth, Postgres, and RLS.
- GitHub for source control.

## Run locally

Serve the folder with any static server, for example:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Supabase setup

1. Open the connected GyaanSetu Supabase project.
2. Run `supabase/schema.sql` in the SQL editor or through the Supabase migration tool.
3. Keep email confirmation settings aligned with the environment you want to use.
4. The frontend uses the project's publishable key. It is safe to expose a publishable key in a browser app when RLS policies are configured correctly.

## Next build slices

- Add lesson player + video/storage URLs.
- Add test questions, submissions, and score history.
- Add teacher/admin dashboard.
- Add payments only after selecting a payment provider and defining the product catalogue.
