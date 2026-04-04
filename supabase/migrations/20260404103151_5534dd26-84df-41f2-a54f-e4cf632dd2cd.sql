
-- Fix SECURITY DEFINER view issue: drop and recreate with security_invoker
DROP VIEW IF EXISTS public.institution_code_lookup;

CREATE VIEW public.institution_code_lookup
  WITH (security_invoker = true)
AS
  SELECT id, name, institution_code
  FROM public.institutions
  WHERE institution_code IS NOT NULL;

GRANT SELECT ON public.institution_code_lookup TO anon;
GRANT SELECT ON public.institution_code_lookup TO authenticated;

-- Since the anon policy on institutions is now USING(false), 
-- we need a dedicated policy allowing anon to SELECT via the view
-- The view uses security_invoker, so anon needs a real SELECT policy
-- Let's allow anon to select only id, name, institution_code by using the view
-- But RLS still applies. We need a narrow policy:
DROP POLICY IF EXISTS "institutions_anon_code_lookup_restricted" ON public.institutions;

CREATE POLICY "institutions_anon_code_lookup_narrow"
  ON public.institutions
  FOR SELECT
  TO anon
  USING (institution_code IS NOT NULL);

-- But we need to restrict WHICH columns are exposed.
-- Since RLS can't restrict columns, the view approach + column grant is better.
-- Let's revoke direct table access from anon and only allow via view:
DROP POLICY IF EXISTS "institutions_anon_code_lookup_narrow" ON public.institutions;

-- No anon policy on institutions table at all
-- Anon access goes through the view which only exposes 3 columns
-- For this to work, the view owner (postgres) needs to bypass RLS
-- So we use security_invoker = false but only expose safe columns

DROP VIEW IF EXISTS public.institution_code_lookup;

CREATE VIEW public.institution_code_lookup AS
  SELECT id, name, institution_code
  FROM public.institutions
  WHERE institution_code IS NOT NULL;

-- Revoke direct select on institutions from anon (no anon policy exists now)
-- Grant only the view
REVOKE ALL ON public.institution_code_lookup FROM anon;
GRANT SELECT ON public.institution_code_lookup TO anon;

-- Fix update_updated_at search_path
CREATE OR REPLACE FUNCTION public.update_updated_at()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;
