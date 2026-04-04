
-- ============================================================
-- FIX 1: users table - prevent self-escalation of role/institution_id
-- ============================================================

-- Drop the overly permissive own_profile ALL policy
DROP POLICY IF EXISTS "own_profile" ON public.users;

-- Replace with separate SELECT and UPDATE policies
CREATE POLICY "own_profile_select" ON public.users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "own_profile_insert" ON public.users
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "own_profile_update" ON public.users
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role IS NOT DISTINCT FROM (SELECT u.role FROM public.users u WHERE u.id = auth.uid())
    AND institution_id IS NOT DISTINCT FROM (SELECT u.institution_id FROM public.users u WHERE u.id = auth.uid())
  );

CREATE POLICY "own_profile_delete" ON public.users
  FOR DELETE USING (false);

-- ============================================================
-- FIX 2: get_my_institution_id - add search_path
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_my_institution_id()
  RETURNS uuid
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
  SELECT institution_id FROM users WHERE id = auth.uid();
$$;

-- Also fix get_my_role
CREATE OR REPLACE FUNCTION public.get_my_role()
  RETURNS text
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$;

-- ============================================================
-- FIX 3: student-documents storage - institution-scoped policies
-- ============================================================

-- Drop overly broad policies
DROP POLICY IF EXISTS "Authenticated users can view student documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload student documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete student documents" ON storage.objects;

-- New policies: scope access by institution_id in the file path
-- File path convention: {institution_id}/{student_id}/{filename}
CREATE POLICY "Institution users can view student documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'student-documents'
    AND (storage.foldername(name))[1] = (SELECT get_my_institution_id()::text)
  );

CREATE POLICY "Institution users can upload student documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'student-documents'
    AND (storage.foldername(name))[1] = (SELECT get_my_institution_id()::text)
  );

CREATE POLICY "Institution users can delete student documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'student-documents'
    AND (storage.foldername(name))[1] = (SELECT get_my_institution_id()::text)
  );

-- ============================================================
-- FIX 4: institutions anon lookup - restrict to minimal columns via RLS
-- Replace the broad anon policy with a narrow one
-- ============================================================

DROP POLICY IF EXISTS "institutions_anon_code_lookup" ON public.institutions;

-- Create a view for anon code lookup with only safe columns
CREATE OR REPLACE VIEW public.institution_code_lookup AS
  SELECT id, name, institution_code
  FROM public.institutions
  WHERE institution_code IS NOT NULL;

-- Grant anon access to the view
GRANT SELECT ON public.institution_code_lookup TO anon;

-- Re-create anon policy but with false (force use of view instead)
-- Actually we still need anon to be able to SELECT for the registration flow
-- But restrict to only when they provide a specific code
CREATE POLICY "institutions_anon_code_lookup_restricted"
  ON public.institutions
  FOR SELECT
  TO anon
  USING (false);
