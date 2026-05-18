-- ============================================================
-- Ascend — Recursos por skill (FASE 2)
-- Migración: 00014_skill_resources.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS public.skill_resources (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id         uuid        NOT NULL REFERENCES public.aprendizaje_skills(id) ON DELETE CASCADE,
  resource_type    text        NOT NULL CHECK (resource_type IN ('youtube','libro','curso','articulo','podcast','otro')),
  title            text        NOT NULL,
  url              text,
  author           text,
  duration_minutes integer,
  cost             numeric     DEFAULT 0,
  priority         integer     DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  status           text        DEFAULT 'pendiente' CHECK (status IN ('pendiente','en_progreso','consumido','descartado')),
  rating           integer     CHECK (rating BETWEEN 1 AND 5),
  notes            text,
  started_at       timestamptz,
  finished_at      timestamptz,
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE public.skill_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users access own resources"
  ON public.skill_resources
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Ahora que skill_resources existe, agregar FK en learning_sessions
ALTER TABLE public.learning_sessions
  ADD CONSTRAINT learning_sessions_resource_id_fkey
  FOREIGN KEY (resource_id) REFERENCES public.skill_resources(id) ON DELETE SET NULL;
