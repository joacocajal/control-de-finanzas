# Changelog — Control de Finanzas Personales

## [0.15.0] — 2026-05-17

### Added — Agente IA conversacional + Skills avanzados (FASES 1-5)

#### FASE 1 — Sesiones de aprendizaje cronometradas
- `supabase/migrations/00013_learning_sessions.sql` — Tabla `learning_sessions` + `total_hours_practiced` en `aprendizaje_skills` + trigger `sync_skill_hours`
- `src/services/learning-sessions.service.ts` — CRUD + `getWeeklyHours` (agrupación por lunes)
- `src/hooks/useLearningSession.ts` — Timer con setInterval, pause/resume, debounced `updateWhatStudied`
- `src/components/features/learning/LearningSessionTimer.tsx` — Modal: selector 25/45/60/90/Libre → timer circular SVG countdown/countup → PostSessionForm
- `src/components/features/learning/AprendizajeSection.tsx` — Botón "Iniciar sesión", tabs Historial/Sesiones, bar chart semanal, lista de sesiones recientes, toast de confirmación

#### FASE 2 — Recursos por skill
- `supabase/migrations/00014_skill_resources.sql` — Tabla `skill_resources` (tipo, estado, rating, prioridad) + FK en `learning_sessions`
- `src/services/skill-resources.service.ts` — CRUD + `markConsumed`
- `src/hooks/useSkillResources.ts`
- `src/components/features/learning/SkillResources.tsx` — Form con selector de tipo, filtros, cards con checkbox "consumido", modal de rating, vista detalle con editor de notas
- `AprendizajeSection.tsx` — Tab "Recursos", recursos pasados al timer para preselección

#### FASE 3 — Roadmap por skill
- `supabase/migrations/00015_skill_milestones.sql` — Tabla `skill_milestones` + trigger `set_milestone_completed_at`
- `src/services/skill-milestones.service.ts` — CRUD + `createMilestoneBatch` + `suggestMilestonesFromN8n`
- `src/hooks/useSkillMilestones.ts` — toggle, reorder, `suggestWithAI`
- `src/components/features/learning/SkillRoadmap.tsx` — Progress bar, lista de hitos con checkbox/expand, modal de sugerencias IA
- `AprendizajeSection.tsx` — Tab "Roadmap"
- `.env.example` — `NEXT_PUBLIC_N8N_WEBHOOK_MILESTONES`

#### FASE 4 — Agente IA conversacional
- `supabase/migrations/00016_agent.sql` — `agent_conversations` + `agent_messages` + `agent_notifications` + trigger `update_conversation_updated_at`
- `src/services/agent.service.ts` — CRUD conversaciones/mensajes, `callAgentWebhook`, notificaciones
- `src/hooks/useAgent.ts` — `useAgent` (send, load, select) + `useAgentNotifications`
- `src/components/features/ai-chat/AgentChat.tsx` — Botón flotante (bottom-24 right-6), panel lateral con historial, chips de sugerencias rápidas, markdown renderer, input autosize
- `src/components/layout/DashboardShell.tsx` — Monta `AgentChat` con dynamic import
- `.env.example` — `NEXT_PUBLIC_N8N_WEBHOOK_AGENT`

#### FASE 5 — Documentación n8n
- `docs/n8n-agent-setup.md` — 3 workflows: Agent Chat, Reporte Semanal, Sugerir Hitos. Prompts exactos para Claude, estructura de nodos, checklist de activación

#### Tipos (`src/types/database.types.ts`)
- `LearningSession`, `PlannedMinutes`, `CreateLearningSessionInput`, `FinishLearningSessionInput`
- `SkillResource`, `ResourceType`, `ResourceStatus`, `CreateSkillResourceInput`, `UpdateSkillResourceInput`
- `SkillMilestone`, `CreateSkillMilestoneInput`
- `AgentConversation`, `AgentMessage`, `AgentNotification`

---

## [0.10.0] — 2026-05-17

### Added — FASE 7: Diario Personal

#### SQL (`supabase/migrations/00012_journal.sql`)
- `journal_entries` — tabla con campos: mood (1-5), what_i_did, what_i_achieved, how_i_felt, gratitude, tomorrow_focus, free_notes, daily_snapshot (jsonb)
- RLS: acceso propio por user_id
- Trigger `journal_updated_at` — actualiza `updated_at` automáticamente
- UNIQUE (user_id, entry_date)

#### Tipos (`src/types/database.types.ts`)
- `JournalEntry`, `UpsertJournalEntryInput`, `DailySnapshot`, `JournalBlockKey`

#### Servicio (`src/services/journal.service.ts`)
- `getMonthEntries(year, month)` — para vista de calendario
- `getEntryByDate(date)` — para editor
- `upsertEntry(date, input)` — create/update con upsert
- `getDailySnapshot(date)` — consulta paralela: workouts, food, transacciones, agua, habilidades

#### Hooks (`src/hooks/useJournal.ts`)
- `useMonthJournal()` — carga entradas del mes para el calendario
- `useJournalEditor()` — carga entrada + snapshot + autosave con debounce 1.5s

#### UI (`src/components/features/journal/`)
- `JournalCalendar.tsx` — mini calendario con dots coloreados por mood (1=rojo→5=violeta)
- `JournalEditor.tsx` — editor con MoodSelector (5 emojis), SnapshotPanel (workout/comida/dinero/skills/agua), 6 bloques expandibles con autosave
- `JournalHistory.tsx` — historial con filtros por mood y mes

#### Página (`src/app/(dashboard)/diario/page.tsx`)
- Layout principal/historial, calendario a la izquierda, editor a la derecha
- Quick stats: total entradas, con mood, promedio de mood

#### Navegación
- `Sidebar.tsx` — "Diario" (BookHeart, #818cf8) entre Learning Hub y AI Agent Arena
- `MobileTopBar.tsx` — `/diario` en REALM_MAP

---

## [0.9.0] — 2026-05-17

### Added — FASE 6: Plantillas de rutinas pre-armadas

#### SQL (correr manualmente en Supabase)
- `routine_templates` — tabla de plantillas (name, level, split_type, days_per_week, description)
- `routine_template_exercises` — ejercicios por día de plantilla (day_label, day_order, target_sets, target_reps)
- RLS: lectura pública para autenticados
- `workout_routines.adopted_from_template_id` — FK a plantilla de origen
- Seed: 3 plantillas con todos sus ejercicios (PPL 6d, Upper/Lower 4d, Full Body 3d)

#### Tipos (`src/types/database.types.ts`)
- `RoutineTemplate`, `RoutineTemplateExercise`, `RoutineTemplateDay`, `RoutineTemplateWithDays`
- `TemplateLevel` — union: `'principiante' | 'intermedio' | 'avanzado'`
- `WorkoutRoutine.adopted_from_template_id` — campo nuevo

#### Servicio (`src/services/routine-templates.service.ts`)
- `getTemplates()` — lista todas las plantillas activas
- `getTemplateWithDays(id)` — plantilla + ejercicios agrupados por día
- `adoptTemplate(id)` — crea una `workout_routine` + `routine_exercises` por cada día de la plantilla

#### Hook (`src/hooks/useRoutineTemplates.ts`)
- `useRoutineTemplates()` — carga lista de plantillas
- `useTemplateDetail()` — carga detalle + gestiona estado de adopción

#### UI (`src/components/features/fitness/`)
- `FitnessTemplates.tsx` — browser de plantillas: lista de cards con nivel/días, preview de días + ejercicios, botón "Adoptar"
- `FitnessRutinas.tsx` — botón "Plantillas" en el header, toast de confirmación post-adopción, recarga automática de rutinas

---

## [0.8.0] — 2026-05-17

### Added — FASE 5: Workout feeling notes (pre/post sesión + historial)

#### SQL (correr manualmente en Supabase)
```sql
ALTER TABLE public.workout_sessions
  ADD COLUMN IF NOT EXISTS energy_level        integer CHECK (energy_level BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS sleep_hours         numeric,
  ADD COLUMN IF NOT EXISTS muscle_soreness     integer CHECK (muscle_soreness BETWEEN 0 AND 5),
  ADD COLUMN IF NOT EXISTS session_feeling     text    CHECK (session_feeling IN ('mal','regular','bien','excelente')),
  ADD COLUMN IF NOT EXISTS post_session_notes  text;
```

#### Tipos (`src/types/database.types.ts`)
- `SessionFeeling` — union type: `'mal' | 'regular' | 'bien' | 'excelente'`
- `WorkoutSession` — 5 campos: `energy_level`, `sleep_hours`, `muscle_soreness`, `session_feeling`, `post_session_notes`
- `WorkoutPreFeelingInput` / `WorkoutPostFeelingInput` — inputs separados por momento

#### Servicio (`src/services/workout-sessions.service.ts`)
- `startSession(input, preFeeling?)` — guarda energy, sleep, soreness al arrancar
- `finishSession(id, postFeeling?)` — guarda feeling + notas al terminar

#### Hook (`src/hooks/useWorkoutSession.ts`)
- `start(id, name, preFeeling?)` / `finish(postFeeling?, category?)` — firmas actualizadas

#### UI (`src/components/features/fitness/FitnessRutinas.tsx`)
- `PreSessionForm` — "¿Cómo te sentís hoy?" al hacer Iniciar: energía (1-5), soreness (0-5), horas de sueño
- `PostSessionForm` — "¿Cómo te fue?" al Finalizar: 4 botones emoji + textarea libre
- `ScaleSelector` — selector genérico con min/max configurable
- `SessionHistoryItem` — card con indicadores ⚡🔥 emoji de sensación
- Historial de últimas 6 sesiones debajo de rutinas, se recarga al terminar

---

> Formato: [Semantic Versioning](https://semver.org/)
> Cada entrada incluye: fecha, tipo, archivos afectados, request original.

---

## [0.7.0] — 2026-05-16

### Changed — Ascend: Full 5-page navigation + complete page implementations

#### Archivos nuevos
- `src/app/(dashboard)/finanzas/page.tsx` — Vault page: 4 stat cards, pie chart, savings goal ring, budget categories grid, recent transactions
- `src/app/(dashboard)/fitness/page.tsx` — Forge page: body composition vitals, personal records grid with tier bars, macros ring, 30-day cardio sparklines
- `src/app/(dashboard)/aprendizaje/page.tsx` — Codex page: skill paths with XP progress, study session modal, currently consuming library, mastered skill tree
- `src/app/(dashboard)/chat/page.tsx` — AI Agent Arena: 4 agent cards (Sage/Atlas/Mint/Lumen), embedded chat, Forge a quest panel

#### Archivos modificados
- `src/components/layout/Sidebar.tsx` — NAV actualizado a 5 ítems: Dashboard, Finances (/finanzas), Fitness (/fitness), Learning Hub (/aprendizaje), AI Agent Arena (/chat)
- `src/components/layout/MobileTopBar.tsx` — REALM_MAP actualizado con los 5 routes
- `src/app/(dashboard)/page.tsx` — Reconstruido como Dashboard overview: AI Quest aurora card, weekly activity rings, finance mini-widget, quest board, fitness & learning shortcut cards

---

## [0.6.0] — 2026-05-16

### Changed — Ascend Design System: rediseño visual completo de la UI

#### Archivos nuevos
- `src/components/ui/ascend.tsx` — Primitivos UI de Ascend: `ProgressRing`, `XPBar`, `LevelBadge`, `AscendChip`, `Sparkline`

#### Archivos modificados
- `src/app/layout.tsx` — Eliminado `next/font` (SSL issue), se usa Google Fonts vía CSS import
- `src/app/globals.css` — Sistema de diseño Ascend: CSS variables (`--bg-0`, `--finance`, `--fitness`, etc.), body con radial gradients RPG, `.glass`, `.hex`, `.xp-track`, `.quest-check`, `.nav-item`, `.aurora`, `.lvl-chip`, `.flame`, nuevos keyframes
- `src/components/layout/Sidebar.tsx` — Rediseño completo: logo Mountain + "Ascend", realms con accent colors, active indicator con glow, footer con level badge `LVL {n}` y botón logout
- `src/components/layout/MobileTopBar.tsx` — Nuevo header unificado (mobile + desktop): breadcrumb, XP bar animada con shimmer, flame streak counter, campana de notificaciones. Consume datos reales de `useGamification`
- `src/components/layout/DashboardShell.tsx` — Integra `useGamification` y `createClient` para pasar level/email al Sidebar y profile al header
- `src/components/features/transactions/BalanceCard.tsx` — Cards Ascend con `.glass .lift`, accent colors por tipo
- `src/components/features/transactions/TransactionList.tsx` — Container con `.glass`, tipografía Ascend
- `src/app/(dashboard)/page.tsx` — Section header con icono accent, layout Ascend

---

## [0.5.0] — 2026-05-16

### Added — FASE 5: Game Master IA + Reset de Medianoche

#### Variables de entorno nuevas
```
CRON_SECRET=<openssl rand -hex 24>   # protege los endpoints de cron
```

#### API Routes nuevas
- `src/app/api/agent/generate-quest/route.ts` — POST protegido con `CRON_SECRET`; consulta 48h de datos reales (finanzas, gym, aprendizaje), llama a Gemini en JSON mode con schema forzado y crea la misión en `misiones_diarias`
- `src/app/api/cron/daily-reset/route.ts` — POST que falla misiones pendientes de días anteriores (dispara trigger XP), luego llama a `generate-quest` para cada usuario activo; GET de healthcheck

#### Lógica del Game Master
- Contexto real: balance semanal, top categorías, días sin entrenar, horas de estudio 48h, presupuestos excedidos
- Gemini con `responseMimeType: "application/json"` + `responseSchema` → salida garantizada
- Reglas de prioridad: presupuesto excedido → gym → aprendizaje → lo peor de cada área
- Anti-duplicados: no genera si ya existe misión para hoy

---

## [0.4.3] — 2026-05-16

### Added — FASE 4 Iteración 2: Hooks + UI de Gym, Nutrición, Aprendizaje y Misiones

#### Hooks (`src/hooks/`)
- `useGym.ts` — Estado de rutinas/ejercicios/PRs; `registrarSerie` actualiza PRs optimistamente y dispara `onMutation`
- `useNutrition.ts` — Resumen diario (calorías, proteínas, agua); agua con optimistic update; `onMutation` callback
- `useLearning.ts` — Skills + historial de videos por skill; `addEstudio` refresca historial + horas totales
- `useQuests.ts` — Misiones del día con `completar`, `fallar` y `crear`; cada mutación dispara `onMutation`

#### Componentes nuevos
- `src/components/features/gym/GymSection.tsx` — Rutinas con tabs, ejercicios inline con form de serie (serie/kg/reps), PRs en grid
- `src/components/features/nutrition/NutricionSection.tsx` — Macros (calorías + proteínas con barras de progreso), hidratación con botones +250/500/1000ml, log del día con delete
- `src/components/features/learning/AprendizajeSection.tsx` — Selector de skills, XP bar por habilidad, historial de videos YouTube, form de sesión de estudio

#### Actualizaciones
- `MisionesWidget.tsx` — Props `onFallar` + botón "Fallar" en misiones pendientes (modo hardcore)
- `src/app/(dashboard)/desarrollo/page.tsx` — Refactorizado: `useQuests` para misiones, `reload` como `onMutation` en todas las secciones para que el XP bar global se actualice en tiempo real

---

## [0.4.2] — 2026-05-16

### Added — FASE 4: Capa de Servicios Completa

#### Tipos (`src/types/database.types.ts`)
- `GymRutina`, `GymEjercicio`, `GymSerieLog`, `GymPR` + inputs
- `AlimentoBase`, `NutricionDiariaLog`, `RegistroAgua`, `ResumenNutricionDiaria`, `CreateNutricionLogInput`
- `AprendizajeSkill`, `AprendizajeLog` + inputs
- `Presupuesto`, `PresupuestoConCategoria`, `VerificacionPresupuesto`, `CreatePresupuestoInput`, `PeriodoPresupuesto`

#### Servicios nuevos
- `src/services/gym.service.ts` — `getRutinas`, `crearRutina`, `eliminarRutina`, `getEjerciciosByRutina`, `crearEjercicio`, `eliminarEjercicio`, `registrarSerieLog`, `getSeriesHoy`, `getPRs`, `actualizarPR`
- `src/services/nutrition.service.ts` — `getAlimentosBase`, `getLogsNutricionHoy`, `registrarComidaDiaria`, `eliminarLogNutricion`, `registrarAgua`, `getTotalAguaHoy`, `eliminarRegistroAgua`, `getResumenDiario`, `calcularMacros`
- `src/services/learning.service.ts` — `getSkills`, `crearSkill`, `eliminarSkill`, `registrarHorasEstudio`, `getHistorialVideos`, `getLogsRecientes`, `eliminarLog`, `getTotalHorasSkill`
- `src/services/budget.service.ts` — `getPresupuestosActivos`, `crearPresupuesto`, `actualizarPresupuesto`, `eliminarPresupuesto`, `verificarPresupuesto`
- `src/services/quest.service.ts` — `getMisionesHoy`, `getMisionesPorFecha`, `crearMision`, `actualizarEstadoMision`, `completarMision`, `fallarMision`, `calcularResumenMisiones`

---

## [0.4.1] — 2026-05-16

### Added — FASE 3 Iteración 1: Integración gamificada en la app Next.js

#### Tipos
- `src/types/database.types.ts` — Tipos gamificación: `ProfileGamificado`, `HabilidadStat`, `HabilidadCategoria`, `MisionDiaria`, `MisionEstado`, `MisionDificultad`, `CreateMisionInput`

#### Servicios
- `src/services/gamification.service.ts` — CRUD Supabase: perfil gamificado, habilidades, misiones del día, completar/crear misión

#### Hooks
- `src/hooks/useGamification.ts` — Hook de estado: carga en paralelo, optimistic UI en completar/crear. Exporta helpers `xpUmbral()` y `xpPorcentaje()`

#### Componentes
- `src/components/features/gamification/ProfileXPCard.tsx` — Tarjeta nivel global: badge de nivel, XP bar con degradado, contador de racha
- `src/components/features/gamification/HabilidadesGrid.tsx` — Grid 3 skills (finanzas/fitness/aprendizaje) con color propio, nivel, XP bar
- `src/components/features/gamification/MisionesWidget.tsx` — Lista de misiones del día: completar inline, form para crear misión con selector de dificultad

#### Páginas
- `src/app/(dashboard)/desarrollo/page.tsx` — Página `/desarrollo` con layout de 3 secciones: perfil, habilidades, misiones

#### Navegación
- `src/components/layout/Sidebar.tsx` — Nav item "Desarrollo" (ícono Zap) apuntando a `/desarrollo`

---

## [0.4.0] — 2026-05-16

### Added — FASE 3: Gamified Personal Development Dashboard

#### Prototipo UI standalone
- `index.html` — Dashboard RPG gamificado autónomo (React 18 + Babel CDN + Tailwind CDN). Incluye vistas: Dashboard, Finanzas, Fitness, Aprendizaje, Arena IA. Estado global con `useReducer`. Localizado a contexto argentino (Joaco/@joaco). Sin dependencias externas de servidor.

#### Base de datos — migración 00002
- `supabase/migrations/00002_gamified_personal_development.sql` — Schema completo del sistema gamificado:
  - ALTER TABLE profiles (+nivel, xp_total, hardcore_mode, streak_days)
  - 12 tablas nuevas: habilidades_stats, gym_rutinas, gym_ejercicios, gym_series_logs, gym_prs, nutricion_alimentos_base, nutricion_diaria_logs, registro_agua, aprendizaje_skills, aprendizaje_logs, finanzas_presupuestos, misiones_diarias
  - 3 funciones PL/pgSQL: xp_umbral_nivel(), otorgar_xp(), restar_xp()
  - 2 triggers: on_mision_estado_changed (XP grant/deduct), on_transaction_check_budget (presupuesto)
  - RLS en todas las tablas nuevas
  - 10 alimentos seeded en nutricion_alimentos_base
  - handle_new_user() actualizado para seedear 3 habilidades_stats iniciales

#### Proyecto
- `package.json` — Proyecto renombrado de `control-de-finanzas` a `desarrollopersonal`

#### Documentación
- `docs/features/gamified-dashboard.md` — Feature doc completo: arquitectura del prototipo, schema de DB, fórmulas XP, triggers, flujo de uso, instrucciones de migración

---

## [0.3.1] — 2026-05-02

### Added — FASE 2 Iteración 2: /api/summary, Mobile polish, Docs

#### Backend
- `src/lib/supabase/admin.ts` — Cliente Supabase con service role key (bypassa RLS, para uso server-only)
- `src/app/api/summary/route.ts` — `GET /api/summary` protegido con `SUMMARY_API_KEY` Bearer token; devuelve `{ balance, totalIncome, totalExpenses, topCategories, period, transactionCount }` calculado server-side con admin client

#### UI — Mobile polish
- `src/components/features/transactions/TransactionList.tsx` — Botón eliminar siempre visible en mobile (`opacity-100 sm:opacity-0 sm:group-hover:opacity-100`), tamaño de tap aumentado en mobile

#### Documentación
- `docs/API_DOCS.md` — Documentados `/api/summary` y actualizados `/api/ai/chat` (Gemini en vez de Anthropic)
- `docs/features/ai-assistant.md` — Agregada sección `/api/summary` con contrato completo
- `CLAUDE.md` — Stack actualizado (Claude API → Gemini), tabla de lookup expandida con todos los archivos nuevos

### Variables de entorno nuevas requeridas
```
SUMMARY_API_KEY=<generar con: openssl rand -hex 32>
SUPABASE_SERVICE_ROLE_KEY=<service role key de tu proyecto Supabase>
```

---

## [0.3.0] — 2026-05-02

### Added — FASE 2 Iteración: Mobile-First + Asistente IA Multimodal

#### Documentación
- `docs/features/ai-assistant.md` — Feature doc completo: arquitectura, flujos MediaRecorder y imagen, API schema

#### Tipos
- `src/types/gemini.types.ts` — Tipos TypeScript para Gemini REST API (`GeminiContent`, `GeminiPart`, `UIMessage`, `ChatAttachment`, `ChatRequestBody`)

#### Backend / Servicios
- `src/services/ai.service.ts` — Reescritura completa: SSE real (`?alt=sse`), soporte multimodal (`inline_data` texto + imagen + audio), historial multi-turn, system prompt AXON (coach implacable financiero + Screen Time)
- `src/app/api/ai/chat/route.ts` — Esquema Zod actualizado: `attachments[]`, `history: GeminiContent[]`, validación de tamaño base64

#### Hooks
- `src/hooks/useAudioRecorder.ts` — MediaRecorder API hook: formato auto-detectado, timer, cleanup de stream
- `src/hooks/useGeminiChat.ts` — Hook de estado del chat: mensajes, streaming, historial multi-turn, welcome message dinámica

#### Componentes UI
- `src/components/features/ai-chat/AIAssistant.tsx` — Componente multimodal unificado (modo `floating` + `embedded`): markdown inline, preview de imagen/audio, grabación de audio, attach de imágenes
- `src/components/features/ai-chat/FloatingChat.tsx` — Simplificado a wrapper de contexto para `AIAssistant`
- `src/components/layout/MobileTopBar.tsx` — Barra superior móvil con hamburger menu
- `src/components/layout/DashboardShell.tsx` — Client wrapper para estado del sidebar móvil
- `src/components/layout/Sidebar.tsx` — Mobile-first: slide-in en mobile, close button, link al chat

#### Layouts
- `src/app/(dashboard)/layout.tsx` — Refactorizado a `DashboardShell`
- `src/app/(dashboard)/chat/page.tsx` — Usa `AIAssistant` en modo embedded

#### Estilos
- `src/app/globals.css` — Keyframe `recording-pulse` + clase `.animate-recording-pulse`

#### Automatización
- `n8n-workflow.json` — Workflow semanal de resumen financiero para importar en n8n

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
