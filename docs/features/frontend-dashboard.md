# Feature: Frontend Dashboard UI & AI Assistant Interface

> **Estado:** En desarrollo
> **Archivos clave:** `src/app/(dashboard)/`, `src/components/`
> **Dependencias:** Recharts, Lucide React, Tailwind CSS, Supabase, Gemini API

---

## Descripción
UI completa del dashboard de finanzas personales en Dark Mode premium. Incluye una Bento Grid con stat cards, pie chart animado, lista de transacciones con skeleton loading y un asistente de IA flotante accesible desde cualquier pantalla del dashboard.

## Jerarquía de Componentes

```
DashboardLayout (src/app/(dashboard)/layout.tsx)
├── Sidebar (src/components/layout/Sidebar.tsx)
│   ├── Logo + App name
│   ├── NavItem[] → Dashboard
│   └── UserSection → email, avatar, logout
│
├── <children> (páginas del dashboard)
│   └── DashboardPage (src/app/(dashboard)/page.tsx)
│       ├── PageHeader (inline — título + mes + botón "Nueva Transacción")
│       ├── StatsRow
│       │   ├── BalanceCard type="balance"
│       │   ├── BalanceCard type="income"
│       │   └── BalanceCard type="expense"
│       └── BentoGrid
│           ├── ExpensePieChart (col-span-2/5)
│           └── TransactionList  (col-span-3/5)
│               └── TransactionSkeleton (estado de carga)
│
└── FloatingChat (src/components/features/ai-chat/FloatingChat.tsx)
    ├── FloatingButton (fixed bottom-right)
    └── ChatPanel (slide-in desde la derecha)
        └── ChatWidget (src/components/features/ai-chat/ChatWidget.tsx)
            ├── ChatHeader
            ├── MessageList
            │   ├── UserBubble
            │   └── AssistantBubble (con streaming dots)
            └── ChatInput
```

## Flujo de Navegación
```
/login ──→ /dashboard (stats + chart + list + floating chat)
                └── [click "Nueva Transacción"] → Modal TransactionForm
                └── [click botón chat]          → Slide panel ChatWidget
```

## Design System
- **Fondo global:** `bg-gray-950` (#030712)
- **Superficie cards:** `bg-gray-900` con `border border-white/5`
- **Sidebar:** `bg-[#0a0a14]` con `border-r border-white/5`
- **Balance:** indigo — `text-indigo-300`, `bg-indigo-500/10`
- **Ingresos:** emerald — `text-emerald-300`, `bg-emerald-500/10`
- **Gastos:** rose — `text-rose-300`, `bg-rose-500/10`
- **Tipografía:** Inter, sans-serif
- **Montos:** `tabular-nums`, `font-bold`, `tracking-tight`
- **Animaciones:** fadeUp (entry), shimmer (skeleton), slideRight (chat panel)

## Componentes / Archivos
| Archivo | Responsabilidad |
|---------|----------------|
| `src/app/(dashboard)/layout.tsx` | Layout raíz: Sidebar + main + FloatingChat |
| `src/app/(dashboard)/page.tsx` | Bento grid + header + botón nueva transacción |
| `src/components/layout/Sidebar.tsx` | Sidebar fijo con nav, avatar de usuario y logout |
| `src/components/features/transactions/BalanceCard.tsx` | Stat card con orb decorativo y gradiente |
| `src/components/features/charts/ExpensePieChart.tsx` | Donut chart con label central y leyenda |
| `src/components/features/transactions/TransactionList.tsx` | Lista con shimmer skeleton y delete |
| `src/components/features/transactions/TransactionForm.tsx` | Modal con animación y validación TS |
| `src/components/features/ai-chat/FloatingChat.tsx` | Botón flotante + panel slide-in |
| `src/components/features/ai-chat/ChatWidget.tsx` | Chat con streaming de Gemini |

## Restricciones
- El chat flotante carga sus propios datos (no depende del parent)
- El skeleton shimmer usa gradiente CSS, NO librerías externas
- Los colores del pie chart vienen de la DB (campo `color` de `categories`)
- El modal de transacción NO debe cerrar si hay un error al guardar
- NUNCA usar `any` — todos los eventos y payloads tipados

## Pendiente
- [x] Feature doc
- [ ] Rediseño de componentes
- [ ] FloatingChat
- [ ] Bento grid layout
- [ ] Skeleton shimmer
- [ ] Modal mejorado
