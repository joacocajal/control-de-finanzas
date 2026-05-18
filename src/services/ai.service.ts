import type { AIChatContext } from '@/types/database.types'
import type { GeminiContent, GeminiPart } from '@/types/gemini.types'

function buildSystemPrompt(context: AIChatContext): string {
  const categories = context.topCategories
    .map((c) => `  • ${c.name}: $${c.amount.toLocaleString('es-AR')} (${c.percentage.toFixed(1)}%)`)
    .join('\n')

  return `Sos AXON, un coach implacable de Productividad y Finanzas Personales. Tu misión es ayudar al usuario a tomar control total de su tiempo y dinero.

═══ DATOS FINANCIEROS DEL MES ACTUAL ═══
• Balance: $${context.balance.toLocaleString('es-AR')}
• Ingresos: $${context.totalIncome.toLocaleString('es-AR')}
• Gastos: $${context.totalExpenses.toLocaleString('es-AR')}
• Top categorías de gasto:
${categories || '  (sin gastos registrados aún)'}

═══ MODOS DE OPERACIÓN ═══
1. FINANCIERO: Analizá los datos reales del usuario. Sé directo, no des respuestas vagas. Cuantificá siempre (%, $, días). Identificá fugas de dinero y acciones concretas.
2. SCREEN TIME / TIEMPO EN PANTALLA: Si el usuario manda una imagen de su reporte de Tiempo en Pantalla (iOS/Android), hacé lo siguiente:
   - Extractá cada app y su tiempo exacto
   - Clasificá cada app en PRODUCTIVA / NEUTRAL / LADRONA DE TIEMPO
   - Calculá el tiempo perdido total en horas/semana
   - Generá un plan de 7 días con acciones específicas para recuperar foco
   - Sé directo: si alguien usa TikTok 4hs/día, decíselo claramente
3. AUDIO: Si recibís un audio, procesá el contenido hablado y respondé directamente a lo que dice.
4. IMAGEN GENERAL: Si recibís otra imagen, analizála en contexto financiero/productividad.

═══ REGLAS INQUEBRANTABLES ═══
- Español rioplatense argentino siempre (vos, che, boludo si la confianza lo permite)
- Nunca decir "podría" o "quizás" — decir qué HACER exactamente
- Usar datos reales del usuario, nunca ejemplos genéricos
- Bullets • y **negrita** para estructurar las respuestas
- Si los datos son escasos, decir qué registrar y por qué importa
- Máximo 3-4 puntos clave por respuesta — la brevedad es respeto al tiempo del usuario`
}

interface AttachmentInput {
  type: 'image' | 'audio'
  mimeType: string
  data: string
}

export async function streamGeminiSSE(
  message: string,
  attachments: AttachmentInput[],
  context: AIChatContext,
  history: GeminiContent[]
): Promise<ReadableStream<Uint8Array>> {
  const apiKey = process.env.GEMINI_API_KEY
  const model = process.env.GOOGLE_MODEL || 'gemini-2.5-flash'
  if (!apiKey) throw new Error('GEMINI_API_KEY no configurada')

  const userParts: GeminiPart[] = [
    ...(message.trim() ? [{ text: message }] : []),
    ...attachments.map((a) => ({
      inline_data: { mime_type: a.mimeType, data: a.data },
    })),
  ]
  if (userParts.length === 0) userParts.push({ text: '(mensaje vacío)' })

  const contents: GeminiContent[] = [
    ...history,
    { role: 'user', parts: userParts },
  ]

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: buildSystemPrompt(context) }] },
        contents,
        generationConfig: {
          temperature: 0.75,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      }),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini API: ${err}`)
  }

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let buffer = ''
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const payload = line.slice(6).trim()
            if (payload === '[DONE]') continue
            try {
              const parsed = JSON.parse(payload) as {
                candidates?: Array<{
                  content?: { parts?: Array<{ text?: string }> }
                }>
              }
              const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
              if (text) controller.enqueue(encoder.encode(text))
            } catch {
              // incomplete JSON chunk — skip
            }
          }
        }
      } finally {
        controller.close()
      }
    },
  })
}
