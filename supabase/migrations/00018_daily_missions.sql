-- ─── FASE 1: Sistema de misiones diarias gamificado ─────────────────────────

-- Misiones del día (generadas por IA, usuario o recurrentes)
CREATE TABLE IF NOT EXISTS public.daily_missions (
  id              uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_date    date        NOT NULL DEFAULT current_date,
  title           text        NOT NULL,
  description     text,
  category        text        NOT NULL CHECK (category IN ('fisico','mental','hogar','negocio','custom')),
  difficulty      text        NOT NULL CHECK (difficulty IN ('facil','medio','dificil')) DEFAULT 'medio',
  xp_reward       integer     NOT NULL DEFAULT 20,
  completed       boolean     NOT NULL DEFAULT false,
  completed_at    timestamptz,
  source          text        NOT NULL CHECK (source IN ('ai','user','recurring')) DEFAULT 'ai',
  ai_reasoning    text,
  order_index     integer     NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, mission_date, title)
);

CREATE INDEX IF NOT EXISTS daily_missions_user_date_idx ON public.daily_missions (user_id, mission_date);

ALTER TABLE public.daily_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users own daily_missions" ON public.daily_missions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- Misiones recurrentes definidas por el usuario
CREATE TABLE IF NOT EXISTS public.recurring_missions (
  id              uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           text        NOT NULL,
  description     text,
  category        text        NOT NULL CHECK (category IN ('fisico','mental','hogar','negocio','custom')),
  difficulty      text        NOT NULL CHECK (difficulty IN ('facil','medio','dificil')) DEFAULT 'medio',
  xp_reward       integer     NOT NULL DEFAULT 20,
  days_of_week    integer[]   NOT NULL DEFAULT '{1,2,3,4,5,6,7}',
  is_active       boolean     NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.recurring_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users own recurring_missions" ON public.recurring_missions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- XP, nivel y racha del usuario
CREATE TABLE IF NOT EXISTS public.user_progression (
  user_id                       uuid        NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp                      integer     NOT NULL DEFAULT 0,
  current_level                 integer     NOT NULL DEFAULT 1,
  current_streak                integer     NOT NULL DEFAULT 0,
  longest_streak                integer     NOT NULL DEFAULT 0,
  last_streak_date              date,
  total_missions_completed      integer     NOT NULL DEFAULT 0,
  strict_mode_enabled           boolean     NOT NULL DEFAULT false,
  strict_mode_pending_disable_at timestamptz,
  created_at                    timestamptz NOT NULL DEFAULT now(),
  updated_at                    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_progression ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users own progression" ON public.user_progression
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- Logros desbloqueados
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id              uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_key text        NOT NULL,
  unlocked_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_key)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users own achievements" ON public.user_achievements
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- Trigger: crear user_progression automáticamente al registrar usuario nuevo
CREATE OR REPLACE FUNCTION public.create_user_progression()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_progression (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_progression ON auth.users;
CREATE TRIGGER on_auth_user_created_progression
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_user_progression();

-- Backfill: usuarios existentes
INSERT INTO public.user_progression (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
