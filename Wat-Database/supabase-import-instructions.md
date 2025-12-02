# Importing this schema into Supabase (short guide)

1. Create a new project on Supabase (https://app.supabase.com). Choose the free plan if you want.
2. In the project dashboard go to `SQL` → `Editor`.
3. Open `migrations/V1__init.sql` in your editor and copy/paste the SQL into Supabase SQL Editor.
4. Click `RUN` to create the tables.

Alternative: use `psql` to push the SQL from your machine:

- Get the Supabase connection string from the project settings (Database → Connection string)
- Run locally:

```bash
PGPASSWORD="<your_password>" psql "postgresql://postgres@db.supabase.co:5432/postgres" -f ./migrations/V1__init.sql
```

(Replace host/port/user/password per the Supabase connection details.)

Notes:
- Supabase provides Auth; you can integrate Discord login by using OAuth on your backend and storing `discord_id` in the `users` table.
- Supabase free projects pause after 1 week of inactivity — keep it active during testing.
- For migrations on a real project consider Flyway or Supabase migrations workflows.
