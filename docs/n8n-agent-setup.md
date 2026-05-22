# Ascend AI Hub — Setup del Workflow n8n

> Un solo workflow en n8n que centraliza los tres flujos IA de Ascend.  
> Instancia n8n: `https://jcwebhook.levelstudios.site`  
> Modelo IA: Gemini 2.5 Flash (`gemini-2.5-flash`)  
> Última actualización: 2026-05-21

---

## Índice

1. [Prerrequisitos](#1-prerrequisitos)
2. [Arquitectura del workflow único](#2-arquitectura-del-workflow-único)
3. [Rama A — Chat del Agente](#3-rama-a--chat-del-agente)
4. [Rama B — Reporte Semanal](#4-rama-b--reporte-semanal)
5. [Rama C — Sugerir Hitos](#5-rama-c--sugerir-hitos)
6. [Las 13 Function Declarations (Gemini)](#6-las-13-function-declarations-gemini)
7. [Variables de entorno en n8n](#7-variables-de-entorno-en-n8n)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Prerrequisitos

### Software
- n8n ≥ 1.40 (Docker recomendado)
- curl o Postman para pruebas

### Credenciales en n8n
Ambas ya existen con el nombre **`desarrollopersonal`**. Verificar que estén así:

| Credential name | Tipo en n8n | Configuración |
|---|---|---|
| `desarrollopersonal` (Gemini) | Header Auth | Header Name: `x-goog-api-key` · Value: tu GEMINI_API_KEY |
| `desarrollopersonal` (Supabase) | Header Auth | Header Name: `apikey` · Value: service role key |

> En los HTTP Request nodes que llaman a Gemini, seleccioná la credencial `desarrollopersonal`. El header `x-goog-api-key` se agrega automáticamente.
>
> Las llamadas a Supabase dentro de Code nodes usan `$env.SUPABASE_SERVICE_KEY` directamente en `fetch()`, no necesitan el nodo credential.

### Tablas de Supabase que toca el agente
```
transactions          — gastos e ingresos
categories            — categorías de gastos
workout_sessions      — sesiones de gym
workout_sets          — series de cada ejercicio
food_logs             — log de comidas
water_logs            — registro de agua
aprendizaje_skills    — skills (perfil_id = user_id)
aprendizaje_logs      — horas de estudio
skill_milestones      — hitos de habilidades
journal_entries       — diario personal
financial_goals       — metas financieras
agent_notifications   — notificaciones push
agent_actions_log     — log de acciones reversibles
```

---

## 2. Arquitectura del workflow único

**Nombre del workflow:** `Ascend AI Hub`

En n8n cada trigger dispara su propia rama de ejecución dentro del mismo workflow. No existe un Switch central (los triggers no pueden "mergearse" antes de un nodo sin perder contexto), pero todo vive en el mismo canvas y comparte las mismas credenciales y variables de entorno.

```
┌─────────────────────────────────────────────────────────────────────┐
│  ASCEND AI HUB                                                      │
│                                                                     │
│  [Webhook POST /ascend-agent]  ──────────►  RAMA A: Chat           │
│                                              │                      │
│  [Schedule — domingos 20:00]   ──────────►  RAMA B: Reporte        │
│                                              │                      │
│  [Webhook POST /ascend-milestones] ──────►  RAMA C: Hitos          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

URLs de los webhooks:
```
https://jcwebhook.levelstudios.site/webhook/ascend-agent
https://jcwebhook.levelstudios.site/webhook/ascend-milestones
```

> **Por qué no un Switch central:** n8n ejecuta cada trigger en una instancia separada. Si conectaras los tres a un nodo Merge, el workflow esperaría que los tres disparen juntos antes de continuar, lo que nunca pasaría. La separación en ramas es el patrón correcto y recomendado por n8n para múltiples triggers.

---

## 3. Rama A — Chat del Agente

**Trigger:** `Webhook — POST /webhook/ascend-agent`  
**Respuesta al app:** `{ response: string, metadata: object }`

### Body esperado

```json
{
  "user_id": "72e108ae-dab8-4adb-82ff-2bd995183007",
  "conversation_id": "a1b2c3d4-...",
  "message": "¿Cuánto gasté en comida esta semana?",
  "history": [
    { "role": "user",      "content": "Hola" },
    { "role": "assistant", "content": "Hola Joaco, ¿qué necesitás?" }
  ]
}
```

---

### A-1: Validar payload

```javascript
// Code Node
const { user_id, message, conversation_id, history } = $json.body ?? $json;
if (!user_id || !message) {
  throw new Error(`Payload inválido. Recibido: ${JSON.stringify($json).slice(0, 200)}`);
}
return [{ json: {
  user_id,
  message,
  conversation_id: conversation_id ?? null,
  history: history ?? [],
} }];
```

---

### A-2: Fetch contexto del usuario (Supabase)

```javascript
// Code Node — 7 requests paralelos
const SUPABASE_URL = $env.SUPABASE_URL;
const SK = $env.SUPABASE_SERVICE_KEY;

const h = {
  'apikey': SK,
  'Authorization': `Bearer ${SK}`,
  'Content-Type': 'application/json',
};

const uid    = $json.user_id;
const since7 = new Date(Date.now() -  7 * 86400000).toISOString();
const since30= new Date(Date.now() - 30 * 86400000).toISOString();
const hoy    = new Date().toISOString().split('T')[0];
const base   = `${SUPABASE_URL}/rest/v1`;

const [txRes, gymRes, setsRes, foodRes, waterRes, skillsRes, diarioRes] = await Promise.all([
  fetch(`${base}/transactions?user_id=eq.${uid}&transaction_date=gte.${since30}&order=transaction_date.desc&limit=50&select=type,amount,amount_ars,description,transaction_date,categories(name)`, { headers: h }),
  fetch(`${base}/workout_sessions?user_id=eq.${uid}&started_at=gte.${since7}&order=started_at.desc&limit=7&select=id,routine_name_snapshot,duration_minutes,started_at`, { headers: h }),
  fetch(`${base}/workout_sets?session_id=in.(select id from workout_sessions where user_id=eq.${uid} order by started_at desc limit 1)&select=exercise_name,set_number,reps,weight_kg`, { headers: h }),
  fetch(`${base}/food_logs?user_id=eq.${uid}&consumed_at=gte.${since7}&order=consumed_at.desc&limit=30&select=calories,protein,carbs,fat,meal_type,consumed_at,foods(name)`, { headers: h }),
  fetch(`${base}/water_logs?user_id=eq.${uid}&logged_at=gte.${hoy}&select=liters`, { headers: h }),
  fetch(`${base}/aprendizaje_skills?perfil_id=eq.${uid}&select=id,nombre_habilidad,nivel_skill,xp_skill`, { headers: h }),
  fetch(`${base}/journal_entries?user_id=eq.${uid}&order=entry_date.desc&limit=1&select=entry_date,mood,what_i_did,what_i_achieved,how_i_felt,tomorrow_focus`, { headers: h }),
]);

const [txs, workouts, sets, food, water, skills, diario] = await Promise.all([
  txRes.json(), gymRes.json(), setsRes.json(),
  foodRes.json(), waterRes.json(), skillsRes.json(), diarioRes.json(),
]);

return [{ json: {
  ...$json,
  context: {
    transactions: Array.isArray(txs)      ? txs      : [],
    workouts:     Array.isArray(workouts)  ? workouts  : [],
    workout_sets: Array.isArray(sets)      ? sets      : [],
    food:         Array.isArray(food)      ? food      : [],
    water_today:  Array.isArray(water)     ? water.reduce((s, w) => s + (w.liters ?? 0), 0) : 0,
    skills:       Array.isArray(skills)    ? skills    : [],
    diario:       Array.isArray(diario)    ? (diario[0] ?? null) : null,
  },
} }];
```

---

### A-3: Armar system prompt + convertir history a formato Gemini

```javascript
// Code Node
const { context, message, history, user_id } = $json;
const { transactions, workouts, food, water_today, skills, diario } = context;

// ── Calcular finanzas ──
const ingresos = transactions.filter(t => t.type === 'income')
  .reduce((s, t) => s + (t.amount_ars ?? t.amount ?? 0), 0);
const gastos = transactions.filter(t => t.type === 'expense')
  .reduce((s, t) => s + (t.amount_ars ?? t.amount ?? 0), 0);

const catMap = {};
for (const t of transactions.filter(t => t.type === 'expense')) {
  const cat = t.categories?.name ?? 'Sin categoría';
  catMap[cat] = (catMap[cat] ?? 0) + (t.amount_ars ?? t.amount ?? 0);
}
const topCats = Object.entries(catMap)
  .sort((a, b) => b[1] - a[1]).slice(0, 5)
  .map(([n, v]) => `  • ${n}: $${v.toFixed(0)} ARS`).join('\n') || '  • Sin datos';

const gymResumen = workouts.length > 0
  ? workouts.map(w => `  • ${w.routine_name_snapshot} — ${w.duration_minutes ?? '?'}min (${new Date(w.started_at).toLocaleDateString('es-AR')})`).join('\n')
  : '  • Sin sesiones esta semana';

const caloriasDiarias = food.length > 0
  ? (food.reduce((s, f) => s + (f.calories ?? 0), 0) / 7).toFixed(0)
  : 'sin datos';

const skillsResumen = skills.length > 0
  ? skills.map(s => `  • ${s.nombre_habilidad} — Nivel ${s.nivel_skill}`).join('\n')
  : '  • Sin skills activas';

// ── System prompt ──
const systemPrompt = `Sos Ascend AI — el asistente personal de Joaco.
Joaco es un pibe argentino de 17 años construyendo su Personal Dev OS: finanzas, fitness, aprendizaje y bienestar.

━━━ PERSONALIDAD ━━━
• Hablás en español rioplatense: "vos", "che", "dale", "está piola", "copado"
• Directo al punto, sin relleno ni frases motivadoras vacías
• Cuando hay algo para mejorar, lo decís sin vueltas pero con onda
• Usás números reales del contexto — NUNCA inventés cifras
• Si no tenés datos para algo, lo decís: "No tengo ese dato"
• Respuestas de máximo 3-4 párrafos o bullets. Nada de paredes de texto
• Markdown permitido: **negrita**, bullets, tablas — el cliente lo renderiza bien

━━━ CONTEXTO ACTUAL DE JOACO ━━━

📈 FINANZAS (últimos 30 días)
• Ingresos: $${ingresos.toFixed(0)} ARS
• Gastos: $${gastos.toFixed(0)} ARS
• Balance: $${(ingresos - gastos).toFixed(0)} ARS
Top categorías de gasto:
${topCats}

💪 FITNESS (últimos 7 días)
${gymResumen}
• Calorías promedio diario: ${caloriasDiarias} kcal
• Agua hoy: ${water_today.toFixed(1)}L

📚 APRENDIZAJE
${skillsResumen}

📔 ÚLTIMO DIARIO
${diario
  ? `• Fecha: ${diario.entry_date} | Mood: ${diario.mood ?? '?'}/5
• Qué hice: ${(diario.what_i_did ?? '—').slice(0, 120)}
• Cómo me sentí: ${(diario.how_i_felt ?? '—').slice(0, 120)}
• Foco de mañana: ${(diario.tomorrow_focus ?? '—').slice(0, 80)}`
  : '• Sin entrada reciente'}

━━━ CAPACIDADES DEL AGENTE ━━━
Podés usar functions para LEER y ESCRIBIR datos reales en Supabase.
Cuando el usuario pida registrar, agregar, modificar o borrar algo → usá la function correspondiente.
Siempre confirmá con el usuario antes de ejecutar una acción destructiva (delete).
Después de ejecutar una function, reportá el resultado en lenguaje natural.

━━━ REGLAS DE ESCRITURA EN DB ━━━
• Registrar siempre en agent_actions_log con reasoning claro
• Si el usuario no dio todos los datos → preguntá antes de escribir
• Si el usuario pide borrar algo → confirmá con "¿Confirmás que querés borrar X?"
• Si una function falla → explicá el error en lenguaje natural y ofrecé alternativas

Respondé SIEMPRE en español rioplatense, informal pero claro. Nunca uses neutro ni mexicanismos.`;

// ── Convertir history al formato Gemini ──
// Gemini usa "model" en vez de "assistant", y parts en vez de content string
const geminiContents = [
  ...history.slice(-10).map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  })),
  { role: 'user', parts: [{ text: message }] },
];

return [{ json: {
  systemPrompt,
  geminiContents,
  user_id,
  conversation_id: $json.conversation_id,
} }];
```

---

### A-4: Llamar a Gemini con function calling

**Nodo:** HTTP Request  
**Credencial:** `desarrollopersonal` (Header Auth — agrega `x-goog-api-key` automáticamente)

```
Method: POST
URL: https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent
Headers: (automático desde credencial)
```

**Body (JSON mode en n8n):**
```json
{
  "systemInstruction": {
    "parts": [{ "text": "={{ $json.systemPrompt }}" }]
  },
  "contents": "={{ $json.geminiContents }}",
  "tools": [{ "functionDeclarations": "={{ $json.functionDeclarations }}" }],
  "toolConfig": {
    "functionCallingConfig": { "mode": "AUTO" }
  },
  "generationConfig": {
    "temperature": 0.7,
    "maxOutputTokens": 4096
  }
}
```

> Las `functionDeclarations` las preparás en el nodo A-3 junto con el system prompt (ver Sección 6 para el array completo). Agregá al final del Nodo A-3:
> ```javascript
> return [{ json: { systemPrompt, geminiContents, user_id,
>   conversation_id: $json.conversation_id,
>   functionDeclarations: GEMINI_FUNCTION_DECLARATIONS,  // array de la Sección 6
> } }];
> ```

---

### A-5: IF — ¿Gemini llamó alguna función?

**Nodo:** IF  
**Condición:**
```javascript
// Expression
{{ $json.candidates[0].content.parts.some(p => p.functionCall != null) }}
// = true  → ejecutar functions (A-6)
// = false → formatear respuesta (A-7)
```

---

### A-6: Ejecutar functions (Code Node)

```javascript
// Code Node — ejecuta cada functionCall de Gemini y prepara functionResponses
const SUPABASE_URL = $env.SUPABASE_URL;
const SK = $env.SUPABASE_SERVICE_KEY;
const uid = $json.user_id;

const h = {
  'apikey': SK,
  'Authorization': `Bearer ${SK}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
};

const parts = $json.candidates[0].content.parts ?? [];
const functionCalls = parts.filter(p => p.functionCall != null).map(p => p.functionCall);
const functionResponses = [];

for (const fc of functionCalls) {
  const { name, args } = fc;
  let result;

  try {
    switch (name) {

      case 'read_transactions': {
        let url = `${SUPABASE_URL}/rest/v1/transactions?user_id=eq.${uid}`
          + `&select=type,amount,amount_ars,description,transaction_date,categories(name)`
          + `&order=transaction_date.desc&limit=${args.limit ?? 20}`;
        if (args.date_from)     url += `&transaction_date=gte.${args.date_from}`;
        if (args.date_to)       url += `&transaction_date=lte.${args.date_to}`;
        if (args.type)          url += `&type=eq.${args.type}`;
        if (args.category_name) url += `&categories.name=ilike.${encodeURIComponent(args.category_name)}`;
        const r = await fetch(url, { headers: h });
        result = await r.json();
        break;
      }

      case 'create_transaction': {
        let category_id = null;
        if (args.category_name) {
          const cr = await fetch(`${SUPABASE_URL}/rest/v1/categories?user_id=eq.${uid}&name=ilike.${encodeURIComponent(args.category_name)}&select=id&limit=1`, { headers: h });
          const cats = await cr.json();
          category_id = cats[0]?.id ?? null;
        }
        const r = await fetch(`${SUPABASE_URL}/rest/v1/transactions`, {
          method: 'POST', headers: h,
          body: JSON.stringify({
            user_id: uid, type: args.type, amount: args.amount,
            currency: args.currency ?? 'ARS', description: args.description,
            transaction_date: args.transaction_date, category_id,
          }),
        });
        result = await r.json();
        break;
      }

      case 'log_workout_session': {
        const sessionR = await fetch(`${SUPABASE_URL}/rest/v1/workout_sessions`, {
          method: 'POST', headers: h,
          body: JSON.stringify({
            user_id: uid,
            routine_name_snapshot: args.routine_name_snapshot,
            duration_minutes: args.duration_minutes ?? null,
            started_at: new Date().toISOString(),
            finished_at: new Date().toISOString(),
            notes: args.notes ?? null,
          }),
        });
        const sessions = await sessionR.json();
        const sessionId = sessions[0]?.id;
        if (sessionId && args.sets?.length) {
          await fetch(`${SUPABASE_URL}/rest/v1/workout_sets`, {
            method: 'POST', headers: h,
            body: JSON.stringify(args.sets.map((s, i) => ({
              session_id: sessionId,
              exercise_name: s.exercise_name,
              set_number: s.set_number ?? (i + 1),
              reps: s.reps ?? null, weight_kg: s.weight_kg ?? null,
            }))),
          });
        }
        result = sessions;
        break;
      }

      case 'log_food': {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/food_logs`, {
          method: 'POST', headers: h,
          body: JSON.stringify({
            user_id: uid, consumed_at: new Date().toISOString(),
            meal_type: args.meal_type, grams: args.grams,
            calories: args.calories, protein: args.protein,
            carbs: args.carbs ?? 0, fat: args.fat ?? 0,
            notes: args.notes ?? null,
          }),
        });
        result = await r.json();
        break;
      }

      case 'log_water': {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/water_logs`, {
          method: 'POST', headers: h,
          body: JSON.stringify({ user_id: uid, liters: args.liters, logged_at: new Date().toISOString() }),
        });
        result = await r.json();
        break;
      }

      case 'read_fitness_summary': {
        const since = new Date(Date.now() - (args.days_back ?? 7) * 86400000).toISOString();
        const [wR, fR] = await Promise.all([
          fetch(`${SUPABASE_URL}/rest/v1/workout_sessions?user_id=eq.${uid}&started_at=gte.${since}&select=routine_name_snapshot,duration_minutes,started_at`, { headers: h }),
          fetch(`${SUPABASE_URL}/rest/v1/food_logs?user_id=eq.${uid}&consumed_at=gte.${since}&select=calories,protein,carbs,fat,meal_type`, { headers: h }),
        ]);
        result = { workouts: await wR.json(), food: await fR.json() };
        break;
      }

      case 'log_study_session': {
        const sr = await fetch(`${SUPABASE_URL}/rest/v1/aprendizaje_skills?perfil_id=eq.${uid}&nombre_habilidad=ilike.${encodeURIComponent(args.skill_name)}&select=id&limit=1`, { headers: h });
        const skills = await sr.json();
        let skillId = skills[0]?.id;
        if (!skillId) {
          const nr = await fetch(`${SUPABASE_URL}/rest/v1/aprendizaje_skills`, {
            method: 'POST', headers: h,
            body: JSON.stringify({ perfil_id: uid, nombre_habilidad: args.skill_name, nivel_skill: 1, xp_skill: 0 }),
          });
          skillId = (await nr.json())[0]?.id;
        }
        const r = await fetch(`${SUPABASE_URL}/rest/v1/aprendizaje_logs`, {
          method: 'POST', headers: h,
          body: JSON.stringify({
            skill_id: skillId, horas_estudio: args.hours,
            notas: args.notes ?? null, youtube_url: args.youtube_url ?? null,
            fecha: new Date().toISOString().split('T')[0],
          }),
        });
        result = await r.json();
        break;
      }

      case 'read_skills': {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/aprendizaje_skills?perfil_id=eq.${uid}&select=id,nombre_habilidad,nivel_skill,xp_skill`, { headers: h });
        result = await r.json();
        break;
      }

      case 'complete_milestone': {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/skill_milestones?id=eq.${args.milestone_id}&user_id=eq.${uid}`, {
          method: 'PATCH', headers: h,
          body: JSON.stringify({ completed: true, completed_at: new Date().toISOString() }),
        });
        result = await r.json();
        break;
      }

      case 'upsert_journal_entry': {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/journal_entries`, {
          method: 'POST',
          headers: { ...h, 'Prefer': 'resolution=merge-duplicates,return=representation' },
          body: JSON.stringify({ user_id: uid, entry_date: new Date().toISOString().split('T')[0], ...args }),
        });
        result = await r.json();
        break;
      }

      case 'read_journal': {
        const since = new Date(Date.now() - (args.days_back ?? 7) * 86400000).toISOString().split('T')[0];
        const r = await fetch(`${SUPABASE_URL}/rest/v1/journal_entries?user_id=eq.${uid}&entry_date=gte.${since}&order=entry_date.desc&limit=${args.limit ?? 5}&select=entry_date,mood,what_i_did,what_i_achieved,how_i_felt`, { headers: h });
        result = await r.json();
        break;
      }

      case 'log_action': {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/agent_actions_log`, {
          method: 'POST', headers: h,
          body: JSON.stringify({
            user_id: uid,
            conversation_id: $json.conversation_id ?? null,
            action_type: args.action_type,
            target_table: args.target_table,
            target_row_id: args.target_row_id ?? null,
            payload: args.payload,
            previous_state: args.previous_state ?? null,
            reasoning: args.reasoning ?? null,
            status: 'success',
            source: 'agent',
          }),
        });
        result = await r.json();
        break;
      }

      case 'get_financial_goals': {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/financial_goals?user_id=eq.${uid}&completed=eq.${args.include_completed ? 'true' : 'false'}&select=name,target_amount,current_amount,deadline,category`, { headers: h });
        result = await r.json();
        break;
      }

      default:
        result = { error: `Function desconocida: ${name}` };
    }
  } catch (err) {
    result = { error: err instanceof Error ? err.message : 'Error desconocido' };
  }

  functionResponses.push({
    functionResponse: {
      name,
      response: { content: JSON.stringify(result) },
    },
  });
}

// Gemini: agregar el turno "model" (con los functionCalls) y el turno "user" (con los results)
return [{ json: {
  ...$json,
  geminiContents: [
    ...$json.geminiContents,
    {
      role: 'model',
      parts: parts,  // parts originales de Gemini (incluye los functionCall)
    },
    {
      role: 'user',
      parts: functionResponses,
    },
  ],
} }];
```

**Conectar de vuelta al Nodo A-4** (re-llamar Gemini con `geminiContents` actualizado).

> **Límite de loop:** En n8n usá un nodo "Set" con un contador `loop_count` y un IF que corte si `loop_count >= 5`.

---

### A-7: Formatear respuesta final

```javascript
// Code Node
const candidate = $json.candidates?.[0];
const parts = candidate?.content?.parts ?? [];
const textPart = parts.find(p => p.text != null);
const responseText = textPart?.text ?? 'No pude procesar tu consulta.';

return [{ json: {
  response: responseText,
  metadata: {
    model: 'gemini-2.5-flash',
    usage: $json.usageMetadata ?? null,
    finish_reason: candidate?.finishReason ?? null,
  },
} }];
```

---

### A-8: Respond Webhook

Nodo **Respond to Webhook**:
```json
{
  "response": "={{ $json.response }}",
  "metadata": "={{ $json.metadata }}"
}
```

---

## 4. Rama B — Reporte Semanal

**Trigger:** Schedule — domingos a las 20:00  
**Destino:** Inserta en `agent_notifications` para cada usuario

### Flujo
```
[Schedule] → [B-1: Get Users] → [B-2: SplitInBatches] → [B-3: Get Week Data]
          → [B-4: Call Gemini] → [B-5: Insert Notification]
```

### B-1: Get Users (HTTP Request → Supabase)
```
GET ${SUPABASE_URL}/rest/v1/profiles?select=id
Headers: apikey: <service_key> · Authorization: Bearer <service_key>
```

### B-2: SplitInBatches — batch size: 1

### B-3: Get Week Data

```javascript
// Code Node — fetch de la última semana para este usuario
const SUPABASE_URL = $env.SUPABASE_URL;
const SK = $env.SUPABASE_SERVICE_KEY;
const h = { 'apikey': SK, 'Authorization': `Bearer ${SK}` };

const uid    = $json.id;
const since7 = new Date(Date.now() - 7 * 86400000).toISOString();
const weekStart = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
const weekEnd   = new Date().toISOString().split('T')[0];

const [txRes, gymRes, foodRes, skillsRes] = await Promise.all([
  fetch(`${SUPABASE_URL}/rest/v1/transactions?user_id=eq.${uid}&transaction_date=gte.${weekStart}&select=type,amount,amount_ars,categories(name)`, { headers: h }),
  fetch(`${SUPABASE_URL}/rest/v1/workout_sessions?user_id=eq.${uid}&started_at=gte.${since7}&select=routine_name_snapshot,duration_minutes`, { headers: h }),
  fetch(`${SUPABASE_URL}/rest/v1/food_logs?user_id=eq.${uid}&consumed_at=gte.${since7}&select=calories,protein`, { headers: h }),
  fetch(`${SUPABASE_URL}/rest/v1/aprendizaje_logs?skill_id=in.(select id from aprendizaje_skills where perfil_id=eq.${uid})&fecha=gte.${weekStart}&select=horas_estudio`, { headers: h }),
]);

const [txs, workouts, food, studyLogs] = await Promise.all([
  txRes.json(), gymRes.json(), foodRes.json(), skillsRes.json(),
]);

const ingresos = txs.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount_ars ?? t.amount ?? 0), 0);
const gastos   = txs.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount_ars ?? t.amount ?? 0), 0);
const studyHours = studyLogs.reduce((s, l) => s + (l.horas_estudio ?? 0), 0);

return [{ json: {
  user_id: uid,
  week_start: weekStart,
  week_end: weekEnd,
  weekData: {
    ingresos, gastos,
    transactions: txs,
    workouts: Array.isArray(workouts) ? workouts : [],
    food: Array.isArray(food) ? food : [],
    study_hours: studyHours,
  },
} }];
```

### B-4: Call Gemini (HTTP Request)

**Misma credencial:** `desarrollopersonal`  
**URL:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`

**Body:**
```json
{
  "systemInstruction": {
    "parts": [{
      "text": "Sos el generador de reportes semanales de Ascend AI. Respondé SIEMPRE en español rioplatense, informal pero claro. Nunca uses neutro ni mexicanismos."
    }]
  },
  "contents": [{
    "role": "user",
    "parts": [{
      "text": "={{ 'Generá el reporte semanal de Joaco con estos datos:\\n\\nFINANZAS:\\n- Ingresos: $' + $json.weekData.ingresos.toFixed(0) + ' ARS\\n- Gastos: $' + $json.weekData.gastos.toFixed(0) + ' ARS\\n- Balance: $' + ($json.weekData.ingresos - $json.weekData.gastos).toFixed(0) + ' ARS\\n\\nGYM: ' + $json.weekData.workouts.length + ' sesiones\\nHORAS DE ESTUDIO: ' + $json.weekData.study_hours.toFixed(1) + 'h\\n\\nFormateo esperado (markdown):\\n\\n## Resumen de tu semana\\n[2 oraciones de overview]\\n\\n## 💰 Finanzas\\n[bullets con números]\\n\\n## 💪 Fitness\\n[bullets]\\n\\n## 📚 Aprendizaje\\n[bullets]\\n\\n## 🎯 Para la próxima semana\\n[2-3 sugerencias concretas]\\n\\nReglas: máx 350 palabras, solo números reales del contexto.' }}"
    }]
  }],
  "generationConfig": {
    "temperature": 0.75,
    "maxOutputTokens": 1024
  }
}
```

### B-5: Insert Notification (Code Node + fetch)

```javascript
const SUPABASE_URL = $env.SUPABASE_URL;
const SK = $env.SUPABASE_SERVICE_KEY;
const h = { 'apikey': SK, 'Authorization': `Bearer ${SK}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' };

const claudeResponse = $json.candidates?.[0]?.content?.parts?.find(p => p.text)?.text ?? '';
const weekStartDate = new Date($json.week_start);
const weekLabel = weekStartDate.toLocaleDateString('es-AR', { day: '2-digit', month: 'long' });

await fetch(`${SUPABASE_URL}/rest/v1/agent_notifications`, {
  method: 'POST', headers: h,
  body: JSON.stringify({
    user_id: $json.user_id,
    type: 'weekly_report',
    title: `Resumen de la semana del ${weekLabel}`,
    body: claudeResponse,
    payload: {
      week_start: $json.week_start,
      week_end: $json.week_end,
      stats: {
        total_income:   $json.weekData.ingresos,
        total_expenses: $json.weekData.gastos,
        balance:        $json.weekData.ingresos - $json.weekData.gastos,
        workouts_count: $json.weekData.workouts.length,
        study_hours:    $json.weekData.study_hours,
      },
    },
  }),
});

return [{ json: { ok: true, user_id: $json.user_id } }];
```

---

## 5. Rama C — Sugerir Hitos

**Trigger:** `Webhook — POST /webhook/ascend-milestones`  
**Latencia esperada:** ~2-4 segundos

### Body esperado

```json
{
  "skill_name": "JavaScript",
  "skill_description": null,
  "skill_category": "Tecnología",
  "existing_milestones": ["Variables y tipos", "Funciones básicas"],
  "user_level": "nivel 2",
  "user_id": "72e108ae-..."
}
```

### C-1: Validar

```javascript
const { skill_name, user_id } = $json.body ?? $json;
if (!skill_name || !user_id) throw new Error('skill_name y user_id son requeridos');
return [{ json: $json.body ?? $json }];
```

### C-2: Call Gemini (HTTP Request)

**Misma credencial:** `desarrollopersonal`  
**URL:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`

**Body:**
```json
{
  "systemInstruction": {
    "parts": [{
      "text": "Sos un experto en diseño curricular. Respondé ÚNICAMENTE con un JSON array válido, sin texto extra ni markdown."
    }]
  },
  "contents": [{
    "role": "user",
    "parts": [{
      "text": "={{ 'El usuario quiere aprender \"' + $json.skill_name + '\" (nivel: ' + ($json.user_level ?? 'principiante') + ').' + ($json.skill_category ? ' Categoría: ' + $json.skill_category + '.' : '') + '\\nHitos que ya tiene: ' + (($json.existing_milestones ?? []).join(', ') || 'ninguno') + '.\\n\\nGenerá entre 4 y 7 hitos concretos, medibles, ordenados de menor a mayor dificultad, sin repetir los existentes.\\n\\nRespondé SOLO con este formato JSON (sin texto extra):\\n[\\n  { \"title\": \"Título corto (máx 60 chars)\", \"description\": \"Qué implica este hito en 1-2 oraciones\" },\\n  ...\\n]' }}"
    }]
  }],
  "generationConfig": {
    "temperature": 0.7,
    "maxOutputTokens": 512,
    "responseMimeType": "application/json"
  }
}
```

> `responseMimeType: "application/json"` fuerza a Gemini a devolver JSON puro, elimina el problema de markdown wrapper.

### C-3: Parsear y responder

```javascript
// Code Node
const raw = $json.candidates?.[0]?.content?.parts?.find(p => p.text)?.text?.trim() ?? '[]';
// Limpieza defensiva por si Gemini igual agrega markdown
const cleaned = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
const milestones = JSON.parse(cleaned);

if (!Array.isArray(milestones) || milestones.length === 0) {
  throw new Error('Gemini no devolvió un array válido de hitos');
}

return [{ json: { milestones } }];
```

**Respond to Webhook:**
```json
{ "milestones": "={{ $json.milestones }}" }
```

---

## 6. Las 13 Function Declarations (Gemini)

Pegá este array como constante en el Nodo A-3. Gemini usa `"parameters"` (no `"input_schema"`) y tipos en MAYÚSCULA (`STRING`, `NUMBER`, `INTEGER`, `BOOLEAN`, `OBJECT`, `ARRAY`).

```javascript
const GEMINI_FUNCTION_DECLARATIONS = [

  {
    name: "read_transactions",
    description: "Lee transacciones del usuario. Usar para responder preguntas sobre gastos, ingresos y balance.",
    parameters: {
      type: "OBJECT",
      properties: {
        date_from:     { type: "STRING",  description: "Fecha inicio ISO YYYY-MM-DD. Ej: '2026-05-01'" },
        date_to:       { type: "STRING",  description: "Fecha fin ISO YYYY-MM-DD" },
        type:          { type: "STRING",  enum: ["income","expense"], description: "Filtrar por tipo" },
        category_name: { type: "STRING",  description: "Nombre de categoría para filtrar. Ej: 'Comida'" },
        limit:         { type: "INTEGER", description: "Máximo de registros. Default: 20" },
      },
    },
  },

  {
    name: "create_transaction",
    description: "Registra un nuevo ingreso o gasto. Preguntar al usuario si faltan datos obligatorios.",
    parameters: {
      type: "OBJECT",
      required: ["type","amount","description","transaction_date"],
      properties: {
        type:             { type: "STRING",  enum: ["income","expense"] },
        amount:           { type: "NUMBER",  description: "Monto en la moneda elegida" },
        currency:         { type: "STRING",  enum: ["ARS","USD"], description: "Default: ARS" },
        description:      { type: "STRING",  description: "Descripción del gasto/ingreso" },
        transaction_date: { type: "STRING",  description: "Fecha YYYY-MM-DD. Usar hoy si no especifica" },
        category_name:    { type: "STRING",  description: "Nombre de la categoría. Omitir si no aplica" },
      },
    },
  },

  {
    name: "log_workout_session",
    description: "Registra una sesión de gym o entrenamiento completada.",
    parameters: {
      type: "OBJECT",
      required: ["routine_name_snapshot"],
      properties: {
        routine_name_snapshot: { type: "STRING",  description: "Nombre del entrenamiento. Ej: 'Pecho y tríceps'" },
        duration_minutes:      { type: "INTEGER", description: "Duración en minutos" },
        notes:                 { type: "STRING",  description: "Notas opcionales de la sesión" },
        sets: {
          type: "ARRAY",
          description: "Series opcionales del entrenamiento",
          items: {
            type: "OBJECT",
            properties: {
              exercise_name: { type: "STRING"  },
              set_number:    { type: "INTEGER" },
              reps:          { type: "INTEGER" },
              weight_kg:     { type: "NUMBER"  },
            },
          },
        },
      },
    },
  },

  {
    name: "log_food",
    description: "Registra una comida en el log de nutrición. Si el usuario no da los macros, estimarlos razonablemente y avisarle.",
    parameters: {
      type: "OBJECT",
      required: ["food_name","grams","calories","protein","meal_type"],
      properties: {
        food_name: { type: "STRING",  description: "Nombre del alimento. Ej: 'Pollo a la plancha'" },
        grams:     { type: "NUMBER",  description: "Cantidad en gramos" },
        calories:  { type: "NUMBER",  description: "Calorías totales (no por 100g)" },
        protein:   { type: "NUMBER",  description: "Proteínas en gramos" },
        carbs:     { type: "NUMBER",  description: "Carbohidratos en gramos" },
        fat:       { type: "NUMBER",  description: "Grasas en gramos" },
        meal_type: { type: "STRING",  enum: ["desayuno","almuerzo","merienda","cena","snack"] },
        notes:     { type: "STRING",  description: "Notas opcionales" },
      },
    },
  },

  {
    name: "log_water",
    description: "Agrega consumo de agua al log de hoy.",
    parameters: {
      type: "OBJECT",
      required: ["liters"],
      properties: {
        liters: { type: "NUMBER", description: "Litros consumidos. Ej: 0.5 para medio litro" },
      },
    },
  },

  {
    name: "read_fitness_summary",
    description: "Obtiene resumen de entrenamientos y nutrición de los últimos N días.",
    parameters: {
      type: "OBJECT",
      properties: {
        days_back: { type: "INTEGER", description: "Días hacia atrás a analizar. Default: 7" },
      },
    },
  },

  {
    name: "log_study_session",
    description: "Registra una sesión de estudio o práctica de una habilidad. Crea la skill si no existe.",
    parameters: {
      type: "OBJECT",
      required: ["skill_name","hours"],
      properties: {
        skill_name:  { type: "STRING", description: "Nombre de la skill. Ej: 'TypeScript'" },
        hours:       { type: "NUMBER", description: "Horas de estudio. Ej: 1.5 para hora y media" },
        notes:       { type: "STRING", description: "Qué estudió/practicó" },
        youtube_url: { type: "STRING", description: "URL del video si usó YouTube" },
      },
    },
  },

  {
    name: "read_skills",
    description: "Lee las habilidades activas del usuario con su nivel y XP.",
    parameters: {
      type: "OBJECT",
      properties: {
        include_milestones: { type: "BOOLEAN", description: "Incluir hitos de cada skill. Default: false" },
      },
    },
  },

  {
    name: "complete_milestone",
    description: "Marca un hito de aprendizaje como completado. Confirmar con el usuario antes.",
    parameters: {
      type: "OBJECT",
      required: ["milestone_id"],
      properties: {
        milestone_id: { type: "STRING", description: "UUID del hito a completar" },
      },
    },
  },

  {
    name: "upsert_journal_entry",
    description: "Crea o actualiza la entrada del diario personal de hoy. Solo actualiza los campos enviados.",
    parameters: {
      type: "OBJECT",
      properties: {
        mood:            { type: "INTEGER", description: "Estado de ánimo 1-5 (1=muy mal, 5=excelente)" },
        what_i_did:      { type: "STRING",  description: "Qué hizo hoy" },
        what_i_achieved: { type: "STRING",  description: "Qué logró" },
        how_i_felt:      { type: "STRING",  description: "Cómo se sintió" },
        gratitude:       { type: "STRING",  description: "Por qué está agradecido" },
        tomorrow_focus:  { type: "STRING",  description: "Foco para mañana" },
        free_notes:      { type: "STRING",  description: "Notas libres" },
      },
    },
  },

  {
    name: "read_journal",
    description: "Lee entradas recientes del diario personal.",
    parameters: {
      type: "OBJECT",
      properties: {
        days_back: { type: "INTEGER", description: "Días hacia atrás. Default: 7" },
        limit:     { type: "INTEGER", description: "Máximo de entradas. Default: 5" },
      },
    },
  },

  {
    name: "log_action",
    description: "Registra una acción ejecutada en agent_actions_log. Llamar SIEMPRE después de cualquier create/update/delete exitoso.",
    parameters: {
      type: "OBJECT",
      required: ["action_type","target_table","payload"],
      properties: {
        action_type:    { type: "STRING", enum: ["insert","update","delete"] },
        target_table:   { type: "STRING", description: "Nombre exacto de la tabla afectada" },
        target_row_id:  { type: "STRING", description: "UUID de la fila afectada" },
        payload:        { type: "OBJECT", description: "Datos insertados/modificados" },
        previous_state: { type: "OBJECT", description: "Estado anterior (requerido para update y delete)" },
        reasoning:      { type: "STRING", description: "Por qué se ejecutó. Ej: 'Usuario pidió registrar gasto de $2500'" },
      },
    },
  },

  {
    name: "get_financial_goals",
    description: "Lee las metas financieras activas del usuario con su progreso.",
    parameters: {
      type: "OBJECT",
      properties: {
        include_completed: { type: "BOOLEAN", description: "Incluir metas completadas. Default: false" },
      },
    },
  },

];
```

---

## 7. Variables de entorno en n8n

Ir a: **n8n UI → Settings → Environment Variables**

| Variable | Valor |
|---|---|
| `SUPABASE_URL` | `https://kepzkkgizarjgkecwscm.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Service Role Key de tu proyecto Supabase |

> La `GEMINI_API_KEY` **no** se configura como variable de entorno en n8n — ya está encapsulada en la credencial `desarrollopersonal` (Header Auth, header `x-goog-api-key`). El HTTP Request node la aplica automáticamente.

### Verificar la credencial Gemini en n8n

1. Settings → Credentials → buscar `desarrollopersonal`
2. Confirmar: Tipo = "Header Auth", Header Name = `x-goog-api-key`
3. Hacer un request de prueba a Gemini desde el nodo HTTP Request para validar (ver Sección 8)

---

## 8. Troubleshooting

### Testear con curl

**Rama A — Chat del Agente:**
```bash
curl -X POST https://jcwebhook.levelstudios.site/webhook/ascend-agent \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "72e108ae-dab8-4adb-82ff-2bd995183007",
    "conversation_id": "test-conv-001",
    "message": "Cuánto gasté esta semana?",
    "history": []
  }'
```

Respuesta esperada:
```json
{
  "response": "Esta semana gastaste $X ARS, principalmente en...",
  "metadata": { "model": "gemini-2.5-flash", "finish_reason": "STOP" }
}
```

**Rama C — Sugerir Hitos:**
```bash
curl -X POST https://jcwebhook.levelstudios.site/webhook/ascend-milestones \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "72e108ae-dab8-4adb-82ff-2bd995183007",
    "skill_name": "TypeScript",
    "user_level": "principiante",
    "existing_milestones": []
  }'
```

**Probar Gemini directo (para verificar credencial):**
```bash
curl -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent" \
  -H "x-goog-api-key: TU_GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"role":"user","parts":[{"text":"Hola, respondé en una palabra"}]}]}'
```

---

### Ver logs de ejecución en n8n

1. `https://jcwebhook.levelstudios.site` → abrir el workflow "Ascend AI Hub"
2. Pestaña **Executions** → buscar la ejecución por timestamp
3. Click en la ejecución → ver cada nodo con input/output completo
4. Nodo rojo → "Error Details" → mensaje de error exacto

---

### Si Gemini responde en español neutro/formal

Gemini tiende a ser más formal que Claude. Ya está mitigado con la línea al final del system prompt:
```
Respondé SIEMPRE en español rioplatense, informal pero claro. Nunca uses neutro ni mexicanismos.
```

Si sigue pasando, reforzar al inicio del system prompt:
```
IMPORTANTE: Hablás en vos, usás "che", "dale", "piola". Si te salís del rioplatense, estás fallando.
```

---

### Si Gemini alucina valores nutricionales

Gemini puede estimar calorías si el usuario da un alimento vago ("comí pollo").

**Solución:**
1. El system prompt ya dice "NUNCA inventés cifras"
2. En el tool result de `log_food`, agregar al response:
   ```json
   { "warning": "Valores estimados. El usuario puede editarlos en /fitness" }
   ```
3. Si el problema persiste, agregar al system prompt:
   ```
   Para log_food: si el usuario no dio los macros exactos, pedíselos antes de registrar.
   Preferí preguntar a inventar valores nutricionales.
   ```

---

### Cómo revertir una acción del agente desde la app

1. Ir a `/agente` en Ascend
2. Abrir la conversación donde se ejecutó la acción
3. Encontrar el **Action Card** (cuadro con borde de color bajo el mensaje del agente)
4. Click en **Revertir** (ícono de flecha circular)
5. La fila en DB se deshace y el card muestra "Revertido"

Endpoint: `POST /api/agent/revert` (`src/app/api/agent/revert/route.ts`)

---

### Cómo poner el agente en modo lectura

Si el agente empieza a escribir datos erróneos, desactivar las functions de escritura sin bajar el workflow:

**Opción 1 — Filtrar declarations antes de enviar a Gemini:**
```javascript
const READ_ONLY = ['read_transactions','read_fitness_summary','read_skills','read_journal','get_financial_goals'];
const functionDeclarations = GEMINI_FUNCTION_DECLARATIONS.filter(f => READ_ONLY.includes(f.name));
```

**Opción 2 — Agregar al final del system prompt:**
```
MODO LECTURA ACTIVO: No ejecutes ninguna function de escritura (create_, log_, upsert_, complete_).
Solo respondé preguntas usando los datos del contexto.
```

**Opción 3 — Desactivar el workflow:**
Toggle "Inactive" en la esquina superior derecha de n8n. Los webhooks devolverán 404.

---

### Errores comunes

| Error | Causa probable | Solución |
|---|---|---|
| `403 API key not valid` | Credencial `desarrollopersonal` mal configurada | Verificar que el header sea `x-goog-api-key` y el value sea la API key correcta |
| `Supabase 401 Unauthorized` | `SUPABASE_SERVICE_KEY` no configurada en n8n env | Settings → Environment Variables → agregar la variable |
| Gemini devuelve `finishReason: SAFETY` | Contenido del prompt o datos activaron filtros | Revisar que el contexto del usuario no tenga texto problemático |
| Loop infinito de functions | Gemini sigue llamando functions sin responder texto | Agregar contador de iteraciones máximo 5 en el IF del loop |
| `Cannot parse Gemini JSON` en Rama C | Gemini agregó markdown igual | `responseMimeType: "application/json"` ya lo previene; si falla, el `.replace()` lo limpia |
| `functionCall` presente pero sin `args` | Gemini llamó la function con args vacíos | Validar `args` con `args ?? {}` al inicio del switch |
| Webhook no responde (timeout) | Gemini tardó más de 60s | Habilitar "Respond Immediately" en el webhook trigger y usar n8n callback mode |
| `RLS: new row violates row-level security` | El service key NO está en el header `Authorization` | Verificar que los headers tengan ambos: `apikey` Y `Authorization: Bearer <key>` |
