-- ============================================================
-- Ascend — Plantillas de Rutinas (FASE 6)
-- Migración: 00011_routine_templates.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS public.routine_templates (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL,
  category      text        NOT NULL DEFAULT 'gym',
  split_type    text,
  level         text        CHECK (level IN ('principiante','intermedio','avanzado')),
  days_per_week integer,
  description   text,
  display_order integer     NOT NULL DEFAULT 0,
  is_active     boolean     NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.routine_template_exercises (
  id             uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id    uuid    NOT NULL REFERENCES public.routine_templates(id) ON DELETE CASCADE,
  day_label      text    NOT NULL,
  day_order      integer NOT NULL,
  exercise_name  text    NOT NULL,
  exercise_order integer NOT NULL,
  target_sets    integer,
  target_reps    text,
  notes          text
);

ALTER TABLE public.routine_templates           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_template_exercises  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone reads templates"
  ON public.routine_templates FOR SELECT
  USING (is_active = true);

CREATE POLICY "anyone reads template exercises"
  ON public.routine_template_exercises FOR SELECT
  USING (true);

ALTER TABLE public.workout_routines
  ADD COLUMN IF NOT EXISTS adopted_from_template_id uuid REFERENCES public.routine_templates(id);

-- ─── Seed: 3 plantillas ───────────────────────────────────────

INSERT INTO public.routine_templates (id, name, category, split_type, level, days_per_week, description, display_order) VALUES
  ('11111111-1111-1111-1111-111111111111', 'PPL 6 días',        'gym', 'push_pull_legs', 'intermedio',   6, 'Push/Pull/Legs en 2 ciclos por semana. Crea 3 rutinas (Push, Pull, Legs) que alternás durante la semana.', 1),
  ('22222222-2222-2222-2222-222222222222', 'Upper/Lower 4 días', 'gym', 'upper_lower',    'intermedio',   4, 'Split superior/inferior con variante A/B. Crea 4 rutinas que rotás durante la semana.', 2),
  ('33333333-3333-3333-3333-333333333333', 'Full Body 3 días',   'gym', 'full_body',      'principiante', 3, 'Cuerpo completo 3 veces por semana alternando Día A y Día B. Ideal para empezar.', 3)
ON CONFLICT (id) DO NOTHING;

-- ─── PPL — Push ───────────────────────────────────────────────

INSERT INTO public.routine_template_exercises
  (template_id, day_label, day_order, exercise_name, exercise_order, target_sets, target_reps, notes) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Push', 1, 'Bench Press',      1, 4, '6-8',   'Compound principal'),
  ('11111111-1111-1111-1111-111111111111', 'Push', 1, 'Incline DB Press', 2, 3, '10-12', NULL),
  ('11111111-1111-1111-1111-111111111111', 'Push', 1, 'OHP',              3, 3, '8-10',  NULL),
  ('11111111-1111-1111-1111-111111111111', 'Push', 1, 'Lateral Raises',   4, 4, '15',    NULL),
  ('11111111-1111-1111-1111-111111111111', 'Push', 1, 'Tricep Pushdown',  5, 3, '12-15', NULL);

-- ─── PPL — Pull ───────────────────────────────────────────────

INSERT INTO public.routine_template_exercises
  (template_id, day_label, day_order, exercise_name, exercise_order, target_sets, target_reps, notes) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Pull', 2, 'Deadlift',     1, 4, '5',     'Compound principal'),
  ('11111111-1111-1111-1111-111111111111', 'Pull', 2, 'Barbell Row',  2, 4, '8',     NULL),
  ('11111111-1111-1111-1111-111111111111', 'Pull', 2, 'Lat Pulldown', 3, 3, '10-12', NULL),
  ('11111111-1111-1111-1111-111111111111', 'Pull', 2, 'Face Pulls',   4, 3, '15',    NULL),
  ('11111111-1111-1111-1111-111111111111', 'Pull', 2, 'Bicep Curls',  5, 3, '12',    NULL);

-- ─── PPL — Legs ───────────────────────────────────────────────

INSERT INTO public.routine_template_exercises
  (template_id, day_label, day_order, exercise_name, exercise_order, target_sets, target_reps, notes) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Legs', 3, 'Squat',             1, 4, '6-8',   'Compound principal'),
  ('11111111-1111-1111-1111-111111111111', 'Legs', 3, 'Romanian Deadlift', 2, 3, '10',    NULL),
  ('11111111-1111-1111-1111-111111111111', 'Legs', 3, 'Leg Press',         3, 3, '12',    NULL),
  ('11111111-1111-1111-1111-111111111111', 'Legs', 3, 'Leg Curls',         4, 3, '12',    NULL),
  ('11111111-1111-1111-1111-111111111111', 'Legs', 3, 'Calf Raises',       5, 4, '15-20', NULL);

-- ─── Upper/Lower — Upper A ────────────────────────────────────

INSERT INTO public.routine_template_exercises
  (template_id, day_label, day_order, exercise_name, exercise_order, target_sets, target_reps, notes) VALUES
  ('22222222-2222-2222-2222-222222222222', 'Upper A', 1, 'Bench Press',   1, 4, '5',     'Fuerza'),
  ('22222222-2222-2222-2222-222222222222', 'Upper A', 1, 'Barbell Row',   2, 4, '5',     'Fuerza'),
  ('22222222-2222-2222-2222-222222222222', 'Upper A', 1, 'OHP',           3, 3, '8',     NULL),
  ('22222222-2222-2222-2222-222222222222', 'Upper A', 1, 'Lat Pulldown',  4, 3, '10',    NULL),
  ('22222222-2222-2222-2222-222222222222', 'Upper A', 1, 'Tricep Dips',   5, 3, '10-12', NULL),
  ('22222222-2222-2222-2222-222222222222', 'Upper A', 1, 'Barbell Curls', 6, 3, '10-12', NULL);

-- ─── Upper/Lower — Lower A ────────────────────────────────────

INSERT INTO public.routine_template_exercises
  (template_id, day_label, day_order, exercise_name, exercise_order, target_sets, target_reps, notes) VALUES
  ('22222222-2222-2222-2222-222222222222', 'Lower A', 2, 'Squat',             1, 4, '5',  'Fuerza'),
  ('22222222-2222-2222-2222-222222222222', 'Lower A', 2, 'Romanian Deadlift', 2, 3, '8',  NULL),
  ('22222222-2222-2222-2222-222222222222', 'Lower A', 2, 'Leg Press',         3, 3, '12', NULL),
  ('22222222-2222-2222-2222-222222222222', 'Lower A', 2, 'Leg Curls',         4, 3, '12', NULL),
  ('22222222-2222-2222-2222-222222222222', 'Lower A', 2, 'Calf Raises',       5, 4, '15', NULL);

-- ─── Upper/Lower — Upper B ────────────────────────────────────

INSERT INTO public.routine_template_exercises
  (template_id, day_label, day_order, exercise_name, exercise_order, target_sets, target_reps, notes) VALUES
  ('22222222-2222-2222-2222-222222222222', 'Upper B', 3, 'Incline DB Press',  1, 3, '10-12', 'Volumen'),
  ('22222222-2222-2222-2222-222222222222', 'Upper B', 3, 'Cable Row',         2, 3, '12',    NULL),
  ('22222222-2222-2222-2222-222222222222', 'Upper B', 3, 'DB Shoulder Press', 3, 3, '12',    NULL),
  ('22222222-2222-2222-2222-222222222222', 'Upper B', 3, 'Pull-ups',          4, 3, 'AMRAP', NULL),
  ('22222222-2222-2222-2222-222222222222', 'Upper B', 3, 'Tricep Extension',  5, 3, '15',    NULL),
  ('22222222-2222-2222-2222-222222222222', 'Upper B', 3, 'Hammer Curls',      6, 3, '12',    NULL);

-- ─── Upper/Lower — Lower B ────────────────────────────────────

INSERT INTO public.routine_template_exercises
  (template_id, day_label, day_order, exercise_name, exercise_order, target_sets, target_reps, notes) VALUES
  ('22222222-2222-2222-2222-222222222222', 'Lower B', 4, 'Deadlift',       1, 3, '5',         'Fuerza'),
  ('22222222-2222-2222-2222-222222222222', 'Lower B', 4, 'Leg Press',      2, 4, '10',         'Volumen'),
  ('22222222-2222-2222-2222-222222222222', 'Lower B', 4, 'Walking Lunges', 3, 3, '10/pierna',  NULL),
  ('22222222-2222-2222-2222-222222222222', 'Lower B', 4, 'Leg Curls',      4, 3, '12',         NULL),
  ('22222222-2222-2222-2222-222222222222', 'Lower B', 4, 'Calf Raises',    5, 4, '15',         NULL);

-- ─── Full Body — Día A ────────────────────────────────────────

INSERT INTO public.routine_template_exercises
  (template_id, day_label, day_order, exercise_name, exercise_order, target_sets, target_reps, notes) VALUES
  ('33333333-3333-3333-3333-333333333333', 'Día A', 1, 'Squat',        1, 3, '8',   'Compound principal'),
  ('33333333-3333-3333-3333-333333333333', 'Día A', 1, 'Bench Press',  2, 3, '8',   NULL),
  ('33333333-3333-3333-3333-333333333333', 'Día A', 1, 'Barbell Row',  3, 3, '8',   NULL),
  ('33333333-3333-3333-3333-333333333333', 'Día A', 1, 'OHP',          4, 3, '10',  NULL),
  ('33333333-3333-3333-3333-333333333333', 'Día A', 1, 'Lat Pulldown', 5, 3, '10',  NULL),
  ('33333333-3333-3333-3333-333333333333', 'Día A', 1, 'Plank',        6, 3, '30s', NULL);

-- ─── Full Body — Día B ────────────────────────────────────────

INSERT INTO public.routine_template_exercises
  (template_id, day_label, day_order, exercise_name, exercise_order, target_sets, target_reps, notes) VALUES
  ('33333333-3333-3333-3333-333333333333', 'Día B', 2, 'Deadlift',          1, 3, '6',     'Compound principal'),
  ('33333333-3333-3333-3333-333333333333', 'Día B', 2, 'Incline DB Press',  2, 3, '10',    NULL),
  ('33333333-3333-3333-3333-333333333333', 'Día B', 2, 'Pull-ups',          3, 3, 'AMRAP', NULL),
  ('33333333-3333-3333-3333-333333333333', 'Día B', 2, 'DB Shoulder Press', 4, 3, '10',    NULL),
  ('33333333-3333-3333-3333-333333333333', 'Día B', 2, 'Cable Row',         5, 3, '12',    NULL),
  ('33333333-3333-3333-3333-333333333333', 'Día B', 2, 'Crunches',          6, 3, '20',    NULL);
