
-- Add institution_code column for staff registration lookup
ALTER TABLE public.institutions 
ADD COLUMN IF NOT EXISTS institution_code text UNIQUE;

-- Generate institution codes for existing institutions
UPDATE public.institutions 
SET institution_code = UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', ''), 1, 8))
WHERE institution_code IS NULL;

-- Create a function to auto-generate institution_code on insert
CREATE OR REPLACE FUNCTION public.generate_institution_code()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.institution_code IS NULL THEN
    NEW.institution_code := UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', ''), 1, 8));
  END IF;
  RETURN NEW;
END;
$function$;

-- Attach trigger
DROP TRIGGER IF EXISTS set_institution_code ON public.institutions;
CREATE TRIGGER set_institution_code
  BEFORE INSERT ON public.institutions
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_institution_code();

-- Allow public read of institution_code for registration lookup (anon users need to verify code)
CREATE POLICY "anon_lookup_institution_code" ON public.institutions
  FOR SELECT TO anon
  USING (true);
