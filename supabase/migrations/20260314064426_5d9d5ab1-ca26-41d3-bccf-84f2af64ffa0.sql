
-- Create student_documents table
CREATE TABLE public.student_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES public.institutions(id),
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS
ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "institution_isolation" ON public.student_documents
  FOR ALL USING (
    (institution_id = get_my_institution_id()) OR is_super_admin()
  );

-- Storage bucket for student documents
INSERT INTO storage.buckets (id, name, public) VALUES ('student-documents', 'student-documents', false);

-- Storage RLS policies
CREATE POLICY "Authenticated users can upload student documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'student-documents');

CREATE POLICY "Authenticated users can view student documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'student-documents');

CREATE POLICY "Authenticated users can delete student documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'student-documents');
