-- ============================================================
-- Ascend — Sesiones de aprendizaje cronometradas (FASE 1)
-- Migración: 00013_learning_sessions.sql
-- ============================================================

-- Columna de horas acumuladas por skill (si no existe)
ALTER TABLE public.aprendizaje_skills
  ADD COLUMN IF NOT EXISTS total_hours_practiced numeric DEFAULT 0;

-- Tabla de sesiones
CREATE TABLE IF NOT EXISTS public.learning_sessions (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id         uuid        NOT NULL REFERENCES public.aprendizaje_skills(id) ON DELETE CASCADE,
  started_at       timestamptz NOT NULL DEFAULT now(),
  finished_at      timestamptz,
  duration_minutes integer,
  planned_minutes  integer,
  was_completed    boolean     DEFAULT false,
  what_studied     text,
  resource_id      uuid,  -- FK a skill_resources se agrega en 00014
  notes            text,
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE public.learning_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users access own learning sessions"
  ON public.learning_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Función: suma horas al terminar una sesión
CREATE OR REPLACE FUNCTION public.sync_skill_hours()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.finished_at IS NOT NULL AND OLD.finished_at IS NULL AND NEW.duration_minutes IS NOT NULL THEN
    UPDATE public.aprendizaje_skills
    SET total_hours_practiced = total_hours_practiced + (NEW.duration_minutes::numeric / 60)
    WHERE id = NEW.skill_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER learning_session_finished
  AFTER UPDATE ON public.learning_sessions
  FOR EACH ROW EXECUTE FUNCTION public.sync_skill_hours();
