-- ============================================================
-- Ascend — Reportes Mensuales
-- Migración: 00009_monthly_reports.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS public.monthly_reports (
  id                  uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year                integer     NOT NULL,
  month               integer     NOT NULL CHECK (month BETWEEN 1 AND 12),
  total_income        numeric     NOT NULL DEFAULT 0,
  total_expenses      numeric     NOT NULL DEFAULT 0,
  balance             numeric     NOT NULL DEFAULT 0,
  savings_rate        numeric     NOT NULL DEFAULT 0,
  top_categories      jsonb       NOT NULL DEFAULT '[]',
  wallet_breakdown    jsonb       NOT NULL DEFAULT '[]',
  transaction_count   integer     NOT NULL DEFAULT 0,
  generated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, year, month)
);

ALTER TABLE public.monthly_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reports_select_own" ON public.monthly_reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "reports_insert_own" ON public.monthly_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reports_update_own" ON public.monthly_reports
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "reports_delete_own" ON public.monthly_reports
  FOR DELETE USING (auth.uid() = user_id);
