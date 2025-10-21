-- Archive support for safety_cases

-- 1) Columns
ALTER TABLE public.safety_cases
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_by uuid REFERENCES public.profiles(user_id),
  ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false;

-- 2) Index for queries filtering archived items
CREATE INDEX IF NOT EXISTS safety_cases_is_archived_idx ON public.safety_cases(is_archived);

-- 3) Trigger to keep is_archived in sync with archived_at
CREATE OR REPLACE FUNCTION public.set_safety_case_is_archived()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.archived_at IS NOT NULL THEN
    NEW.is_archived := true;
  ELSE
    NEW.is_archived := false;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_safety_case_is_archived ON public.safety_cases;
CREATE TRIGGER trg_set_safety_case_is_archived
BEFORE INSERT OR UPDATE OF archived_at ON public.safety_cases
FOR EACH ROW
EXECUTE FUNCTION public.set_safety_case_is_archived();

-- 4) RLS: allow owner or admin to update archive fields
-- Note: Replace created_by with the correct owner column if different
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'safety_cases' AND column_name = 'created_by'
  ) THEN
    DROP POLICY IF EXISTS "owner admin update safety_cases" ON public.safety_cases;
    CREATE POLICY "owner admin update safety_cases"
    ON public.safety_cases FOR UPDATE
    USING (created_by = auth.uid() OR public.is_admin())
    WITH CHECK (created_by = auth.uid() OR public.is_admin());
  END IF;
END $$;


