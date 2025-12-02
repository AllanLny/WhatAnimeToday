# Wat-Database

This folder contains a small Postgres schema and local development helpers for the What Anime Today project.

Goal: keep DB migrations and local Postgres scaffold separate from frontend/backend. The schema is Postgres-compatible and suitable to import into Supabase later.

Contents
- `migrations/V1__init.sql` : initial schema (users, watchlists, triggers, indexes)
- `docker-compose.yml` : local Postgres + Adminer for quick access
- `.env.example` : example env vars for docker-compose

Quick start (local)
1. Copy `.env.example` to `.env` and edit `POSTGRES_PASSWORD`.
   ```bash
   cp .env.example .env
   # edit .env to set a secure password
   ```
2. Start the database and Adminer
   ```bash
   docker compose up -d
   ```
3. Apply the migration
   ```bash
   # connect to the running container and apply SQL
   docker exec -i wat-db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /migrations/V1__init.sql
   ```
   Note: the compose file doesn't mount the migrations dir into the container by default. You can instead run:
   ```bash
   PGPASSWORD="$POSTGRES_PASSWORD" psql -h localhost -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f ./migrations/V1__init.sql
   ```

4. Open Adminer at `http://localhost:8080` (login with host `db`, or `localhost` and the same user/pass).

Importing to Supabase (short)
1. Create a new project on Supabase (Free tier).
2. In the Supabase dashboard, go to "SQL Editor" → "New query" and paste the contents of `migrations/V1__init.sql`, then run it.
3. Alternatively, from your local machine, use `pg_dump`/`psql` to export/import if you have a self-hosted DB:
   ```bash
   # export from local
   pg_dump -h localhost -U $POSTGRES_USER -d $POSTGRES_DB -Fc -f wat_dump.dump
   # restore to Supabase (you'll get the Supabase connection string in their dashboard)
   pg_restore --host=your.supabase.host --username=postgres --dbname=postgres --no-owner -v wat_dump.dump
   ```

Notes
- This schema is intentionally minimal and compatible with Postgres. It will work on Supabase.
- For production use, prefer managed DBs (Supabase, Neon) and enable backups/PITR.

If you want, I can:
- Add Flyway/Liquibase config to the backend for automatic migrations,
- Add a simple Spring JPA `User` and `WatchlistItem` entity + repositories + controller to the backend.
- Create a Supabase project and show exact steps to import and set environment variables.
