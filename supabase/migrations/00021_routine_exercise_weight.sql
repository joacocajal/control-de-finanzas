-- ============================================================
-- Ascend — Peso objetivo por ejercicio de rutina
-- Migración: 00021_routine_exercise_weight.sql
-- ============================================================

ALTER TABLE public.routine_exercises
  ADD COLUMN IF NOT EXISTS target_weight numeric;
