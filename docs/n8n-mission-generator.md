# Rama D — Generador diario de misiones con IA

Instrucciones para agregar la **Rama D** al workflow existente "Ascend AI Hub" (`Gv22ceaC5raL6znO`) en n8n.

> ⚠️ No modificar las ramas A, B y C existentes. La Rama D se agrega como flujo paralelo completamente independiente, con sus propios triggers.

---

## Arquitectura de la rama

```
[Schedule 5:00 AM]  →  Code: Get active users
                         ↓
                    SplitInBatches (batch=1)
                         ↓
                    Code: Fetch user context (7 días)
                         ↓
                    HTTP Request → Gemini 2.5 Flash
                         ↓
                    Code: Parsear misiones + insertar recurrentes del día
                         ↓
                    Code: Bulk insert en daily_missions
                         ↓
                    [End]

[Webhook POST /webhook/ascend-generate-missions]
                    ↓
                    Code: Fetch context (solo el user que llama)
                         ↓  (mismo flujo desde aquí)
```

---

## Nodos a agregar

### 1. Schedule Trigger — Rama D

**Tipo:** `n8n-nodes-base.scheduleTrigger` (typeVersion 1.2)

```json
{
  "name": "D1 - Schedule 5AM",
  "type": "n8n-nodes-base.scheduleTrigger",
  "typeVersion": 1.2,
  "position": [200, 1200],
  "parameters": {
    "rule": {
      "interval": [{
        "field": "hours",
        "triggerAtHour": 5,
        "triggerAtMinute": 0
      }]
    }
  }
}
```

### 2. Webhook Trigger — Generación manual

**Tipo:** `n8n-nodes-base.webhook` (typeVersion 2)

```json
{
  "name": "D1b - Webhook Generate Missions",
  "type": "n8n-nodes-base.webhook",
  "typeVersion": 2,
  "position": [200, 1350],
  "parameters": {
    "httpMethod": "POST",
    "path": "ascend-generate-missions",
    "responseMode": "responseNode",
    "options": {}
  }
}
```

### 3. Code: Get active users (solo para Schedule)

```javascript
// D2 - Get Active Users
const SUPABASE_URL = 'https://kepzmkgizarjgkecwscm.supabase.co';
const SK = 'TU_SUPABASE_SERVICE_KEY';

const res = await this.helpers.httpRequest({
  method: 'GET',
  url: `${SUPABASE_URL}/rest/v1/auth.users?select=id&limit=1000`,
  headers: {
    'apikey': SK,
    'Authorization': `Bearer ${SK}`,
  },
  json: true,
});

// En realidad usar profiles o user_progression para obtener user_ids activos
const r2 = await this.helpers.httpRequest({
  method: 'GET',
  url: `${SUPABASE_URL}/rest/v1/user_progression?select=user_id`,
  headers: { 'apikey': SK, 'Authorization': `Bearer ${SK}` },
  json: true,
});

return (r2 || []).map(row => ({ json: { user_id: row.user_id } }));
```

> Para el webhook (generación manual), el `user_id` viene de `$json.body.user_id` — saltar este nodo y el SplitInBatches.

### 4. SplitInBatches

**Tipo:** `n8n-nodes-base.splitInBatches` (typeVersion 3)

```json
{
  "name": "D3 - Split Users",
  "parameters": { "batchSize": 1 }
}
```

### 5. Code: Fetch user context

```javascript
// D4 - Fetch Context
const SUPABASE_URL = 'https://kepzmkgizarjgkecwscm.supabase.co';
const SK = 'TU_SUPABASE_SERVICE_KEY';
const uid = $json.user_id;

const h = {
  'apikey': SK,
  'Authorization': `Bearer ${SK}`,
};
const hr = this.helpers.httpRequest.bind(this);

const today = new Date().toISOString().split('T')[0];
const since7 = new Date(Date.now() - 7 * 86400000).toISOString();
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

const [workouts, foodLogs, milestones, journal, recurring, yesterdayMissions] = await Promise.all([
  // Entrenamientos últimos 7 días
  hr({ method: 'GET', url: `${SUPABASE_URL}/rest/v1/workout_sessions?user_id=eq.${uid}&started_at=gte.${since7}&select=routine_name_snapshot,duration_minutes,started_at`, headers: h, json: true }),

  // Logs de comida últimos 3 días (promedio proteína/calorías)
  hr({ method: 'GET', url: `${SUPABASE_URL}/rest/v1/food_logs?user_id=eq.${uid}&consumed_at=gte.${new Date(Date.now()-3*86400000).toISOString()}&select=calories,protein,consumed_at`, headers: h, json: true }),

  // Hitos pendientes de skills
  hr({ method: 'GET', url: `${SUPABASE_URL}/rest/v1/skill_milestones?user_id=eq.${uid}&completed=eq.false&select=title,suggested_skills(name,category)&limit=5`, headers: h, json: true }),

  // Última entrada de diario
  hr({ method: 'GET', url: `${SUPABASE_URL}/rest/v1/journal_entries?user_id=eq.${uid}&order=entry_date.desc&limit=1&select=entry_date,mood,what_i_achieved`, headers: h, json: true }),

  // Misiones recurrentes activas para hoy
  hr({ method: 'GET', url: `${SUPABASE_URL}/rest/v1/recurring_missions?user_id=eq.${uid}&is_active=eq.true&select=*`, headers: h, json: true }),

  // Misiones de ayer (completadas vs no)
  hr({ method: 'GET', url: `${SUPABASE_URL}/rest/v1/daily_missions?user_id=eq.${uid}&mission_date=eq.${yesterday}&select=title,category,completed,difficulty`, headers: h, json: true }),
]);

// Día de la semana (1=lunes, 7=domingo)
const dow = new Date().getDay() || 7;

// Filtrar recurrentes que aplican hoy
const todayRecurring = (recurring || []).filter(m => m.days_of_week.includes(dow));

// Promedio proteína últimos 3 días
const avgProtein = foodLogs?.length > 0
  ? Math.round(foodLogs.reduce((s, l) => s + l.protein, 0) / foodLogs.length)
  : null;

const context = {
  user_id: uid,
  today,
  workouts_last_7_days: workouts || [],
  avg_protein_3d: avgProtein,
  pending_skill_milestones: milestones || [],
  last_journal_entry: journal?.[0] || null,
  yesterday_missions: yesterdayMissions || [],
  today_recurring: todayRecurring,
};

return [{ json: context }];
```

### 6. HTTP Request → Gemini

**Tipo:** `n8n-nodes-base.httpRequest` (typeVersion **4.2**)

```json
{
  "name": "D5 - Gemini Generar Misiones",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "parameters": {
    "method": "POST",
    "url": "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpHeaderAuth",
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "={{ $json.geminiPayload }}",
    "options": {}
  },
  "credentials": {
    "httpHeaderAuth": { "id": "7leavp12rnjCXjkS", "name": "desarrollopersonal" }
  }
}
```

El nodo anterior al HTTP Request debe construir `geminiPayload` en `$json`. Ver Code D5a abajo.

### 5b. Code: Build Gemini payload

```javascript
// D5a - Build Gemini Payload
const ctx = $json;

const contextSummary = `
HOY: ${ctx.today}

ENTRENAMIENTOS ÚLTIMOS 7 DÍAS:
${ctx.workouts_last_7_days.length === 0
  ? '- Sin entrenamientos registrados'
  : ctx.workouts_last_7_days.map(w => `- ${w.routine_name_snapshot} (${w.duration_minutes || '?'} min) — ${w.started_at?.split('T')[0]}`).join('\n')}

NUTRICIÓN (promedio proteína últimos 3 días): ${ctx.avg_protein_3d ?? 'sin datos'}g

HITOS PENDIENTES DE SKILLS:
${ctx.pending_skill_milestones.length === 0
  ? '- Sin hitos pendientes'
  : ctx.pending_skill_milestones.map(m => `- [${m.suggested_skills?.category || '?'}] ${m.suggested_skills?.name || '?'}: ${m.title}`).join('\n')}

ÚLTIMO DIARIO: ${ctx.last_journal_entry
  ? `${ctx.last_journal_entry.entry_date} — mood ${ctx.last_journal_entry.mood ?? '?'}/10 — "${ctx.last_journal_entry.what_i_achieved || 'sin texto'}"`
  : 'sin entradas recientes'}

MISIONES DE AYER:
${ctx.yesterday_missions.length === 0
  ? '- Sin misiones'
  : ctx.yesterday_missions.map(m => `- [${m.completed ? '✓' : '✗'}] ${m.title} (${m.category})`).join('\n')}

MISIONES RECURRENTES DE HOY (NO las incluyas en tu respuesta, ya se van a insertar):
${ctx.today_recurring.length === 0
  ? '- Ninguna'
  : ctx.today_recurring.map(m => `- ${m.title}`).join('\n')}
`.trim();

const systemPrompt = `Sos el generador de misiones diarias de Ascend para Joaco.
Joaco es un pibe argentino de 17 años emprendedor (LEVEL streetwear, agencia IA, Finca Cajal).

Tu tarea: generar entre 5 y 7 misiones para hoy basadas en su contexto.

REGLAS:
- Mezclá categorías: físico, mental, hogar, negocio
- Misiones específicas y accionables. NO "ser más productivo". SÍ "Hacé 30 sentadillas"
- Dificultad variada: 2-3 fáciles, 2-3 medias, 1-2 difíciles
- Mirá la data de los últimos 7 días para detectar patrones
- Si no entrenó cierto grupo muscular → misión de ese grupo
- Si su proteína está baja → misión de comer X gramos de proteína
- Si no escribió diario hace días → misión de diario
- Si LEVEL/agencia no tuvo movimientos → misión de negocio
- Si AYER no completó alguna misión → repetila con más prioridad
- Las misiones recurrentes activas para hoy YA se van a insertar, NO las generes vos

Respondé SOLO con un JSON array válido, sin markdown ni texto extra:
[
  {
    "title": "...",
    "description": "...",
    "category": "fisico" | "mental" | "hogar" | "negocio",
    "difficulty": "facil" | "medio" | "dificil",
    "ai_reasoning": "por qué generé esta misión"
  }
]`;

const geminiPayload = {
  systemInstruction: {
    parts: [{ text: systemPrompt }]
  },
  contents: [{
    role: 'user',
    parts: [{ text: contextSummary }]
  }],
  generationConfig: {
    temperature: 0.8,
    maxOutputTokens: 2048,
    responseMimeType: 'application/json',
  }
};

return [{ json: { ...ctx, geminiPayload } }];
```

### 7. Code: Parsear + insertar en Supabase

```javascript
// D6 - Parse & Insert Missions
const SUPABASE_URL = 'https://kepzmkgizarjgkecwscm.supabase.co';
const SK = 'TU_SUPABASE_SERVICE_KEY';
const uid = $json.user_id;
const today = $json.today;
const todayRecurring = $json.today_recurring || [];

const XP = { facil: 10, medio: 25, dificil: 50 };

const hr = this.helpers.httpRequest.bind(this);
const hPost = {
  'apikey': SK,
  'Authorization': `Bearer ${SK}`,
  'Content-Type': 'application/json',
  'Prefer': 'resolution=ignore-duplicates',
};

// Parsear respuesta de Gemini
const parts = ($json.candidates || [])[0]?.content?.parts || [];
const raw = (parts.find(p => p.text != null) || {}).text || '[]';
const cleaned = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();

let aiMissions = [];
try {
  aiMissions = JSON.parse(cleaned);
} catch(e) {
  console.log('Parse error:', e.message, '| raw:', raw.slice(0, 200));
  aiMissions = [];
}

// Construir rows para daily_missions
const rows = [];
let orderIndex = 0;

// Primero las misiones recurrentes
for (const m of todayRecurring) {
  rows.push({
    user_id: uid,
    mission_date: today,
    title: m.title,
    description: m.description || null,
    category: m.category,
    difficulty: m.difficulty,
    xp_reward: m.xp_reward,
    source: 'recurring',
    order_index: orderIndex++,
  });
}

// Luego las generadas por IA
for (const m of aiMissions) {
  if (!m.title || !m.category || !m.difficulty) continue;
  rows.push({
    user_id: uid,
    mission_date: today,
    title: m.title,
    description: m.description || null,
    category: m.category,
    difficulty: m.difficulty,
    xp_reward: XP[m.difficulty] || 25,
    source: 'ai',
    ai_reasoning: m.ai_reasoning || null,
    order_index: orderIndex++,
  });
}

if (rows.length === 0) {
  return [{ json: { user_id: uid, inserted: 0, skipped: true } }];
}

// Bulk insert (ON CONFLICT DO NOTHING gracias a la UNIQUE constraint)
const result = await hr({
  method: 'POST',
  url: `${SUPABASE_URL}/rest/v1/daily_missions`,
  headers: hPost,
  body: rows,
  json: true,
});

return [{ json: { user_id: uid, inserted: rows.length, missions: rows.map(r => r.title) } }];
```

### 8. Respond Webhook (solo para el trigger manual)

Para la rama que viene del webhook, agregar un `respondToWebhook` al final:

```json
{
  "name": "D7 - Respond Webhook",
  "type": "n8n-nodes-base.respondToWebhook",
  "typeVersion": 1.1,
  "parameters": {
    "respondWith": "json",
    "responseBody": "={{ $json }}"
  }
}
```

---

## Conexiones

```
D1 (Schedule)        → D2 (Get Users) → D3 (SplitInBatches) → D4 (Fetch Context)
D1b (Webhook)        → D4 (Fetch Context)   [bypass D2 y D3]
D4 (Fetch Context)   → D5a (Build Payload)
D5a (Build Payload)  → D5 (Gemini HTTP)
D5 (Gemini HTTP)     → D6 (Parse & Insert)
D6 (Parse & Insert)  → D7 (Respond Webhook)  [solo si viene de D1b]
```

Para el Schedule, el nodo D7 no es necesario — el flujo simplemente termina en D6.

---

## Variable de entorno

Agregar en `.env.local` (y en Vercel):

```env
NEXT_PUBLIC_N8N_WEBHOOK_GENERATE_MISSIONS=https://jcwebhook.levelstudios.site/webhook/ascend-generate-missions
```

Esto permite que el botón "Generar más con IA" del Dashboard haga:

```typescript
await fetch(process.env.NEXT_PUBLIC_N8N_WEBHOOK_GENERATE_MISSIONS!, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ user_id: userId }),
})
```

---

## Test con curl

```bash
# Probar generación manual para tu usuario
curl -X POST https://jcwebhook.levelstudios.site/webhook/ascend-generate-missions \
  -H "Content-Type: application/json" \
  -d '{"user_id": "72e108ae-dab8-4adb-82ff-2bd995183007"}'
```

---

## Checklist de implementación

- [ ] Correr migration `00018_daily_missions.sql` en Supabase
- [ ] Agregar Schedule node D1 al workflow `Gv22ceaC5raL6znO`
- [ ] Agregar Webhook node D1b al mismo workflow
- [ ] Agregar Code nodes D2, D3, D4, D5a
- [ ] Agregar HTTP Request node D5 (usa credencial `desarrollopersonal`, typeVersion 4.2)
- [ ] Agregar Code node D6
- [ ] Agregar respondToWebhook D7
- [ ] Conectar los nodos según el diagrama
- [ ] Activar el workflow
- [ ] Test con curl
- [ ] Agregar `NEXT_PUBLIC_N8N_WEBHOOK_GENERATE_MISSIONS` en Vercel env vars
