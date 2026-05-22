-- ============================================================
-- Fix Gamification: XP formula + explicit RPC calls
-- Migration: 00017_fix_gamification.sql
-- Problema: el trigger daba solo 10% del XP al perfil global.
-- Solución: dar XP completo, manejar level-up en cascada.
-- ============================================================

-- Drop trigger anterior (el XP ahora se otorga desde el service via RPC)
DROP TRIGGER IF EXISTS on_mision_estado_changed ON public.misiones_diarias;
DROP FUNCTION IF EXISTS public.on_mision_estado_changed();

-- ─── Función: otorgar XP (arreglada) ────────────────────────
-- Ahora da XP COMPLETO al perfil global (no solo 10%)
-- Maneja level-up en cascada para habilidad y perfil global
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
BEGIN
  -- Solo el dueño del perfil puede otorgarse XP
  IF auth.uid() IS DISTINCT FROM p_perfil_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

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

  -- Level-up en cascada para la habilidad
  v_nuevo_xp    := v_habilidad.xp + p_xp_ganado;
  v_nuevo_nivel := v_habilidad.nivel;
  LOOP
    v_umbral := public.xp_umbral_nivel(v_nuevo_nivel);
    EXIT WHEN v_nuevo_xp < v_umbral;
    v_nuevo_xp    := v_nuevo_xp - v_umbral;
    v_nuevo_nivel := v_nuevo_nivel + 1;
  END LOOP;

  UPDATE public.habilidades_stats
  SET xp = v_nuevo_xp, nivel = v_nuevo_nivel, ultima_actualizacion = now()
  WHERE perfil_id = p_perfil_id AND categoria = p_categoria;

  -- Dar XP COMPLETO al perfil global
  UPDATE public.profiles
  SET xp_global = xp_global + p_xp_ganado, ultima_actividad = now()
  WHERE id = p_perfil_id;

  -- Level-up en cascada para el perfil global
  LOOP
    SELECT xp_global, nivel_global INTO v_nuevo_xp, v_nuevo_nivel
    FROM public.profiles WHERE id = p_perfil_id;

    v_umbral := public.xp_umbral_nivel(v_nuevo_nivel);
    EXIT WHEN v_nuevo_xp < v_umbral;

    UPDATE public.profiles
    SET nivel_global = nivel_global + 1,
        xp_global    = xp_global - v_umbral
    WHERE id = p_perfil_id;
  END LOOP;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Función: restar XP (arreglada) ─────────────────────────
CREATE OR REPLACE FUNCTION public.restar_xp(
  p_perfil_id  uuid,
  p_categoria  text,
  p_xp_perdido int
)
RETURNS void AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM p_perfil_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.habilidades_stats
  SET xp = GREATEST(0, xp - p_xp_perdido), ultima_actualizacion = now()
  WHERE perfil_id = p_perfil_id AND categoria = p_categoria;

  UPDATE public.profiles
  SET xp_global = GREATEST(0, xp_global - p_xp_perdido), ultima_actividad = now()
  WHERE id = p_perfil_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Backfill: crear habilidades para usuarios existentes ───
-- Por si el usuario se registró antes de la migración 00002
INSERT INTO public.habilidades_stats (perfil_id, categoria, nivel, xp)
SELECT p.id, c.categoria, 1, 0
FROM public.profiles p
CROSS JOIN (VALUES ('finanzas'), ('fitness'), ('aprendizaje')) AS c(categoria)
WHERE NOT EXISTS (
  SELECT 1 FROM public.habilidades_stats hs
  WHERE hs.perfil_id = p.id AND hs.categoria = c.categoria
);
