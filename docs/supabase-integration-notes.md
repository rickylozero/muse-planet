# Supabase integration notes

Last reviewed: 2026-10-08

These notes record the primary-source guidance used for Phase 2; verify vendor docs again before changing authentication or publishing behavior.

## Decisions for this project

- Use `@supabase/supabase-js` from the Next.js Node.js Route Handler. The current ingestion route has no user cookie/session auth, so it does not need the SSR cookie adapter.
- Use the modern Supabase secret API key in `SUPABASE_SECRET_KEY` on the server only (legacy `service_role` credentials remain accepted by Supabase); do not prefix it with `NEXT_PUBLIC_`, log it, or commit its value.
- Enable RLS for the exposed `public.contents` table. Revoke client grants, grant only `SELECT` to `anon` and `authenticated`, and require the row policy to match `published`, `is_visible`, and not expired. Trusted writes use the server-held secret API key after the separate `X-API-Key` check.
- Keep SQL changes in `supabase/migrations/` so the database shape is versioned with the project.
- `SUPABASE_URL` may be the project root URL or the standard Data API base ending in `/rest/v1`; the server helper strips only that exact suffix because Supabase JS appends `/rest/v1` itself. Other non-root paths, credentials, query strings, hashes, and non-HTTPS URLs are rejected.

## Official references

- [Use Supabase with Next.js](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs) — client installation, environment variables and production credential handling.
- [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys) — publishable vs secret keys; secret keys bypass RLS and belong only in server-controlled components.
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) — grants and policies both govern access; exposed tables should enable RLS and explicitly revoke unused client grants.
- [Database migrations](https://supabase.com/docs/guides/deployment/database-migrations) — track DDL in ordered migration files and use them to deploy schema changes.
