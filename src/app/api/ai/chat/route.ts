import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { streamGeminiResponse } from '@/services/ai.service'
import type { AIChatContext } from '@/types/database.types'
import { z } from 'zod'

const bodySchema = z.object({
  message: z.string().min(1).max(1000),
  context: z.object({
    balance: z.number(),
    totalIncome: z.number(),
    totalExpenses: z.number(),
    topCategories: z.array(
      z.object({
        name: z.string(),
        amount: z.number(),
        percentage: z.number(),
      })
    ),
  }),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 })
  }

  const { message, context } = parsed.data as { message: string; context: AIChatContext }

  try {
    const stream = await streamGeminiResponse(message, context)
    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (err) {
    console.error('Error Gemini:', err)
    return NextResponse.json({ error: 'Error del asistente de IA' }, { status: 500 })
  }
}
