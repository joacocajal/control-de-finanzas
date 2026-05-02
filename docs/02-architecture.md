# Arquitectura — Control de Finanzas Personales

## Stack Completo
| Dependencia | Versión | Propósito |
|-------------|---------|-----------|
| `next` | 15.x | Framework full-stack (App Router) |
| `react` | 18.x | UI library |
| `react-dom` | 18.x | DOM rendering |
| `typescript` | 5.x | Tipado estático (strict mode) |
| `tailwindcss` | 3.x | Estilos utilitarios |
| `@shadcn/ui` | latest | Componentes UI accesibles |
| `lucide-react` | latest | Iconos SVG |
| `recharts` | latest | Gráficos de torta y barras |
| `@supabase/supabase-js` | 2.x | Cliente de Supabase (DB + Auth) |
| `@supabase/ssr` | latest | Supabase con SSR para Next.js |
| `@anthropic-ai/sdk` | latest | Claude API (chat de IA) |
| `zod` | 3.x | Validación de schemas |

## Estructura de Carpetas
```
control-de-finanzas/
├── docs/                               # Documentación AInnovate
│   ├── 01-project-overview.md
│   ├── 02-architecture.md
│   ├── 03-security.md
│   ├── 04-deployment.md
│   ├── DB_SCHEMA.md
│   ├── API_DOCS.md
│   ├── SKILLS.md
│   └── features/                       # Un .md por funcionalidad
│
├── src/
│   ├── app/                            # Next.js App Router
│   │   ├── (auth)/                     # Grupo de rutas de auth
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/                # Rutas protegidas
│   │   │   ├── layout.tsx              # Layout con sidebar/nav
│   │   │   ├── page.tsx                # Dashboard principal
│   │   │   ├── transactions/
│   │   │   │   └── page.tsx
│   │   │   └── chat/
│   │   │       └── page.tsx
│   │   ├── api/                        # API Routes
│   │   │   ├── ai/
│   │   │   │   └── chat/
│   │   │   │       └── route.ts
│   │   │   └── health/
│   │   │       └── route.ts
│   │   ├── globals.css
│   │   ├── layout.tsx                  # Root layout
│   │   └── page.tsx                    # Landing / redirect
│   │
│   ├── components/                     # Componentes reutilizables
│   │   ├── ui/                         # Componentes base (Shadcn)
│   │   ├── layout/                     # Header, Sidebar, Container
│   │   │   ├── Header/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Header.types.ts
│   │   │   │   └── index.ts
│   │   │   └── Sidebar/
│   │   │       ├── Sidebar.tsx
│   │   │       ├── Sidebar.types.ts
│   │   │       └── index.ts
│   │   └── features/                   # Componentes por feature
│   │       ├── transactions/
│   │       ├── charts/
│   │       └── ai-chat/
│   │
│   ├── lib/                            # Utilidades y configs
│   │   ├── supabase/
│   │   │   ├── client.ts               # Cliente browser
│   │   │   ├── server.ts               # Cliente server
│   │   │   └── middleware.ts           # Auth middleware helper
│   │   └── utils/
│   │       ├── formatters.ts           # formatCurrency, formatDate
│   │       └── calculations.ts         # calcBalance, calcPercentages
│   │
│   ├── hooks/                          # Custom hooks
│   │   ├── useTransactions.ts
│   │   ├── useCategories.ts
│   │   └── useBalance.ts
│   │
│   ├── types/                          # Tipos globales
│   │   ├── database.types.ts           # Generado por Supabase CLI
│   │   ├── transaction.types.ts
│   │   └── category.types.ts
│   │
│   ├── constants/                      # Constantes
│   │   ├── CATEGORIES.ts               # Categorías por defecto
│   │   └── API_ENDPOINTS.ts
│   │
│   └── services/                       # Lógica de acceso a datos
│       ├── transaction.service.ts
│       ├── category.service.ts
│       └── ai.service.ts
│
├── supabase/                           # Supabase config
│   ├── migrations/
│   │   └── 00001_initial_schema.sql
│   └── config.toml
│
├── public/                             # Assets estáticos
│
├── .windsurfrules                      # Reglas para Windsurf
├── .cursorrules                        # Reglas para Cursor
├── .clinerules                         # Reglas para Cline
├── .aider.conf.yml                     # Reglas para Aider
├── .github/
│   └── copilot-instructions.md        # Reglas para Copilot
├── CLAUDE.md                           # Reglas para Claude Code
├── CHANGELOG.md
├── METODO_AINNOVATE.md
├── .env.example
├── .env.local                          # NO COMMIT
├── .gitignore
├── middleware.ts                       # Next.js middleware (auth)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Base de Datos
Supabase (PostgreSQL). Detalle completo en [docs/DB_SCHEMA.md](DB_SCHEMA.md).

| Tabla | Descripción |
|-------|-------------|
| `auth.users` | Manejada por Supabase Auth |
| `profiles` | Datos extra del usuario (nombre, avatar) |
| `categories` | Categorías de gastos/ingresos por usuario |
| `transactions` | Ingresos y gastos del usuario |

## Flujo de Datos
```
Usuario → Componente React
         → Custom Hook (useTransactions)
         → Service (transaction.service.ts)
         → Supabase Client
         → PostgreSQL (con RLS)
         → Devuelve datos tipados
         → Re-render del componente
```

Para el chat de IA:
```
Usuario → ChatInput component
         → POST /api/ai/chat
         → Server Action / Route Handler
         → Anthropic SDK (Claude API)
         → Stream de respuesta
         → ChatMessage component
```

## Variables de Entorno
| Variable | Descripción | Tipo | Requerida |
|----------|-------------|------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | pública | SI |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key de Supabase | pública | SI |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (solo server) | privada | SI |
| `ANTHROPIC_API_KEY` | API key de Claude/Anthropic | privada | SI |

## Convenciones del Proyecto
| Tipo | Convención | Ejemplo |
|------|------------|---------|
| Componentes | PascalCase | `TransactionCard.tsx` |
| Hooks | camelCase + "use" | `useTransactions.ts` |
| Utilidades | camelCase | `formatCurrency.ts` |
| Constantes | SCREAMING_SNAKE | `DEFAULT_CATEGORIES.ts` |
| Tipos/Interfaces | PascalCase | `Transaction.types.ts` |
| Servicios | camelCase + .service | `transaction.service.ts` |
| Props interfaces | `NombreProps` | `TransactionCardProps` |
| Variables CSS Tailwind | según tailwind.config | `text-primary`, `bg-card` |

## Decisiones Arquitectónicas

### ADR-001: Next.js App Router sobre Pages Router
**Fecha:** 2026-05-01
**Contexto:** Next.js 15 usa App Router como estándar. Mejor soporte para Server Components.
**Decisión:** App Router con grupos de rutas `(auth)` y `(dashboard)`.
**Consecuencias:** Server Components por defecto; agregar `"use client"` solo cuando sea necesario.

### ADR-002: Supabase como BaaS
**Fecha:** 2026-05-01
**Contexto:** Necesitamos auth + base de datos + RLS sin backend custom.
**Decisión:** Supabase con `@supabase/ssr` para integración con Next.js.
**Consecuencias:** RLS obligatorio en todas las tablas con datos de usuario.

### ADR-003: TypeScript estricto
**Fecha:** 2026-05-01
**Contexto:** Mandamiento IX del Método AInnovate.
**Decisión:** `strict: true` en tsconfig, `no-explicit-any` como error.
**Consecuencias:** Más código de tipado inicial, pero cero errores de runtime por tipos.

### ADR-004: Separación lógica/estilos
**Fecha:** 2026-05-01
**Contexto:** Mandamiento II del Método AInnovate.
**Decisión:** Tailwind en JSX para estilos, lógica de negocio en servicios y hooks separados.
**Consecuencias:** Componentes más verbosos pero completamente testeables.
