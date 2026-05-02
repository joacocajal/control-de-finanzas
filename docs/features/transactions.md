# Feature: Dashboard de Finanzas y Transacciones

> **Estado:** En desarrollo
> **Archivos clave:** `src/app/(dashboard)/page.tsx`, `src/services/transaction.service.ts`, `src/services/category.service.ts`, `src/components/features/transactions/`, `src/components/features/charts/`
> **Dependencias:** Supabase, Recharts, Lucide React, @google/generative-ai

---

## Descripción
Dashboard principal de la app de finanzas. Permite al usuario ver su balance total, ingresos y gastos del mes, la distribución de gastos por categoría (gráfico de torta) y registrar nuevas transacciones. Incluye asistente de IA con Gemini para consejos financieros.

## Objetivo
Que el usuario pueda visualizar su situación financiera de un vistazo y agregar transacciones en segundos.

## Modelo de Datos
Tablas: `transactions`, `categories`. Detalle completo en `docs/DB_SCHEMA.md`.

- Una transacción tiene: tipo (income|expense), monto, categoría, descripción, fecha
- Las categorías pertenecen al usuario y tienen nombre, color e ícono
- El balance = suma de ingresos − suma de gastos del mes

## Flujo de Uso
1. Usuario entra al dashboard — ve 3 cards: Balance, Ingresos del mes, Gastos del mes
2. Debajo: gráfico de torta con % por categoría (solo gastos) + lista de últimas transacciones
3. Hace clic en "Agregar" — se abre un modal con el formulario
4. Completa: tipo, monto, categoría, descripción (opcional), fecha
5. Guarda — la card de balance y el gráfico se actualizan en tiempo real
6. En la pestaña "IA" puede chatear con Gemini que conoce sus datos financieros

## Componentes / Archivos
| Archivo | Responsabilidad |
|---------|----------------|
| `src/app/(dashboard)/page.tsx` | Página principal del dashboard (client) |
| `src/app/(dashboard)/layout.tsx` | Layout con sidebar |
| `src/app/(dashboard)/chat/page.tsx` | Página del chat de IA |
| `src/services/transaction.service.ts` | CRUD de transacciones en Supabase |
| `src/services/category.service.ts` | Lectura de categorías del usuario |
| `src/services/ai.service.ts` | Integración con Gemini API |
| `src/hooks/useTransactions.ts` | Hook para transacciones con estado |
| `src/hooks/useCategories.ts` | Hook para categorías |
| `src/lib/utils/calculations.ts` | calcBalance, calcCategoryTotals |
| `src/lib/utils/formatters.ts` | formatCurrency, formatDate |
| `src/components/features/transactions/BalanceCard.tsx` | Card de balance/ingresos/gastos |
| `src/components/features/transactions/TransactionForm.tsx` | Formulario de nueva transacción |
| `src/components/features/transactions/TransactionList.tsx` | Lista de últimas transacciones |
| `src/components/features/charts/ExpensePieChart.tsx` | Gráfico de torta por categoría |
| `src/components/features/ai-chat/ChatWidget.tsx` | Interfaz del chat con Gemini |
| `src/components/layout/Sidebar.tsx` | Navegación lateral |

## API / Endpoints
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/ai/chat` | Envía mensaje a Gemini con contexto financiero |

## UI / Pantallas
**Dashboard:**
- Dark mode completo (bg-gray-950)
- 3 cards superiores: Balance (indigo), Ingresos (emerald), Gastos (red)
- Grid inferior: gráfico de torta (izquierda) + lista de transacciones (derecha)
- Botón flotante "+ Agregar" que abre modal
- Sidebar fijo en desktop, hamburger en mobile

**Modal Formulario:**
- Toggle Ingreso/Gasto
- Input de monto (numérico)
- Select de categoría (con color indicator)
- Input de descripción (opcional)
- DatePicker (default: hoy)
- Botón Guardar + Cancelar

## Restricciones
- El monto SIEMPRE debe ser positivo (el tipo income/expense determina la dirección)
- Las categorías son del usuario autenticado (RLS en Supabase)
- No se puede borrar una categoría que tiene transacciones
- El gráfico de torta muestra SOLO gastos del mes actual
- NUNCA exponer datos de otro usuario

## Pendiente
- [x] Feature doc
- [x] Services (transaction, category, ai)
- [x] Hooks
- [x] Componentes UI
- [x] Dashboard page
- [x] AI chat page
- [x] Auth flow (login/register)
