# Feature: Asistente IA Multimodal

## Descripción
Coach de Productividad y Finanzas Personales potenciado por Gemini. Soporta texto, imágenes y audio. Se accede desde el botón flotante del dashboard o desde la ruta `/chat`.

## Stack Técnico
- **Modelo:** Gemini 2.5 Flash (env `GOOGLE_MODEL`) vía REST con SSE
- **Streaming:** `?alt=sse` → parse line-by-line en server, stream plain text al cliente
- **Audio:** Web MediaRecorder API → Blob → Base64 → Gemini `inline_data`
- **Imágenes:** `<input type="file">` → FileReader → Base64 → Gemini `inline_data`
- **Historial:** `GeminiContent[]` mantenido en `useGeminiChat` hook — multi-turn real

## Arquitectura de Componentes

```
AIAssistant (mode="floating" | "embedded")
├── useGeminiChat(context)          ← estado del chat, streaming, historial
│   └── fetch /api/ai/chat          ← Route Handler
│       └── ai.service.ts           ← buildSystemPrompt + streamGeminiSSE
├── useAudioRecorder()              ← MediaRecorder API
└── UI
    ├── Header (close, clear)
    ├── MessageList (scroll)
    │   └── MessageBubble (markdown, image/audio attachment preview)
    ├── AttachmentPreview (imagen o audio pending de enviar)
    └── InputBar
        ├── ImageButton → <input type="file" hidden>
        ├── MicButton → start/stop recording
        ├── TextInput
        └── SendButton
```

## Flujo MediaRecorder (Audio)

```
1. Usuario presiona 🎤
2. navigator.mediaDevices.getUserMedia({ audio: true })
3. new MediaRecorder(stream, { mimeType: 'audio/webm' })
4. recorder.start(100) — chunks cada 100ms
5. recorder.ondataavailable → push chunks
6. Usuario presiona ⏹
7. recorder.stop() → onstop → Blob de audio
8. Usuario presiona ➤ enviar
9. FileReader.readAsDataURL(blob) → base64
10. POST /api/ai/chat con attachment: { type:'audio', mimeType:'audio/webm', data: base64 }
11. Gemini recibe inline_data y procesa el audio
```

## Flujo Imagen (Screen Time / Captura)

```
1. Usuario presiona 📎
2. <input type="file" accept="image/*"> → File
3. FileReader.readAsDataURL(file) → base64
4. Preview en la barra de input
5. Al enviar → attachment: { type:'image', mimeType: file.type, data: base64 }
6. Gemini recibe inline_data
7. Si es captura de Tiempo en Pantalla → system prompt activa análisis específico
```

## System Prompt

El system prompt actúa como coach implacable con dos modos:
- **Modo financiero:** analiza datos del dashboard (balance, gastos, categorías)
- **Modo Screen Time:** cuando detecta imagen de tiempo en pantalla, extrae apps, calcula tiempo perdido y genera plan de 7 días

## API Routes

### POST /api/ai/chat
**Auth:** Supabase session cookie

```typescript
{
  message: string                  // texto (puede ser vacío si hay adjunto)
  attachments?: [{
    type: 'image' | 'audio'
    mimeType: string               // 'image/jpeg', 'audio/webm', etc.
    data: string                   // base64 sin prefijo data:
  }]
  context: AIChatContext           // datos financieros del usuario
  history?: GeminiContent[]        // historial multi-turn (máx 40)
}
```

**Response:** `text/plain` stream — el cliente concatena chunks.

### GET /api/summary
**Auth:** `Authorization: Bearer <SUMMARY_API_KEY>`

**Requiere:** `SUPABASE_SERVICE_ROLE_KEY` en .env.local para bypassear RLS.

**Response:**
```json
{
  "balance": 1500,
  "totalIncome": 5000,
  "totalExpenses": 3500,
  "topCategories": [{ "name": "Comida", "amount": 1200, "percentage": 34 }],
  "period": { "start": "2026-05-01", "end": "2026-05-31" },
  "transactionCount": 23
}
```

## Hooks

### `useAudioRecorder`
Encapsula toda la lógica de MediaRecorder. Expone:
- `isRecording`, `audioBlob`, `audioDuration`, `error`
- `startRecording()`, `stopRecording()`, `clearRecording()`

### `useGeminiChat(context)`
Encapsula estado del chat y comunicación con el servidor. Expone:
- `messages: UIMessage[]`
- `streaming: boolean`
- `sendMessage(text, attachments?)`
- `clearMessages()`

## Responsive / Mobile
- Modo floating: panel deslizable 420px (desktop) / full-screen (mobile)
- Modo embedded: ocupa el contenedor padre completamente
- Toggle button: oculto en mobile cuando panel está abierto

## Consideraciones de Seguridad
- Las imágenes y audios se procesan solo server-side (API route autenticada)
- Base64 nunca se persiste en base de datos
- Auth check en cada request a `/api/ai/chat`
