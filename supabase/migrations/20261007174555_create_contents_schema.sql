-- Phase 2: content model for the parent education information MVP.
-- Public roles can read only approved, visible, unexpired content; ingestion writes remain server-only.

BEGIN;

CREATE TYPE public.content_category AS ENUM (
  'daily_news',
  'edb_official',
  'weekly_topic',
  'study_skill',
  'health_tip',
  'parenting_eq'
);

CREATE TYPE public.content_status AS ENUM (
  'draft',
  'published',
  'archived'
);

CREATE TABLE public.contents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category public.content_category NOT NULL,
  title text NOT NULL
    CHECK (char_length(btrim(title)) BETWEEN 1 AND 200),
  summary text NOT NULL
    CHECK (char_length(btrim(summary)) BETWEEN 60 AND 100),
  source_name text NOT NULL
    CHECK (char_length(btrim(source_name)) BETWEEN 1 AND 120),
  source_url text NOT NULL
    CHECK (source_url ~* '^https?://'),
  status public.content_status NOT NULL DEFAULT 'draft',
  is_visible boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  CONSTRAINT contents_daily_news_expiry_check
    CHECK (
      category <> 'daily_news'
      OR expires_at = created_at + INTERVAL '24 hours'
    )
);

CREATE INDEX contents_category_created_at_idx
  ON public.contents (category, created_at DESC);

CREATE OR REPLACE FUNCTION public.enforce_daily_news_expiry()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $function$
BEGIN
  IF NEW.category = 'daily_news' THEN
    NEW.expires_at := NEW.created_at + INTERVAL '24 hours';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER contents_daily_news_expiry_trigger
  BEFORE INSERT OR UPDATE OF category, created_at, expires_at
  ON public.contents
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_daily_news_expiry();

ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;

-- Remove any inherited client write grants; public visitors only need SELECT.
REVOKE ALL ON TABLE public.contents FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE ON TYPE public.content_category, public.content_status
  TO anon, authenticated, service_role;
GRANT SELECT ON TABLE public.contents TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.contents TO service_role;

CREATE POLICY "public_read_approved_contents"
  ON public.contents
  FOR SELECT
  TO anon, authenticated
  USING (
    status = 'published'
    AND is_visible = true
    AND (expires_at IS NULL OR expires_at > now())
  );

COMMIT;
