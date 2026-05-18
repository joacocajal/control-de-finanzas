-- ============================================================
-- Ascend — Multi-moneda (ARS / USD)
-- Migración: 00008_multicurrency.sql
-- ============================================================

-- ─── Campos en transactions ───────────────────────────────────

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS currency      text DEFAULT 'ARS' CHECK (currency IN ('ARS','USD')),
  ADD COLUMN IF NOT EXISTS exchange_rate numeric,        -- tipo de cambio al momento del registro
  ADD COLUMN IF NOT EXISTS amount_ars    numeric,        -- snapshot en ARS
  ADD COLUMN IF NOT EXISTS amount_usd    numeric;        -- snapshot en USD

-- Backfill: para transacciones existentes amount_ars = amount (ya están en ARS)
UPDATE public.transactions
SET amount_ars = amount
WHERE amount_ars IS NULL;

-- ─── Tabla de tipos de cambio ─────────────────────────────────

CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id         uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date       date        NOT NULL,
  ars_to_usd numeric     NOT NULL CHECK (ars_to_usd > 0),
  source     text        NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (date, source)
);

ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone authenticated can read rates" ON public.exchange_rates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "anyone authenticated can write rates" ON public.exchange_rates
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
