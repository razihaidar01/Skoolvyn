
-- 1. Helper function: check if current user has any of the given roles
CREATE OR REPLACE FUNCTION public.has_role_any(_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
      AND r.name = ANY(_roles)
  );
$$;

-- 2. Fix STAFF table: restrict sensitive financial data to admin/HR roles
DROP POLICY IF EXISTS "institution_isolation" ON public.staff;

CREATE POLICY "staff_select_admin" ON public.staff
  FOR SELECT TO authenticated
  USING (
    is_super_admin()
    OR (
      institution_id = get_my_institution_id()
      AND (
        has_role_any(ARRAY['institution_admin','principal','hr_manager','hod','accountant'])
        OR user_id = auth.uid()
      )
    )
  );

CREATE POLICY "staff_modify_admin" ON public.staff
  FOR ALL TO authenticated
  USING (
    is_super_admin()
    OR (
      institution_id = get_my_institution_id()
      AND has_role_any(ARRAY['institution_admin','principal','hr_manager'])
    )
  );

-- 3. Fix STUDENTS table: restrict PII to admin/faculty roles + own record
DROP POLICY IF EXISTS "institution_isolation" ON public.students;

CREATE POLICY "students_select" ON public.students
  FOR SELECT TO authenticated
  USING (
    is_super_admin()
    OR (
      institution_id = get_my_institution_id()
      AND (
        has_role_any(ARRAY['institution_admin','principal','hod','faculty','hr_manager','accountant','counselor','hostel_warden'])
        OR user_id = auth.uid()
        OR id IN (SELECT ps.student_id FROM parent_student ps WHERE ps.parent_user_id = auth.uid())
      )
    )
  );

CREATE POLICY "students_modify" ON public.students
  FOR ALL TO authenticated
  USING (
    is_super_admin()
    OR (
      institution_id = get_my_institution_id()
      AND has_role_any(ARRAY['institution_admin','principal','hr_manager'])
    )
  );

-- 4. Fix USERS table: tighten same_institution_users to admin roles only
DROP POLICY IF EXISTS "same_institution_users" ON public.users;

CREATE POLICY "same_institution_admin_select" ON public.users
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR is_super_admin()
    OR (
      institution_id = get_my_institution_id()
      AND has_role_any(ARRAY['institution_admin','principal','hr_manager','hod'])
    )
  );

-- 5. Fix ADMISSIONS table: restrict to admin/office roles
DROP POLICY IF EXISTS "institution_isolation" ON public.admissions;

CREATE POLICY "admissions_select" ON public.admissions
  FOR SELECT TO authenticated
  USING (
    is_super_admin()
    OR (
      institution_id = get_my_institution_id()
      AND has_role_any(ARRAY['institution_admin','principal','office_staff','hr_manager','counselor'])
    )
  );

CREATE POLICY "admissions_modify" ON public.admissions
  FOR ALL TO authenticated
  USING (
    is_super_admin()
    OR (
      institution_id = get_my_institution_id()
      AND has_role_any(ARRAY['institution_admin','principal','office_staff'])
    )
  );

-- 6. Fix FEE_PAYMENTS table: restrict to accountant/admin + student's own
DROP POLICY IF EXISTS "institution_isolation" ON public.fee_payments;

CREATE POLICY "fee_payments_select" ON public.fee_payments
  FOR SELECT TO authenticated
  USING (
    is_super_admin()
    OR (
      institution_id = get_my_institution_id()
      AND (
        has_role_any(ARRAY['institution_admin','principal','accountant'])
        OR student_id IN (SELECT s.id FROM students s WHERE s.user_id = auth.uid())
        OR student_id IN (SELECT ps.student_id FROM parent_student ps WHERE ps.parent_user_id = auth.uid())
      )
    )
  );

CREATE POLICY "fee_payments_modify" ON public.fee_payments
  FOR ALL TO authenticated
  USING (
    is_super_admin()
    OR (
      institution_id = get_my_institution_id()
      AND has_role_any(ARRAY['institution_admin','accountant'])
    )
  );

-- 7. Fix STUDENT_FEES table: restrict to admin/accountant + own
DROP POLICY IF EXISTS "institution_isolation" ON public.student_fees;

CREATE POLICY "student_fees_select" ON public.student_fees
  FOR SELECT TO authenticated
  USING (
    is_super_admin()
    OR (
      institution_id = get_my_institution_id()
      AND (
        has_role_any(ARRAY['institution_admin','principal','accountant'])
        OR student_id IN (SELECT s.id FROM students s WHERE s.user_id = auth.uid())
        OR student_id IN (SELECT ps.student_id FROM parent_student ps WHERE ps.parent_user_id = auth.uid())
      )
    )
  );

CREATE POLICY "student_fees_modify" ON public.student_fees
  FOR ALL TO authenticated
  USING (
    is_super_admin()
    OR (
      institution_id = get_my_institution_id()
      AND has_role_any(ARRAY['institution_admin','accountant'])
    )
  );

-- 8. Fix ALUMNI table: restrict contact info to admin roles
DROP POLICY IF EXISTS "institution_isolation" ON public.alumni;

CREATE POLICY "alumni_select" ON public.alumni
  FOR SELECT TO authenticated
  USING (
    is_super_admin()
    OR (
      institution_id = get_my_institution_id()
      AND has_role_any(ARRAY['institution_admin','principal','hr_manager','office_staff'])
    )
  );

CREATE POLICY "alumni_modify" ON public.alumni
  FOR ALL TO authenticated
  USING (
    is_super_admin()
    OR (
      institution_id = get_my_institution_id()
      AND has_role_any(ARRAY['institution_admin','principal'])
    )
  );

-- 9. Fix PLACEMENT_COMPANIES: restrict to admin/placement roles
DROP POLICY IF EXISTS "institution_isolation" ON public.placement_companies;

CREATE POLICY "placement_companies_select" ON public.placement_companies
  FOR SELECT TO authenticated
  USING (
    is_super_admin()
    OR (
      institution_id = get_my_institution_id()
      AND has_role_any(ARRAY['institution_admin','principal','hr_manager','hod','faculty'])
    )
  );

CREATE POLICY "placement_companies_modify" ON public.placement_companies
  FOR ALL TO authenticated
  USING (
    is_super_admin()
    OR (
      institution_id = get_my_institution_id()
      AND has_role_any(ARRAY['institution_admin','principal'])
    )
  );

-- 10. Add missing RLS policy for SUBJECTS table
CREATE POLICY "subjects_institution_isolation" ON public.subjects
  FOR ALL TO authenticated
  USING (
    institution_id = get_my_institution_id()
    OR is_super_admin()
  );
