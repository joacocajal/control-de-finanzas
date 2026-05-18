-- ============================================================
-- Ascend — Workout Feeling Notes (FASE 5)
-- Migración: 00010_workout_feeling.sql
-- ============================================================

ALTER TABLE public.workout_sessions
  ADD COLUMN IF NOT EXISTS energy_level        integer CHECK (energy_level BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS sleep_hours         numeric  CHECK (sleep_hours >= 0),
  ADD COLUMN IF NOT EXISTS muscle_soreness     integer CHECK (muscle_soreness BETWEEN 0 AND 5),
  ADD COLUMN IF NOT EXISTS session_feeling     text    CHECK (session_feeling IN ('mal','regular','bien','excelente')),
  ADD COLUMN IF NOT EXISTS post_session_notes  text;
