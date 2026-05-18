# Documentación de API — Control de Finanzas Personales

**Base URL:** `/api`
**Autenticación:** Sesión de Supabase (cookie HttpOnly via `@supabase/ssr`)
**Última actualización:** 2026-05-01 00:00

> **Nota:** La mayoría de las operaciones CRUD (transacciones, categorías, perfil) se realizan directamente desde el cliente a Supabase usando el cliente JS con RLS. Solo se documentan aquí los API Routes de Next.js que requieren lógica server-side especial.

---

## Autenticación

Los endpoints protegidos verifican la sesión de Supabase en el Route Handler. Si no hay sesión activa, retornan `401`.

---

## Índice de Endpoints

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/health` | Estado del servidor | NO |
| POST | `/api/ai/chat` | Chat multimodal con Coach IA (Gemini) | Supabase session |
| GET | `/api/summary` | Resumen financiero del mes (para n8n) | Bearer API key |

---

## Formato de Respuestas

### Exitosa
```json
{
  "data": { ... },
  "message": "Operación exitosa"
}
```

### Error
```json
{
  "error": "Tipo de error",
  "message": "Descripción del error"
}
```

### Stream (Chat IA)
El endpoint `/api/ai/chat` devuelve un `ReadableStream` plain-text (chunks de texto de Gemini SSE).

---

## Endpoints

### Health Check

**`GET /api/health`** — Sin autenticación

**Response 200:**
```json
{
  "status": "ok",
  "timestamp": "2026-05-01T00:00:00Z"
}
```

---

### Chat IA

**`POST /api/ai/chat`** — Requiere sesión activa

Envía un mensaje al asistente de IA de finanzas. El asistente tiene contexto del balance y categorías del usuario.

**Request Body:**
```json
{
  "message": "string — el mensaje del usuario",
  "context": {
    "balance": 1500.00,
    "totalIncome": 5000.00,
    "totalExpenses": 3500.00,
    "topCategories": [
      { "name": "Comida", "amount": 1200.00, "percentage": 34 }
    ]
  }
}
```

**Response:** `text/plain` stream (streaming de Claude)

**Errores:**
| Código | Descripción |
|--------|-------------|
| 401 | Sin sesión activa |
| 400 | Body inválido (falta `message`) |
| 500 | Error de la API de Anthropic |

---

## Códigos de Error Globales

| Código | Descripción |
|--------|-------------|
| 400 | Datos inválidos o faltantes |
| 401 | No autenticado |
| 403 | Sin permisos |
| 404 | Recurso no encontrado |
| 429 | Rate limit excedido (Anthropic) |
| 500 | Error interno del servidor |

---

### Resumen Financiero (para n8n)

**`GET /api/summary`** — Autenticación via Bearer token (no requiere sesión Supabase)

Devuelve el resumen financiero del mes actual. Diseñado para ser consumido por workflows externos como n8n.

**Headers requeridos:**
```
Authorization: Bearer <SUMMARY_API_KEY>
```

**Variables de entorno requeridas:**
- `SUMMARY_API_KEY` — clave secreta, generada manualmente (ej. `openssl rand -hex 32`)
- `SUPABASE_SERVICE_ROLE_KEY` — service role key de Supabase (bypasses RLS)

**Response 200:**
```json
{
  "balance": 1500.00,
  "totalIncome": 5000.00,
  "totalExpenses": 3500.00,
  "topCategories": [
    { "name": "Comida", "amount": 1200.00, "percentage": 34 }
  ],
  "period": { "start": "2026-05-01", "end": "2026-05-31" },
  "transactionCount": 23
}
```

**Errores:**
| Código | Descripción |
|--------|-------------|
| 401 | Token inválido o ausente |
| 500 | `SUMMARY_API_KEY` o `SUPABASE_SERVICE_ROLE_KEY` no configurados |

**Uso en n8n:**
Ver `n8n-workflow.json` en la raíz del proyecto. El workflow llama este endpoint cada lunes a las 9am, analiza los datos con Gemini y envía un email HTML.

---

## Operaciones Directas a Supabase (no API Routes)

Estas operaciones se hacen desde el cliente directamente a Supabase. Se documentan aquí como referencia de los servicios que las implementan.

### Transactions
| Operación | Service | Descripción |
|-----------|---------|-------------|
| Listar | `transaction.service.ts → getAll()` | Obtiene transacciones del usuario con filtros |
| Crear | `transaction.service.ts → create()` | Crea una transacción nueva |
| Actualizar | `transaction.service.ts → update()` | Edita monto, descripción, categoría, fecha |
| Eliminar | `transaction.service.ts → delete()` | Elimina una transacción |

### Categories
| Operación | Service | Descripción |
|-----------|---------|-------------|
| Listar | `category.service.ts → getAll()` | Obtiene categorías del usuario |
| Crear | `category.service.ts → create()` | Crea una categoría personalizada |
| Actualizar | `category.service.ts → update()` | Edita nombre, color, ícono |
| Eliminar | `category.service.ts → delete()` | Elimina categoría (si no tiene transacciones) |
