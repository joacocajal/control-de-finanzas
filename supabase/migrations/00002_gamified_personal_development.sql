-- ============================================================
-- Desarrollo Personal Gamificado — Schema de Expansión
-- Migración: 00002_gamified_personal_development.sql
-- Fecha: 2026-05-16
-- Descripción: Dashboard RPG sobre la base de finanzas existente.
-- Tablas: perfiles_stats, habilidades_stats, gym_*, nutricion_*,
--         registro_agua, aprendizaje_*, finanzas_presupuestos,
--         misiones_diarias + funciones de XP y modo hardcore.
-- ============================================================

-- ─── A) SISTEMA DE GAMIFICACIÓN GLOBAL ──────────────────────

-- Expandir la tabla profiles existente con campos de gamificación
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username       text,
  ADD COLUMN IF NOT EXISTS nivel_global   int  NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS xp_global      int  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS racha_dias     int  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ultima_actividad timestamptz DEFAULT now();

-- ─── B) NIVELES DE HABILIDADES ESPECÍFICAS ──────────────────

CREATE TABLE IF NOT EXISTS public.habilidades_stats (
  id                  uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  perfil_id           uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  categoria           text        NOT NULL
                        CHECK (categoria IN ('finanzas', 'fitness', 'aprendizaje')),
  nivel               int         NOT NULL DEFAULT 1,
  xp                  int         NOT NULL DEFAULT 0,
  ultima_actualizacion timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS habilidades_perfil_id_idx ON public.habilidades_stats(perfil_id);
CREATE INDEX IF NOT EXISTS habilidades_categoria_idx  ON public.habilidades_stats(categoria);

ALTER TABLE public.habilidades_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "habilidades_select_own" ON public.habilidades_stats
  FOR SELECT USING (auth.uid() = perfil_id);
CREATE POLICY "habilidades_insert_own" ON public.habilidades_stats
  FOR INSERT WITH CHECK (auth.uid() = perfil_id);
CREATE POLICY "habilidades_update_own" ON public.habilidades_stats
  FOR UPDATE USING (auth.uid() = perfil_id);

-- ─── C) MÓDULO DE GIMNASIO Y SALUD ──────────────────────────

-- Rutinas
CREATE TABLE IF NOT EXISTS public.gym_rutinas (
  id          uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  perfil_id   uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nombre_rutina text      NOT NULL,
  creado_en   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS gym_rutinas_perfil_id_idx ON public.gym_rutinas(perfil_id);
ALTER TABLE public.gym_rutinas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gym_rutinas_select_own" ON public.gym_rutinas
  FOR SELECT USING (auth.uid() = perfil_id);
CREATE POLICY "gym_rutinas_insert_own" ON public.gym_rutinas
  FOR INSERT WITH CHECK (auth.uid() = perfil_id);
CREATE POLICY "gym_rutinas_update_own" ON public.gym_rutinas
  FOR UPDATE USING (auth.uid() = perfil_id);
CREATE POLICY "gym_rutinas_delete_own" ON public.gym_rutinas
  FOR DELETE USING (auth.uid() = perfil_id);

-- Ejercicios por rutina
CREATE TABLE IF NOT EXISTS public.gym_ejercicios (
  id              uuid    NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rutina_id       uuid    NOT NULL REFERENCES public.gym_rutinas(id) ON DELETE CASCADE,
  nombre_ejercicio text   NOT NULL,
  notas           text
);

CREATE INDEX IF NOT EXISTS gym_ejercicios_rutina_id_idx ON public.gym_ejercicios(rutina_id);
ALTER TABLE public.gym_ejercicios ENABLE ROW LEVEL SECURITY;

-- RLS: el usuario propietario de la rutina puede acceder a sus ejercicios
CREATE POLICY "gym_ejercicios_select_own" ON public.gym_ejercicios
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.gym_rutinas r
      WHERE r.id = rutina_id AND r.perfil_id = auth.uid()
    )
  );
CREATE POLICY "gym_ejercicios_insert_own" ON public.gym_ejercicios
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.gym_rutinas r
      WHERE r.id = rutina_id AND r.perfil_id = auth.uid()
    )
  );
CREATE POLICY "gym_ejercicios_update_own" ON public.gym_ejercicios
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.gym_rutinas r
      WHERE r.id = rutina_id AND r.perfil_id = auth.uid()
    )
  );
CREATE POLICY "gym_ejercicios_delete_own" ON public.gym_ejercicios
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.gym_rutinas r
      WHERE r.id = rutina_id AND r.perfil_id = auth.uid()
    )
  );

-- Series / logs de sobrecarga progresiva
CREATE TABLE IF NOT EXISTS public.gym_series_logs (
  id              uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ejercicio_id    uuid        NOT NULL REFERENCES public.gym_ejercicios(id) ON DELETE CASCADE,
  numero_serie    int         NOT NULL,
  peso_kg         numeric(6,2),
  repeticiones    int,
  completado      boolean     NOT NULL DEFAULT false,
  fecha           date        NOT NULL DEFAULT CURRENT_DATE
);

CREATE INDEX IF NOT EXISTS gym_series_ejercicio_id_idx ON public.gym_series_logs(ejercicio_id);
CREATE INDEX IF NOT EXISTS gym_series_fecha_idx        ON public.gym_series_logs(fecha);
ALTER TABLE public.gym_series_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gym_series_select_own" ON public.gym_series_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.gym_ejercicios e
      JOIN public.gym_rutinas r ON r.id = e.rutina_id
      WHERE e.id = ejercicio_id AND r.perfil_id = auth.uid()
    )
  );
CREATE POLICY "gym_series_insert_own" ON public.gym_series_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.gym_ejercicios e
      JOIN public.gym_rutinas r ON r.id = e.rutina_id
      WHERE e.id = ejercicio_id AND r.perfil_id = auth.uid()
    )
  );
CREATE POLICY "gym_series_update_own" ON public.gym_series_logs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.gym_ejercicios e
      JOIN public.gym_rutinas r ON r.id = e.rutina_id
      WHERE e.id = ejercicio_id AND r.perfil_id = auth.uid()
    )
  );
CREATE POLICY "gym_series_delete_own" ON public.gym_series_logs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.gym_ejercicios e
      JOIN public.gym_rutinas r ON r.id = e.rutina_id
      WHERE e.id = ejercicio_id AND r.perfil_id = auth.uid()
    )
  );

-- Récords personales
CREATE TABLE IF NOT EXISTS public.gym_prs (
  id              uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  perfil_id       uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tipo_ejercicio  text        NOT NULL,   -- 'sentadilla', 'press_banca', 'running_10k', etc.
  valor_record    numeric(8,2) NOT NULL,
  fecha           date        NOT NULL DEFAULT CURRENT_DATE
);

CREATE INDEX IF NOT EXISTS gym_prs_perfil_id_idx       ON public.gym_prs(perfil_id);
CREATE INDEX IF NOT EXISTS gym_prs_tipo_ejercicio_idx  ON public.gym_prs(tipo_ejercicio);
ALTER TABLE public.gym_prs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gym_prs_select_own" ON public.gym_prs
  FOR SELECT USING (auth.uid() = perfil_id);
CREATE POLICY "gym_prs_insert_own" ON public.gym_prs
  FOR INSERT WITH CHECK (auth.uid() = perfil_id);
CREATE POLICY "gym_prs_delete_own" ON public.gym_prs
  FOR DELETE USING (auth.uid() = perfil_id);

-- ─── D) MÓDULO DE NUTRICIÓN Y AGUA ──────────────────────────

-- Diccionario de alimentos (datos de referencia, sin RLS — lectura pública)
CREATE TABLE IF NOT EXISTS public.nutricion_alimentos_base (
  id               uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre           text        NOT NULL UNIQUE,
  calorias_por_100g numeric(6,2) NOT NULL DEFAULT 0,
  proteinas        numeric(5,2) NOT NULL DEFAULT 0,
  carbohidratos    numeric(5,2) NOT NULL DEFAULT 0,
  grasas           numeric(5,2) NOT NULL DEFAULT 0
);

ALTER TABLE public.nutricion_alimentos_base ENABLE ROW LEVEL SECURITY;

-- Lectura pública, escritura solo admin (service_role)
CREATE POLICY "alimentos_base_select_all" ON public.nutricion_alimentos_base
  FOR SELECT USING (true);

-- Seed: 10 alimentos comunes
INSERT INTO public.nutricion_alimentos_base
  (nombre, calorias_por_100g, proteinas, carbohidratos, grasas)
VALUES
  ('Arroz blanco cocido',     130,  2.7, 28.2,  0.3),
  ('Pechuga de pollo cocida', 165, 31.0,  0.0,  3.6),
  ('Huevo entero',            155, 13.0,  1.1, 11.0),
  ('Pasta de maní',           588, 25.0, 20.0, 50.0),
  ('Avena',                   389, 16.9, 66.3,  6.9),
  ('Brócoli',                  34,  2.8,  6.6,  0.4),
  ('Banana',                   89,  1.1, 22.8,  0.3),
  ('Atún en agua',            116, 25.5,  0.0,  0.8),
  ('Papa hervida',             87,  1.9, 20.1,  0.1),
  ('Almendras',               579, 21.2, 21.7, 49.9)
ON CONFLICT (nombre) DO NOTHING;

-- Logs diarios de nutrición
CREATE TABLE IF NOT EXISTS public.nutricion_diaria_logs (
  id                    uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  perfil_id             uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  alimento_id           uuid        REFERENCES public.nutricion_alimentos_base(id) ON DELETE SET NULL,
  nombre_alimento_custom text,       -- para items sin entrada en el diccionario
  cantidad_g            numeric(7,2) NOT NULL,
  calorias_totales      numeric(7,2) NOT NULL DEFAULT 0,
  proteinas_totales     numeric(6,2) NOT NULL DEFAULT 0,
  fecha                 date        NOT NULL DEFAULT CURRENT_DATE,
  CONSTRAINT nutricion_log_alimento_check
    CHECK (alimento_id IS NOT NULL OR nombre_alimento_custom IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS nutricion_logs_perfil_fecha_idx
  ON public.nutricion_diaria_logs(perfil_id, fecha);
ALTER TABLE public.nutricion_diaria_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nutricion_logs_select_own" ON public.nutricion_diaria_logs
  FOR SELECT USING (auth.uid() = perfil_id);
CREATE POLICY "nutricion_logs_insert_own" ON public.nutricion_diaria_logs
  FOR INSERT WITH CHECK (auth.uid() = perfil_id);
CREATE POLICY "nutricion_logs_update_own" ON public.nutricion_diaria_logs
  FOR UPDATE USING (auth.uid() = perfil_id);
CREATE POLICY "nutricion_logs_delete_own" ON public.nutricion_diaria_logs
  FOR DELETE USING (auth.uid() = perfil_id);

-- Registro de ingesta de agua
CREATE TABLE IF NOT EXISTS public.registro_agua (
  id          uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  perfil_id   uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cantidad_ml int         NOT NULL CHECK (cantidad_ml > 0),
  fecha       date        NOT NULL DEFAULT CURRENT_DATE
);

CREATE INDEX IF NOT EXISTS registro_agua_perfil_fecha_idx
  ON public.registro_agua(perfil_id, fecha);
ALTER TABLE public.registro_agua ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agua_select_own" ON public.registro_agua
  FOR SELECT USING (auth.uid() = perfil_id);
CREATE POLICY "agua_insert_own" ON public.registro_agua
  FOR INSERT WITH CHECK (auth.uid() = perfil_id);
CREATE POLICY "agua_delete_own" ON public.registro_agua
  FOR DELETE USING (auth.uid() = perfil_id);

-- ─── E) ZONA DE APRENDIZAJE ─────────────────────────────────

-- Skills de aprendizaje
CREATE TABLE IF NOT EXISTS public.aprendizaje_skills (
  id            uuid    NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  perfil_id     uuid    NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nombre_habilidad text NOT NULL,
  nivel_skill   int     NOT NULL DEFAULT 1,
  xp_skill      int     NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS aprendizaje_skills_perfil_id_idx ON public.aprendizaje_skills(perfil_id);
ALTER TABLE public.aprendizaje_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "skills_select_own" ON public.aprendizaje_skills
  FOR SELECT USING (auth.uid() = perfil_id);
CREATE POLICY "skills_insert_own" ON public.aprendizaje_skills
  FOR INSERT WITH CHECK (auth.uid() = perfil_id);
CREATE POLICY "skills_update_own" ON public.aprendizaje_skills
  FOR UPDATE USING (auth.uid() = perfil_id);
CREATE POLICY "skills_delete_own" ON public.aprendizaje_skills
  FOR DELETE USING (auth.uid() = perfil_id);

-- Logs de sesiones de aprendizaje
CREATE TABLE IF NOT EXISTS public.aprendizaje_logs (
  id           uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  skill_id     uuid        NOT NULL REFERENCES public.aprendizaje_skills(id) ON DELETE CASCADE,
  horas_estudio numeric(4,2) NOT NULL CHECK (horas_estudio > 0),
  youtube_url  text,
  notas        text,
  fecha        date        NOT NULL DEFAULT CURRENT_DATE
);

CREATE INDEX IF NOT EXISTS aprendizaje_logs_skill_id_idx ON public.aprendizaje_logs(skill_id);
CREATE INDEX IF NOT EXISTS aprendizaje_logs_fecha_idx    ON public.aprendizaje_logs(fecha);
ALTER TABLE public.aprendizaje_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "aprendizaje_logs_select_own" ON public.aprendizaje_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.aprendizaje_skills s
      WHERE s.id = skill_id AND s.perfil_id = auth.uid()
    )
  );
CREATE POLICY "aprendizaje_logs_insert_own" ON public.aprendizaje_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.aprendizaje_skills s
      WHERE s.id = skill_id AND s.perfil_id = auth.uid()
    )
  );
CREATE POLICY "aprendizaje_logs_delete_own" ON public.aprendizaje_logs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.aprendizaje_skills s
      WHERE s.id = skill_id AND s.perfil_id = auth.uid()
    )
  );

-- ─── F) UPGRADE DE FINANZAS — PRESUPUESTOS ───────────────────

CREATE TABLE IF NOT EXISTS public.finanzas_presupuestos (
  id              uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  perfil_id       uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  categoria_gasto uuid        REFERENCES public.categories(id) ON DELETE SET NULL,
  monto_limite    numeric(12,2) NOT NULL CHECK (monto_limite > 0),
  periodo         text        NOT NULL DEFAULT 'mensual'
                    CHECK (periodo IN ('mensual', 'semanal', 'anual')),
  fecha_inicio    date        NOT NULL DEFAULT CURRENT_DATE,
  fecha_fin       date
);

CREATE INDEX IF NOT EXISTS presupuestos_perfil_id_idx    ON public.finanzas_presupuestos(perfil_id);
CREATE INDEX IF NOT EXISTS presupuestos_categoria_id_idx ON public.finanzas_presupuestos(categoria_gasto);
ALTER TABLE public.finanzas_presupuestos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "presupuestos_select_own" ON public.finanzas_presupuestos
  FOR SELECT USING (auth.uid() = perfil_id);
CREATE POLICY "presupuestos_insert_own" ON public.finanzas_presupuestos
  FOR INSERT WITH CHECK (auth.uid() = perfil_id);
CREATE POLICY "presupuestos_update_own" ON public.finanzas_presupuestos
  FOR UPDATE USING (auth.uid() = perfil_id);
CREATE POLICY "presupuestos_delete_own" ON public.finanzas_presupuestos
  FOR DELETE USING (auth.uid() = perfil_id);

-- ─── G) GAME MASTER — MISIONES DIARIAS ──────────────────────

CREATE TABLE IF NOT EXISTS public.misiones_diarias (
  id              uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  perfil_id       uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  descripcion     text        NOT NULL,
  dificultad      text        NOT NULL DEFAULT 'media'
                    CHECK (dificultad IN ('facil', 'media', 'dificil')),
  xp_recompensa   int         NOT NULL DEFAULT 10,
  xp_penalizacion int         NOT NULL DEFAULT 5,
  estado          text        NOT NULL DEFAULT 'pendiente'
                    CHECK (estado IN ('pendiente', 'completada', 'fallada')),
  fecha           date        NOT NULL DEFAULT CURRENT_DATE
);

CREATE INDEX IF NOT EXISTS misiones_perfil_fecha_idx ON public.misiones_diarias(perfil_id, fecha);
CREATE INDEX IF NOT EXISTS misiones_estado_idx       ON public.misiones_diarias(estado);
ALTER TABLE public.misiones_diarias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "misiones_select_own" ON public.misiones_diarias
  FOR SELECT USING (auth.uid() = perfil_id);
CREATE POLICY "misiones_insert_own" ON public.misiones_diarias
  FOR INSERT WITH CHECK (auth.uid() = perfil_id);
CREATE POLICY "misiones_update_own" ON public.misiones_diarias
  FOR UPDATE USING (auth.uid() = perfil_id);

-- ─── FUNCIONES Y TRIGGERS DE XP ─────────────────────────────

-- Función: calcular umbral de XP para el siguiente nivel
-- Fórmula: nivel 1→2 = 100 XP, luego +15% por nivel (curva suave de RPG)
CREATE OR REPLACE FUNCTION public.xp_umbral_nivel(p_nivel int)
RETURNS int AS $$
BEGIN
  RETURN FLOOR(100 * POWER(1.15, p_nivel - 1))::int;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Función principal: otorgar XP a una habilidad y propagar al nivel global
-- Parámetros:
--   p_perfil_id   — UUID del perfil
--   p_categoria   — 'finanzas' | 'fitness' | 'aprendizaje'
--   p_xp_ganado   — XP positivo a sumar
CREATE OR REPLACE FUNCTION public.otorgar_xp(
  p_perfil_id  uuid,
  p_categoria  text,
  p_xp_ganado  int
)
RETURNS void AS $$
DECLARE
  v_habilidad    public.habilidades_stats%ROWTYPE;
  v_nuevo_xp     int;
  v_nuevo_nivel  int;
  v_umbral       int;
  v_xp_overflow  int;
  v_xp_global    int;
BEGIN
  -- Obtener o crear la habilidad
  SELECT * INTO v_habilidad
  FROM public.habilidades_stats
  WHERE perfil_id = p_perfil_id AND categoria = p_categoria
  LIMIT 1;

  IF NOT FOUND THEN
    INSERT INTO public.habilidades_stats (perfil_id, categoria, nivel, xp)
    VALUES (p_perfil_id, p_categoria, 1, 0)
    RETURNING * INTO v_habilidad;
  END IF;

  v_nuevo_xp    := v_habilidad.xp + p_xp_ganado;
  v_nuevo_nivel := v_habilidad.nivel;
  v_xp_overflow := 0;

  -- Level-up en cascada si se supera el umbral
  LOOP
    v_umbral := public.xp_umbral_nivel(v_nuevo_nivel);
    EXIT WHEN v_nuevo_xp < v_umbral;
    v_nuevo_xp    := v_nuevo_xp - v_umbral;
    v_xp_overflow := v_xp_overflow + FLOOR(v_umbral * 0.20); -- 20% del umbral → XP global
    v_nuevo_nivel := v_nuevo_nivel + 1;
  END LOOP;

  -- Actualizar habilidad
  UPDATE public.habilidades_stats
  SET xp                  = v_nuevo_xp,
      nivel               = v_nuevo_nivel,
      ultima_actualizacion = now()
  WHERE perfil_id = p_perfil_id AND categoria = p_categoria;

  -- Propagar XP al perfil global (con overflow de level-ups + 10% del XP ganado)
  v_xp_global := v_xp_overflow + FLOOR(p_xp_ganado * 0.10);

  IF v_xp_global > 0 THEN
    WITH upd AS (
      UPDATE public.profiles
      SET xp_global      = xp_global + v_xp_global,
          ultima_actividad = now()
      WHERE id = p_perfil_id
      RETURNING xp_global, nivel_global
    )
    -- Level-up del perfil global si corresponde
    UPDATE public.profiles p
    SET nivel_global = nivel_global + 1,
        xp_global    = xp_global - public.xp_umbral_nivel(nivel_global)
    WHERE p.id = p_perfil_id
      AND (SELECT xp_global FROM upd) >= public.xp_umbral_nivel((SELECT nivel_global FROM upd));
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: restar XP (modo hardcore) — nunca baja de 0
CREATE OR REPLACE FUNCTION public.restar_xp(
  p_perfil_id  uuid,
  p_categoria  text,
  p_xp_perdido int
)
RETURNS void AS $$
BEGIN
  -- Restar en habilidad (mínimo 0)
  UPDATE public.habilidades_stats
  SET xp                  = GREATEST(0, xp - p_xp_perdido),
      ultima_actualizacion = now()
  WHERE perfil_id = p_perfil_id AND categoria = p_categoria;

  -- Restar en perfil global (10% del costo, mínimo 0)
  UPDATE public.profiles
  SET xp_global      = GREATEST(0, xp_global - FLOOR(p_xp_perdido * 0.10)::int),
      ultima_actividad = now()
  WHERE id = p_perfil_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── TRIGGER: MODO HARDCORE — misión fallada ────────────────
-- Cuando una misión pasa a 'fallada', resta XP de penalización

CREATE OR REPLACE FUNCTION public.on_mision_estado_changed()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo actuar si el estado cambia a 'fallada'
  IF NEW.estado = 'fallada' AND OLD.estado <> 'fallada' THEN
    PERFORM public.restar_xp(
      NEW.perfil_id,
      'finanzas',          -- penalización cae en finanzas por defecto
      NEW.xp_penalizacion
    );
  END IF;

  -- Si se completa, otorgar recompensa
  IF NEW.estado = 'completada' AND OLD.estado <> 'completada' THEN
    PERFORM public.otorgar_xp(
      NEW.perfil_id,
      'finanzas',
      NEW.xp_recompensa
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_mision_estado_changed
  AFTER UPDATE OF estado ON public.misiones_diarias
  FOR EACH ROW EXECUTE FUNCTION public.on_mision_estado_changed();

-- ─── TRIGGER: MODO HARDCORE — presupuesto excedido ──────────
-- Cuando se registra un gasto que supera el límite del presupuesto activo,
-- se resta XP de finanzas. Se activa en INSERT de transactions.

CREATE OR REPLACE FUNCTION public.on_transaction_check_budget()
RETURNS TRIGGER AS $$
DECLARE
  v_presupuesto   public.finanzas_presupuestos%ROWTYPE;
  v_gastado       numeric;
  v_penalizacion  int := 10;  -- XP fija por exceso de presupuesto
BEGIN
  -- Solo evaluar gastos
  IF NEW.type <> 'expense' OR NEW.category_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Buscar presupuesto activo para esta categoría
  SELECT * INTO v_presupuesto
  FROM public.finanzas_presupuestos
  WHERE perfil_id      = NEW.user_id
    AND categoria_gasto = NEW.category_id
    AND periodo        = 'mensual'
    AND fecha_inicio   <= CURRENT_DATE
    AND (fecha_fin IS NULL OR fecha_fin >= CURRENT_DATE)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Calcular total gastado en la categoría este mes
  SELECT COALESCE(SUM(amount), 0) INTO v_gastado
  FROM public.transactions
  WHERE user_id         = NEW.user_id
    AND category_id     = NEW.category_id
    AND type            = 'expense'
    AND DATE_TRUNC('month', transaction_date) = DATE_TRUNC('month', CURRENT_DATE);

  -- Si el total nuevo supera el límite → penalización
  IF (v_gastado + NEW.amount) > v_presupuesto.monto_limite THEN
    PERFORM public.restar_xp(NEW.user_id, 'finanzas', v_penalizacion);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_transaction_check_budget
  AFTER INSERT ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.on_transaction_check_budget();

-- ─── EXTENDER handle_new_user con habilidades base ──────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Perfil base
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;

  -- Categorías por defecto (finanzas)
  INSERT INTO public.categories (user_id, name, color, icon, is_default)
  VALUES
    (NEW.id, 'Comida',     '#ef4444', 'utensils',       true),
    (NEW.id, 'Gym',        '#f97316', 'dumbbell',        true),
    (NEW.id, 'Streetwear', '#8b5cf6', 'shirt',           true),
    (NEW.id, 'Transporte', '#3b82f6', 'car',             true),
    (NEW.id, 'Salud',      '#10b981', 'heart-pulse',     true),
    (NEW.id, 'Ocio',       '#f59e0b', 'gamepad-2',       true),
    (NEW.id, 'Sueldo',     '#22c55e', 'banknote',        true),
    (NEW.id, 'Otros',      '#6b7280', 'more-horizontal', true)
  ON CONFLICT DO NOTHING;

  -- Habilidades iniciales en nivel 1
  INSERT INTO public.habilidades_stats (perfil_id, categoria, nivel, xp)
  VALUES
    (NEW.id, 'finanzas',    1, 0),
    (NEW.id, 'fitness',     1, 0),
    (NEW.id, 'aprendizaje', 1, 0)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
