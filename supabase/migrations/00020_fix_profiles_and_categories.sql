-- ============================================================
-- Ascend — Fix: backfill de profiles y categorías por defecto
-- Migración: 00020_fix_profiles_and_categories.sql
--
-- Problema: cuentas creadas antes del trigger handle_new_user (o
-- si éste falló) no tienen fila en public.profiles. Como
-- aprendizaje_skills.perfil_id referencia profiles(id), crear una
-- skill fallaba por violación de FK. Además esos usuarios no
-- tenían categorías por defecto.
--
-- Esta migración es idempotente: se puede correr varias veces.
-- ============================================================

-- ── 1. Backfill de profiles para todo usuario que no tenga ──
INSERT INTO public.profiles (id)
SELECT u.id
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- ── 2. Categorías por defecto para usuarios sin ninguna ─────
INSERT INTO public.categories (user_id, name, color, icon, is_default)
SELECT u.id, c.name, c.color, c.icon, true
FROM auth.users u
CROSS JOIN (VALUES
  ('Comida',     '#ef4444', 'utensils'),
  ('Gym',        '#f97316', 'dumbbell'),
  ('Streetwear', '#8b5cf6', 'shirt'),
  ('Transporte', '#3b82f6', 'car'),
  ('Salud',      '#10b981', 'heart-pulse'),
  ('Ocio',       '#f59e0b', 'gamepad-2'),
  ('Sueldo',     '#22c55e', 'banknote'),
  ('Otros',      '#6b7280', 'more-horizontal')
) AS c(name, color, icon)
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories cat WHERE cat.user_id = u.id
);
