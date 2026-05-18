-- ============================================================
-- Ascend — Wallets (separación por wallet/negocio)
-- Migración: 00006_wallets.sql
-- ============================================================

-- ─── Tabla wallets ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.wallets (
  id         uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text        NOT NULL,
  type       text        NOT NULL CHECK (type IN ('personal','negocio')),
  color      text        NOT NULL DEFAULT '#3b82f6',
  icon       text,
  is_default boolean     NOT NULL DEFAULT false,
  archived   boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users access own wallets" ON public.wallets
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS wallets_user_id_idx ON public.wallets(user_id);

-- ─── Agregar wallet_id a transactions ────────────────────────

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS wallet_id uuid REFERENCES public.wallets(id) ON DELETE RESTRICT;

-- ─── Migración de datos existentes ───────────────────────────
-- 1. Crear wallet "Personal" para cada usuario con transacciones existentes

INSERT INTO public.wallets (user_id, name, type, color, is_default)
SELECT DISTINCT t.user_id, 'Personal', 'personal', '#34d399', true
FROM public.transactions t
WHERE NOT EXISTS (
  SELECT 1 FROM public.wallets w
  WHERE w.user_id = t.user_id AND w.name = 'Personal'
)
ON CONFLICT DO NOTHING;

-- 2. Asignar todas las transacciones existentes a la wallet Personal del usuario

UPDATE public.transactions t
SET wallet_id = w.id
FROM public.wallets w
WHERE w.user_id = t.user_id
  AND w.name = 'Personal'
  AND w.is_default = true
  AND t.wallet_id IS NULL;
