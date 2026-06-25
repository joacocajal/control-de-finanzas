-- ============================================================
-- Ascend — Detalle por serie en ejercicios de rutina
-- Migración: 00022_routine_sets_detail.sql
--
-- sets_detail: array JSON [{ "reps": number|null, "weight": number|null }, ...]
-- Permite que cada serie tenga sus propias reps y peso (no todas iguales).
-- Se mantiene target_sets/target_reps/target_weight para compatibilidad.
-- ============================================================

ALTER TABLE public.routine_exercises
  ADD COLUMN IF NOT EXISTS sets_detail jsonb;
