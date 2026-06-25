-- ============================================================
-- Ascend — Focus (sesiones de trabajo concentrado)
-- Migración: 00023_focus_sessions.sql
--
-- Cada fila es una sesión de focus. Mientras está activa, ended_at
-- es NULL. Al terminar se setea ended_at + duration_seconds.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.focus_sessions (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label            text,
  started_at       timestamptz NOT NULL DEFAULT now(),
  ended_at         timestamptz,
  duration_seconds integer,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS focus_sessions_user_started_idx ON public.focus_sessions(user_id, started_at DESC);

ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users access own focus_sessions" ON public.focus_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
