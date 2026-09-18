# RATHOD-HUB + GyaanSetu shared data

Both projects use the same Supabase project: `oicluhfdvaroqvhwfwyp`.

## Shared

- Leaderboard: `get_shared_leaderboard`
- Score and XP: `profiles.xp`, `league_members.season_xp`, `grant_league_xp`
- Study material: the existing `study_pdfs` table
- Coupon access: `create_hub_coupon`, `redeem_hub_coupon`, and `get_hub_coupon_access`

## Kept separate

- Batch community and doubt posts
- Comments and reactions
- Personal todos and notes
- App-specific navigation and UI

The shared database migration `rathod_hub_gyaan_setu_shared_progress` is already applied to the live Supabase project. Keep this contract when adding either app's UI or server code.