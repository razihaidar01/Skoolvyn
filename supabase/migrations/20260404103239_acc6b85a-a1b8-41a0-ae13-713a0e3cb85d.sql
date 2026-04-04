
-- Drop the security definer view entirely
DROP VIEW IF EXISTS public.institution_code_lookup;

-- Instead, create a security definer FUNCTION that returns only safe columns
CREATE OR REPLACE FUNCTION public.lookup_institution_by_code(p_code text)
RETURNS TABLE(id uuid, name text, institution_code text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT i.id, i.name, i.institution_code
  FROM institutions i
  WHERE i.institution_code = p_code;
$$;

-- Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION public.lookup_institution_by_code(text) TO anon;
GRANT EXECUTE ON FUNCTION public.lookup_institution_by_code(text) TO authenticated;
