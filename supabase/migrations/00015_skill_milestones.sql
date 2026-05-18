-- ============================================================
-- Ascend — Roadmap por skill / hitos (FASE 3)
-- Migración: 00015_skill_milestones.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS public.skill_milestones (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id     uuid        NOT NULL REFERENCES public.aprendizaje_skills(id) ON DELETE CASCADE,
  title        text        NOT NULL,
  description  text,
  order_index  integer     NOT NULL,
  completed    boolean     DEFAULT false,
  completed_at timestamptz,
  created_by   text        DEFAULT 'user' CHECK (created_by IN ('user','ai')),
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE public.skill_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users access own milestones"
  ON public.skill_milestones
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Trigger: setea completed_at cuando se completa
CREATE OR REPLACE FUNCTION public.set_milestone_completed_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.completed = true AND OLD.completed = false THEN
    NEW.completed_at = now();
  ELSIF NEW.completed = false THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER milestone_completed_at
  BEFORE UPDATE ON public.skill_milestones
  FOR EACH ROW EXECUTE FUNCTION public.set_milestone_completed_at();
