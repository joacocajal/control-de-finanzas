# Changelog — Control de Finanzas Personales

> Formato: [Semantic Versioning](https://semver.org/)
> Cada entrada incluye: fecha, tipo, archivos afectados, request original.

---

## [0.2.0] — 2026-05-01

### Added — FASE 2: Dashboard de Finanzas y Transacciones

#### Configuración
- `.env.local` — Variables de entorno configuradas (Supabase + Gemini)
- `package.json` — Agregado `@google/generative-ai`, `autoprefixer`

#### Documentación
- `docs/features/transactions.md` — Feature doc completo

#### Backend / Servicios
- `src/lib/supabase/client.ts` — Cliente Supabase browser
- `src/lib/supabase/server.ts` — Cliente Supabase server (SSR)
- `middleware.ts` — Auth middleware (protege rutas del dashboard)
- `src/lib/utils.ts` — Función `cn()` para clases condicionales
- `src/lib/utils/formatters.ts` — `formatCurrency`, `formatDate`, `formatMonth`, `toISODate`
- `src/lib/utils/calculations.ts` — `calcBalance`, `calcTotalByType`, `calcCategoryTotals`, `getMonthRange`
- `src/types/database.types.ts` — Tipos TypeScript completos para DB + AI
- `src/services/transaction.service.ts` — CRUD de transacciones
- `src/services/category.service.ts` — Lectura de categorías
- `src/services/ai.service.ts` — Streaming con Gemini API via fetch directo
- `src/hooks/useTransactions.ts` — Hook con estado de carga/error/refresh
- `src/hooks/useCategories.ts` — Hook de categorías
- `src/app/api/ai/chat/route.ts` — Route Handler del chat IA (Zod validation + stream)

#### UI / Páginas
- `src/app/layout.tsx` — Dark mode (`dark` class en html)
- `src/app/(auth)/login/page.tsx` — Página de login con Supabase Auth
- `src/app/(auth)/register/page.tsx` — Registro con manejo de confirmación de email
- `src/app/(dashboard)/layout.tsx` — Layout con Sidebar fijo
- `src/app/(dashboard)/page.tsx` — Dashboard: stat cards + gráfico + lista
- `src/app/(dashboard)/chat/page.tsx` — Página del chat con IA
- `src/components/layout/Sidebar.tsx` — Sidebar con nav + logout
- `src/components/features/transactions/BalanceCard.tsx` — Cards de Balance/Ingresos/Gastos
- `src/components/features/transactions/TransactionForm.tsx` — Modal formulario + botón FAB
- `src/components/features/transactions/TransactionList.tsx` — Lista con skeleton y delete
- `src/components/features/charts/ExpensePieChart.tsx` — Recharts PieChart donut por categoría
- `src/components/features/ai-chat/ChatWidget.tsx` — Chat widget con streaming de Gemini

### Archivos afectados
_(ver lista completa arriba)_

### Request original
> "FASE 2: Dashboard de Finanzas y Transacciones — Dark mode, BalanceCards, PieChart Recharts, TransactionForm conectado a Supabase, AI con Gemini."

---

## [0.1.0] — 2026-05-01

### Added — Setup Inicial (Método AInnovate FASE 1)

- Estructura de documentación completa (`docs/`)
- `docs/01-project-overview.md` — visión, objetivos, stack, estado del proyecto
- `docs/02-architecture.md` — estructura de carpetas, convenciones, ADRs
- `docs/03-security.md` — auth, RLS, credenciales, políticas de seguridad
- `docs/04-deployment.md` — template para proceso de deploy
- `docs/DB_SCHEMA.md` — esquema completo: profiles, categories, transactions con RLS y funciones SQL
- `docs/API_DOCS.md` — documentación de API Routes (/api/health, /api/ai/chat)
- `docs/SKILLS.md` — registro de skills/extensiones (vacío en setup inicial)
- `docs/features/` — carpeta para features (vacía, se llena en FASE 2)
- `CLAUDE.md` — reglas para Claude Code (Método AInnovate v2)
- `.windsurfrules` — reglas para Windsurf/Cascade
- `.cursorrules` — reglas para Cursor
- `.clinerules` — reglas para Cline/Continue
- `.github/copilot-instructions.md` — reglas para GitHub Copilot
- `.aider.conf.yml` — reglas para Aider
- `CHANGELOG.md` — este archivo inicializado
- Proyecto Next.js 15 inicializado (App Router + TypeScript + Tailwind CSS)
- `.env.example` con variables de entorno requeridas
- `supabase/migrations/00001_initial_schema.sql` — schema SQL listo para aplicar
- `.gitignore` configurado

### Archivos afectados
- `docs/01-project-overview.md` — Creado
- `docs/02-architecture.md` — Creado
- `docs/03-security.md` — Creado
- `docs/04-deployment.md` — Creado
- `docs/DB_SCHEMA.md` — Creado
- `docs/API_DOCS.md` — Creado
- `docs/SKILLS.md` — Creado
- `CLAUDE.md` — Creado
- `.windsurfrules` — Creado
- `.cursorrules` — Creado
- `.clinerules` — Creado
- `.github/copilot-instructions.md` — Creado
- `.aider.conf.yml` — Creado
- `CHANGELOG.md` — Creado
- `.env.example` — Creado
- `supabase/migrations/00001_initial_schema.sql` — Creado
- `package.json` — Generado por create-next-app
- `next.config.ts` — Generado por create-next-app
- `tailwind.config.ts` — Generado por create-next-app
- `tsconfig.json` — Generado por create-next-app

### Request original
> "Lee el archivo METODO_AINNOVATE.md completo y sigue las instrucciones de la FASE 1.
> Mi proyecto es una Web App de Gestión de Finanzas Personales.
> Stack: Next.js + Tailwind CSS + Lucide React + Recharts + Shadcn UI + Supabase."
