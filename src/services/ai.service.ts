import type { AIChatContext } from '@/types/database.types'

function buildSystemPrompt(context: AIChatContext): string {
  const categories = context.topCategories
    .map((c) => `${c.name}: $${c.amount.toLocaleString('es-AR')} (${c.percentage}%)`)
    .join(', ')

  return `Sos un asistente financiero personal amigable. El usuario tiene estos datos financieros este mes:
- Balance total: $${context.balance.toLocaleString('es-AR')}
- Ingresos del mes: $${context.totalIncome.toLocaleString('es-AR')}
- Gastos del mes: $${context.totalExpenses.toLocaleString('es-AR')}
- Distribución de gastos: ${categories || 'Sin gastos registrados'}

Respondé en español rioplatense (Argentina). Sé concreto, práctico y amigable. Usá los datos reales del usuario para personalizar tus consejos. Si no hay datos suficientes, pedile que registre más transacciones.`
}

export async function streamGeminiResponse(
  userMessage: string,
  context: AIChatContext
): Promise<ReadableStream<Uint8Array>> {
  const apiKey = process.env.GEMINI_API_KEY
  const model = process.env.GOOGLE_MODEL || 'gemini-2.5-flash'

  if (!apiKey) throw new Error('GEMINI_API_KEY no configurada')

  const systemPrompt = buildSystemPrompt(context)

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: systemPrompt + '\n\nUsuario: ' + userMessage }] },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
    }
  )

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Error Gemini API: ${err}`)
  }

  // Transform the Gemini stream into a plain text stream
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()

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
            const trimmed = line.trim()
            if (!trimmed || trimmed === '[' || trimmed === ']' || trimmed === ',') continue
            const clean = trimmed.startsWith(',') ? trimmed.slice(1) : trimmed

            try {
              const parsed = JSON.parse(clean) as {
                candidates?: Array<{
                  content?: { parts?: Array<{ text?: string }> }
                }>
              }
              const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
              if (text) controller.enqueue(new TextEncoder().encode(text))
            } catch {
              // incomplete chunk — continue
            }
          }
        }
      } finally {
        controller.close()
      }
    },
  })
}
