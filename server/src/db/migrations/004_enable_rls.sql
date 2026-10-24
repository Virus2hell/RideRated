-- Turn on Row Level Security for every table we own in the public schema.
--
-- Why: Supabase exposes the public schema through its auto-generated REST "Data API".
-- With RLS off, anyone with the project's public anon key could read or change any row
-- (including users.email and users.password_hash).
-- RLS on + no policies = the Data API can't see or change any row.
--
-- Our Express API is not affected: it connects as the role that OWNS these tables,
-- and table owners skip RLS (we never use FORCE ROW LEVEL SECURITY).
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tableowner = current_user  -- skip tables owned by extensions/Supabase
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END $$;

-- ⚠️ Every NEW table you create in a future migration needs this line too:
--   ALTER TABLE your_new_table ENABLE ROW LEVEL SECURITY;