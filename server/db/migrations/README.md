# Database Migrations

Run these scripts in order inside Supabase SQL Editor:

1. `001_core_schema.sql`
2. `002_seed_dev.sql`
3. `003_payout_audit.sql`

Notes:
- Scripts are idempotent (`create table if not exists`, `on conflict`).
- Seed script creates a local admin user with id `00000000-0000-0000-0000-000000000001` used by development fallback.
- For production, replace development seed identities and review RLS policies before go-live.
