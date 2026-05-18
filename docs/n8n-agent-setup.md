# Ascend AI — Setup de Workflows n8n

> Guía para armar los 3 workflows del agente IA de Ascend en tu instancia n8n.
> URL n8n: https://jcbots.levelstudios.site

---

## Variables de entorno necesarias (ya en `.env.example`)

```
NEXT_PUBLIC_N8N_WEBHOOK_AGENT=https://jcbots.levelstudios.site/webhook/ascend-agent
NEXT_PUBLIC_N8N_WEBHOOK_MILESTONES=https://jcbots.levelstudios.site/webhook/ascend-milestones
```

---

## Workflow 1 — "Ascend Agent Chat"

**Trigger:** Webhook `POST /webhook/ascend-agent`

### Body esperado
```json
{
  "user_id": "uuid",
  "conversation_id": "uuid",
  "message": "string",
  "history": [
    { "role": "user",      "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

### Nodo 1 — Validar payload
```javascript
// Code Node
const { user_id, message, conversation_id, history } = $json.body;
if (!user_id || !message) throw new Error('Payload inválido');
return [{ json: { user_id, message, conversation_id, history: history ?? [] } }];
```

### Nodo 2 — Leer contexto del usuario (Postgres/Supabase)
Conectar con **HTTP Request** a la Supabase REST API usando el Service Role Key.  
Hacer 6 requests paralelos (usar Split / Merge si necesitás, o un solo Code node con fetch):

```javascript
// Code Node — fetch paralelo de contexto
const SUPABASE_URL = 'https://tu-proyecto.supabase.co';
const SERVICE_KEY = 'tu-service-role-key';

const headers = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
};

const userId = $json.user_id;
const since30d = new Date(Date.now() - 30 * 86400000).toISOString();
const since7d  = new Date(Date.now() -  7 * 86400000).toISOString();

const [txRes, gymRes, foodRes, skillsRes, milestonesRes, diarioRes] = await Promise.all([
  fetch(`${SUPABASE_URL}/rest/v1/transactions?user_id=eq.${userId}&order=transaction_date.desc&limit=30&select=type,amount,amount_ars,transaction_date,categories(name)`, { headers }),
  fetch(`${SUPABASE_URL}/rest/v1/workout_sessions?user_id=eq.${userId}&started_at=gte.${since7d}&order=started_at.desc&limit=7&select=routine_name_snapshot,duration_minutes,started_at`, { headers }),
  fetch(`${SUPABASE_URL}/rest/v1/food_logs?user_id=eq.${userId}&consumed_at=gte.${since7d}&order=consumed_at.desc&limit=7&select=food_name,calories,protein,consumed_at`, { headers }),
  fetch(`${SUPABASE_URL}/rest/v1/aprendizaje_skills?perfil_id=eq.${userId}&select=nombre_habilidad,nivel_skill,total_hours_practiced`, { headers }),
  fetch(`${SUPABASE_URL}/rest/v1/skill_milestones?user_id=eq.${userId}&completed=eq.false&select=title,skill_id&limit=10`, { headers }),
  fetch(`${SUPABASE_URL}/rest/v1/journal_entries?user_id=eq.${userId}&order=entry_date.desc&limit=1&select=entry_date,mood,what_i_did,what_i_achieved,how_i_felt`, { headers }),
]);

const [transactions, workouts, food, skills, milestones, diario] = await Promise.all([
  txRes.json(), gymRes.json(), foodRes.json(),
  skillsRes.json(), milestonesRes.json(), diarioRes.json(),
]);

return [{ json: {
  user_id: userId,
  message: $json.message,
  conversation_id: $json.conversation_id,
  history: $json.history,
  context: { transactions, workouts, food, skills, milestones, diario: diario[0] ?? null },
} }];
```

### Nodo 3 — Armar system prompt
```javascript
// Code Node
const { context, message, history } = $json;
const { transactions, workouts, food, skills, milestones, diario } = context;

const ingresos = transactions.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount_ars ?? t.amount ?? 0), 0);
const gastos   = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount_ars ?? t.amount ?? 0), 0);

const systemPrompt = `Sos Ascend AI, el asistente personal de Joaco.
Tu rol es ayudarlo a mejorar en todas las áreas de su vida: finanzas, fitness, aprendizaje, bienestar.

CONTEXTO ACTUAL DE JOACO:
== Finanzas (últimas 30 transacciones) ==
- Ingresos: $${ingresos.toFixed(0)} ARS
- Gastos: $${gastos.toFixed(0)} ARS
- Balance: $${(ingresos - gastos).toFixed(0)} ARS

== Fitness (últimos 7 días) ==
${workouts.map(w => `- ${w.routine_name_snapshot} — ${w.duration_minutes}min (${new Date(w.started_at).toLocaleDateString('es-AR')})`).join('\n') || '- Sin sesiones registradas'}

== Nutrición (últimos 7 días) ==
${food.slice(0, 5).map(f => `- ${f.food_name}: ${f.calories}kcal, ${f.protein}g prot`).join('\n') || '- Sin registros'}

== Skills activas ==
${skills.map(s => `- ${s.nombre_habilidad} (Nivel ${s.nivel_skill}, ${(s.total_hours_practiced ?? 0).toFixed(1)}h practicadas)`).join('\n') || '- Sin skills'}

== Hitos pendientes ==
${milestones.slice(0, 5).map(m => `- ${m.title}`).join('\n') || '- Sin hitos pendientes'}

== Último diario ==
${diario ? `Fecha: ${diario.entry_date}, Mood: ${diario.mood}/5
¿Qué hice?: ${diario.what_i_did?.slice(0, 100) ?? '—'}
¿Cómo me sentí?: ${diario.how_i_felt?.slice(0, 100) ?? '—'}` : '- Sin entrada reciente'}

INSTRUCCIONES:
- Hablá en español rioplatense, de forma directa y sin chamuyo.
- Basate SIEMPRE en los datos reales del contexto, nunca inventes cifras.
- Sé específico: si Joaco pregunta cuánto gastó, decile el número exacto.
- Si no tenés datos para responder algo, decilo claramente.
- Máximo 3-4 párrafos, preferí bullets cuando tenés varios puntos.
- No uses asteriscos para énfasis, el texto se renderiza en markdown.`;

return [{ json: {
  systemPrompt,
  message,
  history,
  conversation_id: $json.conversation_id,
} }];
```

### Nodo 4 — Llamar a Claude (HTTP Request)
```
Method: POST
URL: https://api.anthropic.com/v1/messages
Headers:
  x-api-key: {{ $credentials.anthropicApiKey }}
  anthropic-version: 2023-06-01
  content-type: application/json

Body (JSON):
{
  "model": "claude-opus-4-7",
  "max_tokens": 1024,
  "system": "{{ $json.systemPrompt }}",
  "messages": [
    ...{{ $json.history.map(m => ({ role: m.role, content: m.content })) }},
    { "role": "user", "content": "{{ $json.message }}" }
  ]
}
```

> Alternativa: usar el nodo **Anthropic** (si lo tenés instalado en n8n) en lugar de HTTP Request.

### Nodo 5 — Responder webhook
```javascript
// Code Node
const claudeResponse = $json.content[0].text;
return [{ json: {
  response: claudeResponse,
  metadata: {
    model: $json.model,
    usage: $json.usage,
  }
} }];
```

---

## Workflow 2 — "Reporte Semanal"

**Trigger:** Schedule — domingos 20:00

### Flujo

```
Schedule → Get All Users → Loop → Get Week Data → Generate Report → Insert Notification
```

### Nodo 1 — Get All Users (HTTP Request a Supabase)
```
GET ${SUPABASE_URL}/rest/v1/profiles?select=id
Headers: apikey + Authorization con Service Role Key
```

### Nodo 2 — Loop over users (SplitInBatches, batch=1)

### Nodo 3 — Get Week Data (mismo patrón que Workflow 1 Nodo 2, filtrar por última semana)

### Nodo 4 — Generar resumen con Claude
```javascript
// Prompt para el reporte semanal
const prompt = `
Generá un reporte semanal en español rioplatense para Joaco.
Datos de la semana:
- Finanzas: ${JSON.stringify(weekData.transactions)}
- Gym: ${JSON.stringify(weekData.workouts)}  
- Comida: ${JSON.stringify(weekData.food)}
- Skills: ${JSON.stringify(weekData.skills)}

Formato:
## Resumen de tu semana
[2-3 frases de overview]

## 💰 Finanzas
[bullets con lo más relevante]

## 💪 Fitness  
[bullets]

## 📚 Aprendizaje
[bullets]

## 🎯 Para la próxima semana
[1-3 sugerencias concretas]

Sé directo, usá números reales, máximo 300 palabras.
`;
```

### Nodo 5 — Insertar en agent_notifications
```javascript
// HTTP Request POST a Supabase
{
  user_id: userId,
  type: "weekly_report",
  title: "Resumen de tu semana",
  body: claudeResponse,
  payload: { week_start: "...", week_end: "...", stats: {...} }
}
```

---

## Workflow 3 — "Sugerir Hitos"

**Trigger:** Webhook `POST /webhook/ascend-milestones`

### Body esperado
```json
{
  "skill_name": "JavaScript",
  "skill_description": null,
  "skill_category": "Tecnología",
  "existing_milestones": ["Variables y tipos", "Funciones"],
  "user_level": "nivel 3",
  "user_id": "uuid"
}
```

### Nodo 1 — Validar
```javascript
const { skill_name, existing_milestones, user_id } = $json.body;
if (!skill_name || !user_id) throw new Error('Payload inválido');
return [{ json: $json.body }];
```

### Nodo 2 — Llamar a Claude
**Prompt exacto:**
```javascript
const existingList = ($json.existing_milestones ?? []).join(', ') || 'ninguno';

const prompt = `Sos un experto en aprendizaje y desarrollo de habilidades.
El usuario quiere aprender "${$json.skill_name}" (nivel actual: ${$json.user_level ?? 'principiante'}).
${$json.skill_category ? `Categoría: ${$json.skill_category}.` : ''}
Hitos que ya tiene: ${existingList}.

Generá entre 4 y 7 hitos de aprendizaje concretos y progresivos que NO repitan los existentes.
Respondé ÚNICAMENTE con un array JSON válido, sin texto extra:

[
  { "title": "Hito corto y claro", "description": "Descripción de 1-2 oraciones de qué implica este hito" },
  ...
]

Los hitos deben ser específicos, medibles y ordenados de menor a mayor dificultad.`;
```

### Nodo 3 — Parsear JSON de Claude
```javascript
// Code Node
const raw = $json.content[0].text.trim();
// Limpiar si Claude envuelve en ```json
const cleaned = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '');
const milestones = JSON.parse(cleaned);

if (!Array.isArray(milestones)) throw new Error('Claude no devolvió un array');

return [{ json: { milestones } }];
```

### Nodo 4 — Respond Webhook
```json
{ "milestones": "{{ $json.milestones }}" }
```

---

## Tips de configuración

1. **Credenciales Anthropic**: crear en n8n → Settings → Credentials → Anthropic. Pegar la API key.
2. **Service Role Key de Supabase**: usarla solo en el backend de n8n, nunca exponer al cliente.
3. **Webhook URLs**: copiar las URLs de n8n y pegarlas en tu `.env.local`.
4. **Probar Workflow 1**: usar Postman o el panel de AgentChat con el webhook configurado.
5. **Error handling**: agregar nodos de Error Trigger en cada workflow para loguear fallas en una hoja de Sheets o Telegram.

---

## Checklist de activación

```
□ Workflow 1 activo con URL /webhook/ascend-agent
□ Workflow 2 activo con cron domingos 20:00
□ Workflow 3 activo con URL /webhook/ascend-milestones
□ Credenciales Anthropic configuradas
□ Service Role Key de Supabase en variables de n8n
□ NEXT_PUBLIC_N8N_WEBHOOK_AGENT en .env.local
□ NEXT_PUBLIC_N8N_WEBHOOK_MILESTONES en .env.local
□ Migraciones 00013–00016 corridas en Supabase
```
