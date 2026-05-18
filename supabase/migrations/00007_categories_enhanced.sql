-- ============================================================
-- Ascend — Categorías enhanced (presupuesto + subcategorías + archivado)
-- Migración: 00007_categories_enhanced.sql
-- ============================================================

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS monthly_budget  numeric,
  ADD COLUMN IF NOT EXISTS parent_category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS archived        boolean NOT NULL DEFAULT false;
