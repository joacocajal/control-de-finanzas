-- ============================================================
-- Ascend — Financial Goals
-- Migración: 00004_financial_goals.sql
-- Fecha: 2026-05-17
-- Descripción: Objetivos de ahorro personales con seguimiento
--   de progreso, fecha límite y categoría libre.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.financial_goals (
  id              uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            text        NOT NULL,
  target_amount   numeric     NOT NULL CHECK (target_amount > 0),
  current_amount  numeric     NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  deadline        date,
  category        text,
  notes           text,
  completed       boolean     NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS financial_goals_user_id_idx ON public.financial_goals(user_id);

ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "financial_goals_all" ON public.financial_goals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
