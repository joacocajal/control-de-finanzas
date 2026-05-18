-- ============================================================
-- Ascend — Diario Personal (FASE 7)
-- Migración: 00012_journal.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS public.journal_entries (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date        date        NOT NULL DEFAULT current_date,
  mood              integer     CHECK (mood BETWEEN 1 AND 5),
  what_i_did        text,
  what_i_achieved   text,
  how_i_felt        text,
  gratitude         text,
  tomorrow_focus    text,
  free_notes        text,
  daily_snapshot    jsonb,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, entry_date)
);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users access own journal" ON public.journal_entries
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_journal_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER journal_updated_at
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_journal_updated_at();
