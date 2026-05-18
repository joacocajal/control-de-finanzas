# Feature: Gamified Personal Development Dashboard

## Resumen

Dashboard RPG gamificado que convierte el desarrollo personal (finanzas, fitness, aprendizaje) en un juego de progresión con XP, niveles y misiones diarias. Implementado como prototipo standalone (`index.html`) y esquema de base de datos Supabase (`00002_gamified_personal_development.sql`).

---

## Arquitectura

### 1. Prototipo standalone — `index.html`

Archivo único autónomo en la raíz del proyecto. No requiere servidor — funciona vía `file://`.

**Stack del prototipo:**
- React 18 via CDN (`react@18.3.1` + `react-dom`)
- Babel Standalone para transpilación in-browser de JSX
- Tailwind CSS via CDN
- Lucide Icons UMD build
- Google Fonts: Space Grotesk + JetBrains Mono

**Estructura del archivo (3 `<script type="text/babel">`):**
1. **Bloque de componentes** — primitivos UI reutilizables: `XPBar`, `ProgressRing`, `Sparkline`, `QuestRow`, `LevelBadge`, `Tabs`, `useToast`, `useAnimatedNumber`
2. **Bloque de vistas** — páginas completas: `DashboardView`, `FinancesView`, `FitnessView`, `LearningView`, `ArenaView` (chat IA mock)
3. **App shell** — `INITIAL_STATE`, `reducer`, `Sidebar`, `Header`, componente `App` con `useReducer`

**Estado global (`INITIAL_STATE`):**
```js
{
  user: { name, handle, level, xp, xpNext, streak },
  finances: { balance, income, expenses, cashflow[] },
  fitness: { lifts[], weeklyActivity[], lastWorkout },
  learning: { skills[], recentSessions[] },
  quests: { daily[], weekly[] },
  chat: { messages[] }
}
```

**Navegación:** Sidebar con 5 secciones — Dashboard, Finanzas, Fitness, Aprendizaje, Arena IA.

---

### 2. Schema de base de datos — `supabase/migrations/00002_gamified_personal_development.sql`

#### Tablas nuevas / modificadas

| Tabla | Tipo | Descripción |
|-------|------|-------------|
| `profiles` (ALTER) | Existente | +`nivel`, `xp_total`, `hardcore_mode`, `streak_days` |
| `habilidades_stats` | Nueva | XP por categoría (finanzas/fitness/aprendizaje) con nivel propio |
| `gym_rutinas` | Nueva | Plantillas de rutina de usuario |
| `gym_ejercicios` | Nueva | Ejercicios dentro de una rutina |
| `gym_series_logs` | Nueva | Sets completados (peso, reps, fecha) |
| `gym_prs` | Nueva | Personal Records automáticos por ejercicio |
| `nutricion_alimentos_base` | Nueva | Catálogo público de alimentos con macros |
| `nutricion_diaria_logs` | Nueva | Log diario de comidas de usuario |
| `registro_agua` | Nueva | Consumo de agua diario |
| `aprendizaje_skills` | Nueva | Skills de aprendizaje del usuario |
| `aprendizaje_logs` | Nueva | Sesiones de estudio registradas |
| `finanzas_presupuestos` | Nueva | Presupuestos mensuales por categoría |
| `misiones_diarias` | Nueva | Misiones con estado pendiente/completada/fallada |

#### Funciones PL/pgSQL

```sql
-- Calcula XP umbral para un nivel (curva RPG)
public.xp_umbral_nivel(p_nivel int) → int
-- Fórmula: FLOOR(100 * POWER(1.15, p_nivel - 1))

-- Otorga XP a perfil y categoría, con cascade level-up
public.otorgar_xp(p_perfil_id uuid, p_categoria text, p_xp_ganado int) → void

-- Resta XP (modo hardcore) con floor en 0
public.restar_xp(p_perfil_id uuid, p_categoria text, p_xp_perdido int) → void
```

#### Triggers

| Trigger | Tabla | Evento | Acción |
|---------|-------|--------|--------|
| `on_mision_estado_changed` | `misiones_diarias` | UPDATE OF estado | Si completada → `otorgar_xp`. Si fallada + hardcore → `restar_xp` |
| `on_transaction_check_budget` | `transactions` | INSERT | Verifica presupuesto de categoría; si supera, escribe en `misiones_diarias` estado=fallada |

#### RLS

Todas las tablas nuevas tienen RLS habilitado con políticas `USING (auth.uid() = perfil_id)`. `nutricion_alimentos_base` tiene política pública de lectura (sin autenticación).

---

## Datos iniciales

- **10 alimentos** en `nutricion_alimentos_base`: Avena, Pechuga de pollo, Huevo entero, Arroz integral, Brócoli, Banana, Atún en lata, Leche entera, Batata, Almendras
- **3 habilidades** iniciales por usuario nuevo (seeded en `handle_new_user()`): finanzas, fitness, aprendizaje — nivel 1, XP 0

---

## Fórmula de progresión XP

```
Nivel 1 → 2:  100 XP
Nivel 2 → 3:  115 XP
Nivel 3 → 4:  132 XP
...
Nivel N → N+1: FLOOR(100 × 1.15^(N-1)) XP
```

Overflow de XP al subir de nivel: 20% del overflow se propaga al XP global del perfil. El XP global recibe además el 10% del XP ganado por categoría.

---

## Flujo de uso

```
Usuario completa acción (gym set, sesión de estudio, etc.)
  → INSERT en tabla de log correspondiente
  → Trigger o función del servidor llama a otorgar_xp()
  → habilidades_stats.xp_actual aumenta
  → Si xp_actual >= xp_umbral_nivel(nivel+1) → nivel++ con overflow
  → profiles.xp_total y profiles.nivel se actualizan
  → Frontend muestra animación de level-up
```

---

## Cómo aplicar la migración

```bash
# Desde la raíz del proyecto
supabase db push

# O pegar el contenido en Supabase SQL Editor:
# Dashboard → SQL Editor → New query → pegar 00002_gamified_personal_development.sql
```

**Nota:** La función `handle_new_user()` se reemplaza con `CREATE OR REPLACE FUNCTION`. El trigger en `auth.users` de la migración 00001 sigue activo y apuntará automáticamente a la nueva versión.

---

## Limitaciones actuales (prototipo)

- `index.html` usa datos mock hardcodeados — no conecta a Supabase
- La Arena IA usa respuestas mock estáticas — no llama a Gemini API
- El prototipo es solo para validación de diseño/UX
- La integración real del dashboard gamificado en la app Next.js está pendiente
