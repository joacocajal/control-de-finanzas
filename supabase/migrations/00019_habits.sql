-- ============================================================
-- Ascend — Hábitos (grilla estilo "casa de apuestas")
-- Migración: 00019_habits.sql
-- ============================================================

-- ── Hábitos ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.habits (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         text        NOT NULL,
  emoji        text        NOT NULL DEFAULT '✅',
  color        text        NOT NULL DEFAULT '#34d399',
  order_index  integer     NOT NULL DEFAULT 0,
  archived     boolean     NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS habits_user_id_idx ON public.habits(user_id);

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users access own habits" ON public.habits
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── Registros diarios ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.habit_logs (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id    uuid        NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date    date        NOT NULL DEFAULT current_date,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (habit_id, log_date)
);

CREATE INDEX IF NOT EXISTS habit_logs_user_date_idx ON public.habit_logs(user_id, log_date);
CREATE INDEX IF NOT EXISTS habit_logs_habit_id_idx ON public.habit_logs(habit_id);

ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users access own habit_logs" ON public.habit_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
