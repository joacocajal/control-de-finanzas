import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { streamGeminiSSE } from '@/services/ai.service'
import { z } from 'zod'

const attachmentSchema = z.object({
  type: z.enum(['image', 'audio']),
  mimeType: z.string().max(100),
  data: z.string().max(20_000_000), // ~15 MB base64
})

const geminiPartSchema = z.object({
  text: z.string().optional(),
  inline_data: z.object({ mime_type: z.string(), data: z.string() }).optional(),
})

const geminiContentSchema = z.object({
  role: z.enum(['user', 'model']),
  parts: z.array(geminiPartSchema),
})

const bodySchema = z.object({
  message: z.string().max(4000).default(''),
  attachments: z.array(attachmentSchema).max(5).default([]),
  context: z.object({
    balance: z.number(),
    totalIncome: z.number(),
    totalExpenses: z.number(),
    topCategories: z.array(
      z.object({ name: z.string(), amount: z.number(), percentage: z.number() })
    ),
  }),
  history: z.array(geminiContentSchema).max(40).default([]),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { message, attachments, context, history } = parsed.data

  try {
    const stream = await streamGeminiSSE(message, attachments, context, history)
    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (err) {
    console.error('Gemini error:', err)
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
