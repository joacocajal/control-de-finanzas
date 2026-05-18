-- ============================================================
-- Ascend — Fitness Complete Schema
-- Migración: 00003_fitness_complete.sql
-- Fecha: 2026-05-17
-- Descripción: Sistema completo de fitness: alimentos, recetas,
--   logs de comida, hidratación, rutinas con sesiones,
--   records personales y objetivos diarios.
-- ============================================================

-- ─── A) ALIMENTOS ────────────────────────────────────────────
-- Base mixta: alimentos globales (seed) + alimentos custom del usuario.
-- Los macros siempre son por 100g para normalizar cálculos.

CREATE TABLE IF NOT EXISTS public.foods (
  id                  uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  -- null = alimento global del seed
  name                text        NOT NULL,
  brand               text,
  calories_per_100g   numeric     NOT NULL,
  protein_per_100g    numeric     NOT NULL,
  carbs_per_100g      numeric     NOT NULL,
  fat_per_100g        numeric     NOT NULL,
  fiber_per_100g      numeric     NOT NULL DEFAULT 0,
  -- Porciones alternativas: [{"label":"1 huevo mediano","grams":55}]
  serving_units       jsonb       NOT NULL DEFAULT '[]'::jsonb,
  is_global           boolean     NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS foods_user_id_idx  ON public.foods(user_id);
CREATE INDEX IF NOT EXISTS foods_name_idx     ON public.foods USING gin(to_tsvector('simple', name));
CREATE INDEX IF NOT EXISTS foods_is_global_idx ON public.foods(is_global);

ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;

-- Lectura: ve los globales Y los propios
CREATE POLICY "foods_select" ON public.foods
  FOR SELECT USING (is_global = true OR auth.uid() = user_id);

-- Escritura: solo propios (user_id debe coincidir)
CREATE POLICY "foods_insert" ON public.foods
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "foods_update" ON public.foods
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "foods_delete" ON public.foods
  FOR DELETE USING (auth.uid() = user_id);


-- ─── B) RECETAS ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.recipes (
  id          uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  description text,
  servings    integer     NOT NULL DEFAULT 1,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS recipes_user_id_idx ON public.recipes(user_id);

ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recipes_all" ON public.recipes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ─── C) INGREDIENTES DE RECETA ────────────────────────────────

CREATE TABLE IF NOT EXISTS public.recipe_ingredients (
  id             uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id      uuid        NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  food_id        uuid        NOT NULL REFERENCES public.foods(id) ON DELETE RESTRICT,
  grams          numeric     NOT NULL,
  display_amount text,
  display_unit   text
);

CREATE INDEX IF NOT EXISTS recipe_ingredients_recipe_id_idx ON public.recipe_ingredients(recipe_id);

ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;

-- RLS vía receta: el dueño de la receta accede a sus ingredientes
CREATE POLICY "recipe_ingredients_select" ON public.recipe_ingredients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.recipes r
      WHERE r.id = recipe_id AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "recipe_ingredients_insert" ON public.recipe_ingredients
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recipes r
      WHERE r.id = recipe_id AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "recipe_ingredients_update" ON public.recipe_ingredients
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.recipes r
      WHERE r.id = recipe_id AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "recipe_ingredients_delete" ON public.recipe_ingredients
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.recipes r
      WHERE r.id = recipe_id AND r.user_id = auth.uid()
    )
  );


-- ─── D) LOG DIARIO DE COMIDAS ─────────────────────────────────
-- Snapshot de macros al momento del registro para que el historial
-- no cambie si después el usuario edita la receta.

CREATE TABLE IF NOT EXISTS public.food_logs (
  id          uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consumed_at timestamptz NOT NULL DEFAULT now(),
  meal_type   text        NOT NULL
                CHECK (meal_type IN ('desayuno','almuerzo','merienda','cena','snack')),
  food_id     uuid        REFERENCES public.foods(id) ON DELETE SET NULL,
  recipe_id   uuid        REFERENCES public.recipes(id) ON DELETE SET NULL,
  grams       numeric,
  servings    numeric,
  -- Snapshot de macros
  calories    numeric     NOT NULL,
  protein     numeric     NOT NULL,
  carbs       numeric     NOT NULL,
  fat         numeric     NOT NULL,
  notes       text,
  CONSTRAINT food_logs_source_check
    CHECK (food_id IS NOT NULL OR recipe_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS food_logs_user_date_idx
  ON public.food_logs(user_id, consumed_at DESC);

ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "food_logs_all" ON public.food_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ─── E) HIDRATACIÓN ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.water_logs (
  id        uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id   uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logged_at timestamptz NOT NULL DEFAULT now(),
  liters    numeric     NOT NULL CHECK (liters > 0)
);

CREATE INDEX IF NOT EXISTS water_logs_user_date_idx
  ON public.water_logs(user_id, logged_at DESC);

ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "water_logs_all" ON public.water_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ─── F) RUTINAS DE ENTRENAMIENTO ──────────────────────────────

CREATE TABLE IF NOT EXISTS public.workout_routines (
  id          uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  category    text        NOT NULL DEFAULT 'gym'
                CHECK (category IN ('gym','running','bici','otro')),
  description text,
  archived    boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS workout_routines_user_id_idx ON public.workout_routines(user_id);

ALTER TABLE public.workout_routines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workout_routines_all" ON public.workout_routines
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ─── G) EJERCICIOS DE RUTINA (plantilla) ──────────────────────

CREATE TABLE IF NOT EXISTS public.routine_exercises (
  id              uuid    NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  routine_id      uuid    NOT NULL REFERENCES public.workout_routines(id) ON DELETE CASCADE,
  exercise_name   text    NOT NULL,
  order_index     integer NOT NULL DEFAULT 0,
  target_sets     integer,
  target_reps     text,
  notes           text
);

CREATE INDEX IF NOT EXISTS routine_exercises_routine_id_idx ON public.routine_exercises(routine_id);

ALTER TABLE public.routine_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "routine_exercises_select" ON public.routine_exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workout_routines r
      WHERE r.id = routine_id AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "routine_exercises_insert" ON public.routine_exercises
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_routines r
      WHERE r.id = routine_id AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "routine_exercises_update" ON public.routine_exercises
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.workout_routines r
      WHERE r.id = routine_id AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "routine_exercises_delete" ON public.routine_exercises
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.workout_routines r
      WHERE r.id = routine_id AND r.user_id = auth.uid()
    )
  );


-- ─── H) SESIONES REALES DE ENTRENAMIENTO ──────────────────────

CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id                    uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  routine_id            uuid        REFERENCES public.workout_routines(id) ON DELETE SET NULL,
  routine_name_snapshot text        NOT NULL,
  started_at            timestamptz NOT NULL DEFAULT now(),
  finished_at           timestamptz,
  duration_minutes      integer,
  distance_km           numeric,
  notes                 text
);

CREATE INDEX IF NOT EXISTS workout_sessions_user_id_idx ON public.workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS workout_sessions_routine_id_idx ON public.workout_sessions(routine_id);
CREATE INDEX IF NOT EXISTS workout_sessions_started_at_idx ON public.workout_sessions(started_at DESC);

ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workout_sessions_all" ON public.workout_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ─── I) SETS REALIZADOS ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.workout_sets (
  id            uuid    NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id    uuid    NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  exercise_name text    NOT NULL,
  set_number    integer NOT NULL,
  reps          integer,
  weight_kg     numeric,
  rpe           numeric CHECK (rpe >= 1 AND rpe <= 10),
  notes         text
);

CREATE INDEX IF NOT EXISTS workout_sets_session_id_idx    ON public.workout_sets(session_id);
CREATE INDEX IF NOT EXISTS workout_sets_exercise_name_idx ON public.workout_sets(exercise_name);

ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workout_sets_select" ON public.workout_sets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "workout_sets_insert" ON public.workout_sets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "workout_sets_update" ON public.workout_sets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "workout_sets_delete" ON public.workout_sets
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );


-- ─── J) OBJETIVOS DIARIOS ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.fitness_goals (
  id           uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_type    text        NOT NULL
                 CHECK (goal_type IN (
                   'daily_calories','daily_protein','daily_carbs',
                   'daily_fat','daily_water_liters'
                 )),
  target_value numeric     NOT NULL,
  active       boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, goal_type, active)
);

CREATE INDEX IF NOT EXISTS fitness_goals_user_id_idx ON public.fitness_goals(user_id);

ALTER TABLE public.fitness_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fitness_goals_all" ON public.fitness_goals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ─── K) RECORDS PERSONALES ────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.personal_records (
  id            uuid    NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category      text    NOT NULL
                  CHECK (category IN ('gym','running','bici','otro')),
  exercise_name text    NOT NULL,
  value         numeric NOT NULL,
  unit          text    NOT NULL,
  achieved_at   date    NOT NULL DEFAULT CURRENT_DATE,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS personal_records_user_id_idx       ON public.personal_records(user_id);
CREATE INDEX IF NOT EXISTS personal_records_exercise_name_idx ON public.personal_records(exercise_name);

ALTER TABLE public.personal_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "personal_records_all" ON public.personal_records
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ─── L) SEED: ALIMENTOS GLOBALES ─────────────────────────────
-- Valores por 100g. Fuente: USDA FoodData Central + refs nutricionales AR.

INSERT INTO public.foods
  (name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, is_global, serving_units)
VALUES

-- Desayuno / básicos
('Huevo entero', 143, 12.6, 0.7, 9.5, 0, true,
 '[{"label":"1 huevo chico (45g)","grams":45},{"label":"1 huevo mediano (55g)","grams":55},{"label":"1 huevo grande (65g)","grams":65}]'),

('Clara de huevo', 52, 10.9, 0.7, 0.2, 0, true,
 '[{"label":"1 clara (33g)","grams":33}]'),

('Avena en hojuelas (cruda)', 389, 16.9, 66.3, 6.9, 10.6, true,
 '[{"label":"1 cucharada sopera (10g)","grams":10},{"label":"1 taza (80g)","grams":80}]'),

('Banana', 89, 1.1, 22.8, 0.3, 2.6, true,
 '[{"label":"1 banana chica (90g)","grams":90},{"label":"1 banana mediana (118g)","grams":118},{"label":"1 banana grande (140g)","grams":140}]'),

('Café (sin azúcar, infusión)', 2, 0.3, 0, 0, 0, true,
 '[{"label":"1 taza (240ml)","grams":240}]'),

('Pan tostado (blanco)', 313, 9.1, 60, 3.6, 2.4, true,
 '[{"label":"1 rebanada (25g)","grams":25},{"label":"1 tostada (28g)","grams":28}]'),

('Pan tostado integral', 290, 11, 50, 4.5, 7, true,
 '[{"label":"1 rebanada (25g)","grams":25}]'),

('Pasta de maní', 588, 25, 20, 50, 6, true,
 '[{"label":"1 cucharada sopera (16g)","grams":16},{"label":"1 cucharada de postre (8g)","grams":8}]'),

('Mermelada (frutilla/durazno)', 250, 0.4, 62, 0.1, 1, true,
 '[{"label":"1 cucharada sopera (20g)","grams":20},{"label":"1 cucharadita (7g)","grams":7}]'),

('Esencia de vainilla', 288, 0.1, 13, 0.1, 0, true,
 '[{"label":"1 cucharadita (5g)","grams":5}]'),

-- Carnes
('Pechuga de pollo (cocida)', 165, 31, 0, 3.6, 0, true,
 '[{"label":"1 pechuga chica (120g)","grams":120},{"label":"1 pechuga mediana (170g)","grams":170},{"label":"1 pechuga grande (220g)","grams":220}]'),

('Bife de pollo (a la plancha)', 165, 31, 0, 3.6, 0, true,
 '[{"label":"1 bife mediano (150g)","grams":150}]'),

('Bife de carne (nalga, a la plancha)', 217, 28, 0, 11, 0, true,
 '[{"label":"1 bife chico (150g)","grams":150},{"label":"1 bife grande (250g)","grams":250}]'),

('Costeleta de cerdo (a la plancha)', 231, 26, 0, 14, 0, true,
 '[{"label":"1 costeleta (130g)","grams":130}]'),

('Milanesa de carne (frita)', 265, 22, 13, 14, 1, true,
 '[{"label":"1 milanesa (100g)","grams":100},{"label":"1 milanesa grande (130g)","grams":130}]'),

('Milanesa de carne (al horno)', 200, 24, 12, 7, 1, true,
 '[{"label":"1 milanesa (100g)","grams":100}]'),

('Suprema de pollo (frita)', 290, 24, 14, 16, 1, true,
 '[{"label":"1 suprema (130g)","grams":130}]'),

('Suprema de pollo (al horno)', 195, 27, 11, 5, 1, true,
 '[{"label":"1 suprema (130g)","grams":130}]'),

-- Guarniciones / carbos
('Arroz blanco (cocido)', 130, 2.7, 28, 0.3, 0.4, true,
 '[{"label":"1 taza (158g)","grams":158},{"label":"1 cucharón (100g)","grams":100}]'),

('Arroz integral (cocido)', 112, 2.6, 23, 0.9, 1.8, true,
 '[{"label":"1 taza (195g)","grams":195}]'),

('Fideos secos (sin cocer)', 371, 13, 75, 1.5, 3, true,
 '[{"label":"1 plato porción (80g crudos)","grams":80}]'),

('Fideos cocidos', 158, 5.8, 31, 0.9, 1.8, true,
 '[{"label":"1 plato (200g)","grams":200},{"label":"1 plato grande (300g)","grams":300}]'),

('Papa hervida', 87, 1.9, 20, 0.1, 1.8, true,
 '[{"label":"1 papa chica (100g)","grams":100},{"label":"1 papa mediana (170g)","grams":170},{"label":"1 papa grande (230g)","grams":230}]'),

('Papa al horno (con piel)', 93, 2.5, 21, 0.1, 2.2, true,
 '[{"label":"1 papa mediana (170g)","grams":170}]'),

-- Lácteos / otros
('Leche entera', 61, 3.2, 4.8, 3.3, 0, true,
 '[{"label":"1 taza (240ml)","grams":240},{"label":"1 vaso (200ml)","grams":200}]'),

('Yogur natural sin azúcar', 59, 10, 3.6, 0.4, 0, true,
 '[{"label":"1 pote (170g)","grams":170}]'),

('Queso cremoso', 250, 17, 3, 19, 0, true,
 '[{"label":"1 cucharada (15g)","grams":15}]'),

('Aceite de oliva', 884, 0, 0, 100, 0, true,
 '[{"label":"1 cucharada sopera (14g)","grams":14},{"label":"1 cucharadita (5g)","grams":5}]')

ON CONFLICT DO NOTHING;
