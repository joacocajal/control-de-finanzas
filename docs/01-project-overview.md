# Control de Finanzas Personales

## Visión
Web App de gestión de finanzas personales que permite al usuario registrar ingresos y gastos, categorizarlos (Comida, Gym, Streetwear, etc.), visualizar el balance total y analizar la distribución del gasto mediante gráficos de torta. Incluye un asistente de IA para consejos financieros personalizados.

## Objetivos
- Registrar ingresos y gastos con categoría, monto, fecha y descripción
- Visualizar el balance total (ingresos − gastos) en tiempo real
- Ver gráficos de torta con la distribución porcentual de cada categoría
- Consultar un asistente de IA para obtener consejos financieros basados en los datos del usuario
- Gestionar categorías personalizadas por usuario

## Stack Técnico
| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend | React (via Next.js) | 18.x |
| Framework | Next.js (App Router) | 15.x |
| Backend | Next.js API Routes + Server Actions | - |
| Base de datos | Supabase (PostgreSQL) | - |
| Auth | Supabase Auth | - |
| Estilos | Tailwind CSS | 3.x |
| Componentes UI | Shadcn UI | latest |
| Iconos | Lucide React | latest |
| Gráficos | Recharts | latest |
| IA Chat | Claude API (Anthropic) | latest |
| Deploy | Vercel | - |
| Lenguaje | TypeScript (strict) | 5.x |

## Estado del Proyecto
| Fase | Descripción | Estado |
|------|-------------|--------|
| 1 | Setup + Documentación base | [x] Completo |
| 2 | Auth (registro, login, logout) | [x] Completo |
| 3 | CRUD de transacciones | [x] Completo |
| 4 | Dashboard con gráficos | [x] Completo |
| 5 | Chat de asistente IA | [x] Completo |
| 6 | Gestión de categorías | [ ] Pendiente |
| 7 | Polish + Deploy | [ ] Pendiente |

## Principio Fundamental
> El usuario siempre tiene control total sobre sus datos financieros. La privacidad y la seguridad son no negociables: cada usuario solo ve sus propias transacciones gracias a RLS en Supabase.
