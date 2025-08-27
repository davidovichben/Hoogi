-- Enable row level security and add per-user policies for questionnaires
-- Non-destructive: only adds if not present; safe to run multiple times

-- 1) Ensure RLS is enabled
ALTER TABLE IF EXISTS public.questionnaires ENABLE ROW LEVEL SECURITY;

-- 2) Ensure owner_id column exists (fallback to user_id if schema uses that)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'questionnaires' AND column_name = 'owner_id'
  ) THEN
    BEGIN
      ALTER TABLE public.questionnaires ADD COLUMN owner_id uuid;
      -- If there is a user_id column, initialize owner_id from it
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'questionnaires' AND column_name = 'user_id'
      ) THEN
        UPDATE public.questionnaires SET owner_id = user_id WHERE owner_id IS NULL;
      END IF;
    EXCEPTION WHEN duplicate_column THEN
      -- ignore
      NULL;
    END;
  END IF;
END $$;

-- 3) Helper function: coalesce owner id (owner_id or user_id)
CREATE OR REPLACE FUNCTION public.questionnaire_owner_id(q public.questionnaires)
RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT COALESCE(q.owner_id, q.user_id)
$$;

-- 4) Policies
-- Drop pre-existing policies with the same names to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='questionnaires' AND policyname='q_select_own_or_published') THEN
    DROP POLICY q_select_own_or_published ON public.questionnaires;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='questionnaires' AND policyname='q_insert_as_owner') THEN
    DROP POLICY q_insert_as_owner ON public.questionnaires;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='questionnaires' AND policyname='q_update_own') THEN
    DROP POLICY q_update_own ON public.questionnaires;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='questionnaires' AND policyname='q_delete_own') THEN
    DROP POLICY q_delete_own ON public.questionnaires;
  END IF;
END $$;

-- Allow owners to see their own rows; allow public access only to published rows via token fetch on other endpoints
CREATE POLICY q_select_own_or_published ON public.questionnaires
FOR SELECT
USING (
  -- Authenticated users: only their own rows
  (auth.role() = 'authenticated' AND questionnaire_owner_id(questionnaires) = auth.uid())
  OR
  -- Anonymous (public) access: allow only published rows
  (auth.role() = 'anon' AND COALESCE(is_published, false) = true)
);

-- Insert: authenticated users can insert; default owner_id to auth.uid()
CREATE POLICY q_insert_as_owner ON public.questionnaires
FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Update: only owner can update their rows
CREATE POLICY q_update_own ON public.questionnaires
FOR UPDATE TO authenticated
USING (questionnaire_owner_id(questionnaires) = auth.uid())
WITH CHECK (questionnaire_owner_id(questionnaires) = auth.uid());

-- Delete: only owner can delete their rows
CREATE POLICY q_delete_own ON public.questionnaires
FOR DELETE TO authenticated
USING (questionnaire_owner_id(questionnaires) = auth.uid());

-- 5) Trigger to auto-fill owner_id on insert if null
CREATE OR REPLACE FUNCTION public.set_questionnaire_owner()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.owner_id IS NULL THEN
    NEW.owner_id := auth.uid();
  END IF;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS trg_set_questionnaire_owner ON public.questionnaires;
CREATE TRIGGER trg_set_questionnaire_owner
BEFORE INSERT ON public.questionnaires
FOR EACH ROW
EXECUTE FUNCTION public.set_questionnaire_owner();


