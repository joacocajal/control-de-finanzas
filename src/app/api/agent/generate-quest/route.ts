// POST /api/agent/generate-quest
// Genera una misión diaria personalizada usando Gemini como Game Master.
// Auth: Bearer token (CRON_SECRET env var).
// Body: { user_id: string }

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { MisionDiaria } from '@/types/database.types'

// ─── Tipos internos ───────────────────────────────────────────

interface QuestJSON {
  descripcion: string
  dificultad: 'facil' | 'media' | 'dificil'
  xp_recompensa: number
  xp_penalizacion: number
}

interface ContextoUsuario {
  finanzas: {
    balance: number
    gastosSemana: number
    topCategorias: string
    hayPresupuestoExcedido: boolean
  }
  gym: {
    entrenoAyer: boolean
    ultimoEjercicio: string
    diasSinEntrenar: number
  }
  aprendizaje: {
    horasUltimos2Dias: number
    ultimaHabilidad: string
  }
  perfil: {
    nivel: number
    xp: number
    racha: number
  }
}

// ─── Fetch de contexto del usuario ───────────────────────────

async function fetchContextoUsuario(userId: string): Promise<ContextoUsuario> {
  const supabase = createAdminClient()
  const hoy = new Date().toISOString().split('T')[0]
  const hace2Dias = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString().split('T')[0]
  const inicioSemana = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [perfilRes, transaccionesRes, seriesRes, aprendizajeRes, presupuestosRes] = await Promise.all([
    // Perfil gamificado
    supabase
      .from('profiles')
      .select('nivel_global, xp_global, racha_dias')
      .eq('id', userId)
      .single(),

    // Transacciones de la semana
    supabase
      .from('transactions')
      .select('amount, type, categories(name)')
      .eq('user_id', userId)
      .gte('transaction_date', inicioSemana)
      .order('transaction_date', { ascending: false }),

    // Series de gym últimas 48h (via join)
    supabase
      .from('gym_series_logs')
      .select(`
        peso_kg, repeticiones, completado, fecha,
        gym_ejercicios!inner (
          nombre_ejercicio,
          gym_rutinas!inner ( perfil_id )
        )
      `)
      .eq('gym_ejercicios.gym_rutinas.perfil_id', userId)
      .gte('fecha', hace2Dias),

    // Logs de aprendizaje últimas 48h
    supabase
      .from('aprendizaje_logs')
      .select(`
        horas_estudio, fecha,
        aprendizaje_skills!inner ( nombre_habilidad, perfil_id )
      `)
      .eq('aprendizaje_skills.perfil_id', userId)
      .gte('fecha', hace2Dias),

    // Presupuestos activos
    supabase
      .from('finanzas_presupuestos')
      .select('monto_limite, categoria_gasto, categories(name)')
      .eq('perfil_id', userId)
      .eq('periodo', 'mensual')
      .lte('fecha_inicio', hoy)
      .or(`fecha_fin.is.null,fecha_fin.gte.${hoy}`),
  ])

  // ── Finanzas ──
  const txs = transaccionesRes.data ?? []
  const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expenses = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  const categoriaMap: Record<string, number> = {}
  for (const t of txs.filter(t => t.type === 'expense')) {
    const nombre = (t.categories as unknown as { name: string } | null)?.name ?? 'Otro'
    categoriaMap[nombre] = (categoriaMap[nombre] ?? 0) + t.amount
  }
  const topCategorias = Object.entries(categoriaMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([n, v]) => `${n}: $${v.toFixed(0)}`)
    .join(', ')

  // Ver si algún presupuesto está excedido
  const presupuestos = presupuestosRes.data ?? []
  let hayPresupuestoExcedido = false
  for (const p of presupuestos) {
    const gastadoCategoria = txs
      .filter(t => t.type === 'expense' && (t as { category_id?: string }).category_id === p.categoria_gasto)
      .reduce((s, t) => s + t.amount, 0)
    if (gastadoCategoria > p.monto_limite) { hayPresupuestoExcedido = true; break }
  }

  // ── Gym ──
  const series = seriesRes.data ?? []
  const entrenoHoy = series.some(s => s.fecha === hoy)
  const entrenoAyer = series.some(s => s.fecha === hace2Dias) || entrenoHoy
  const ultimaFechaGym = series.length > 0 ? series.sort((a, b) => b.fecha.localeCompare(a.fecha))[0].fecha : null
  const diasSinEntrenar = ultimaFechaGym
    ? Math.floor((Date.now() - new Date(ultimaFechaGym).getTime()) / (1000 * 60 * 60 * 24))
    : 99
  const ultimoEjercicio = series.length > 0
    ? ((series[0] as { gym_ejercicios?: { nombre_ejercicio?: string } }).gym_ejercicios?.nombre_ejercicio ?? 'desconocido')
    : 'ninguno'

  // ── Aprendizaje ──
  const logsAprendizaje = aprendizajeRes.data ?? []
  const horasUltimos2Dias = logsAprendizaje.reduce((s, l) => s + (l.horas_estudio as number), 0)
  const ultimaHabilidad = logsAprendizaje.length > 0
    ? ((logsAprendizaje[0] as { aprendizaje_skills?: { nombre_habilidad?: string } }).aprendizaje_skills?.nombre_habilidad ?? 'desconocida')
    : 'ninguna'

  // ── Perfil ──
  const perfil = perfilRes.data ?? { nivel_global: 1, xp_global: 0, racha_dias: 0 }

  return {
    finanzas: {
      balance: income - expenses,
      gastosSemana: expenses,
      topCategorias: topCategorias || 'sin gastos registrados',
      hayPresupuestoExcedido,
    },
    gym: { entrenoAyer, ultimoEjercicio, diasSinEntrenar },
    aprendizaje: { horasUltimos2Dias, ultimaHabilidad },
    perfil: { nivel: perfil.nivel_global, xp: perfil.xp_global, racha: perfil.racha_dias },
  }
}

// ─── Game Master prompt ───────────────────────────────────────

function buildGameMasterPrompt(ctx: ContextoUsuario): string {
  return `Sos el Game Master de un RPG de desarrollo personal para Joaco, un pibe de 17 años de Argentina.
Tu trabajo es generar UNA misión diaria ultra personalizada basándote en sus datos reales.

═══ DATOS REALES DE JOACO (últimas 48-72h) ═══

FINANZAS:
• Balance de la semana: $${ctx.finanzas.balance.toFixed(0)} ARS
• Gastos de la semana: $${ctx.finanzas.gastosSemana.toFixed(0)} ARS
• Top categorías de gasto: ${ctx.finanzas.topCategorias}
• ¿Excedió algún presupuesto?: ${ctx.finanzas.hayPresupuestoExcedido ? 'SÍ ⚠️' : 'No'}

GYM / FITNESS:
• ¿Entrenó en las últimas 48h?: ${ctx.gym.entrenoAyer ? 'Sí ✓' : 'No ✗'}
• Días sin entrenar: ${ctx.gym.diasSinEntrenar === 99 ? 'Sin historial' : ctx.gym.diasSinEntrenar}
• Último ejercicio registrado: ${ctx.gym.ultimoEjercicio}

APRENDIZAJE:
• Horas de estudio en últimas 48h: ${ctx.aprendizaje.horasUltimos2Dias.toFixed(1)}h
• Última habilidad estudiada: ${ctx.aprendizaje.ultimaHabilidad}

PERFIL RPG:
• Nivel global: ${ctx.perfil.nivel} | XP: ${ctx.perfil.xp}
• Racha actual: ${ctx.perfil.racha} días

═══ REGLAS DEL GAME MASTER ═══
1. Si excedió presupuesto → misión financiera obligatoria (revisar gastos, no comprar X cosa)
2. Si no entrenó hace 2+ días → misión de gym (algo concreto y realizable hoy)
3. Si estudió < 0.5h en 48h → misión de aprendizaje
4. Sino → misión de la categoría donde le va peor
5. La misión debe ser MUY específica (no "hacer ejercicio", sino "hacer 3 series de 10 sentadillas")
6. Dificultad: fácil = 10-20 XP, media = 25-50 XP, difícil = 50-100 XP
7. xp_penalizacion siempre = xp_recompensa / 2 (redondeado)
8. Tono: directo, motivador, rioplatense (vos, che)

Devolvé SOLO el JSON de la misión. Nada más.`
}

// ─── Llamada a Gemini (non-streaming, JSON mode) ──────────────

async function callGeminiJSON(prompt: string, userDataStr: string): Promise<QuestJSON> {
  const apiKey = process.env.GEMINI_API_KEY
  const model = process.env.GOOGLE_MODEL ?? 'gemini-2.5-flash'
  if (!apiKey) throw new Error('GEMINI_API_KEY no configurada')

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: prompt }] },
        contents: [{ role: 'user', parts: [{ text: userDataStr }] }],
        generationConfig: {
          temperature: 0.85,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 256,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              descripcion:      { type: 'STRING' },
              dificultad:       { type: 'STRING', enum: ['facil', 'media', 'dificil'] },
              xp_recompensa:    { type: 'INTEGER' },
              xp_penalizacion:  { type: 'INTEGER' },
            },
            required: ['descripcion', 'dificultad', 'xp_recompensa', 'xp_penalizacion'],
          },
        },
      }),
    }
  )

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Gemini error ${res.status}: ${body}`)
  }

  const geminiResponse = await res.json() as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> }
    }>
  }

  const raw = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text
  if (!raw) throw new Error('Gemini devolvió respuesta vacía')

  const parsed = JSON.parse(raw) as QuestJSON

  // Validaciones de seguridad
  if (!['facil', 'media', 'dificil'].includes(parsed.dificultad)) {
    parsed.dificultad = 'media'
  }
  parsed.xp_recompensa    = Math.max(5,  Math.min(200, Math.round(parsed.xp_recompensa)))
  parsed.xp_penalizacion  = Math.max(1,  Math.min(100, Math.round(parsed.xp_penalizacion)))

  return parsed
}

// ─── Route handler ────────────────────────────────────────────

export async function POST(request: Request) {
  // Auth: Bearer CRON_SECRET
  const token = (request.headers.get('Authorization') ?? '').replace('Bearer ', '').trim()
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET no configurada' }, { status: 500 })
  }
  if (token !== cronSecret) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  let userId: string
  try {
    const body = await request.json() as { user_id?: string }
    if (!body.user_id) {
      return NextResponse.json({ error: 'user_id requerido en el body' }, { status: 400 })
    }
    userId = body.user_id
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 })
  }

  try {
    const supabase = createAdminClient()
    const hoy = new Date().toISOString().split('T')[0]

    // Evitar duplicados: verificar si ya existe misión IA para hoy
    const { data: existente } = await supabase
      .from('misiones_diarias')
      .select('id')
      .eq('perfil_id', userId)
      .eq('fecha', hoy)
      .limit(1)
      .single()

    if (existente) {
      return NextResponse.json(
        { message: 'Ya existe una misión para hoy', mision_id: existente.id },
        { status: 200 }
      )
    }

    // 1. Obtener contexto real del usuario
    const contexto = await fetchContextoUsuario(userId)

    // 2. Llamar a Gemini
    const prompt = buildGameMasterPrompt(contexto)
    const questJSON = await callGeminiJSON(prompt, 'Genera la misión diaria para Joaco.')

    // 3. Insertar en misiones_diarias
    const { data: mision, error: insertError } = await supabase
      .from('misiones_diarias')
      .insert({
        perfil_id:      userId,
        descripcion:    questJSON.descripcion,
        dificultad:     questJSON.dificultad,
        xp_recompensa:  questJSON.xp_recompensa,
        xp_penalizacion: questJSON.xp_penalizacion,
        estado:         'pendiente',
        fecha:          hoy,
      })
      .select()
      .single()

    if (insertError) throw new Error(insertError.message)

    return NextResponse.json({
      ok: true,
      mision: mision as MisionDiaria,
      contexto_usado: {
        diasSinEntrenar:    contexto.gym.diasSinEntrenar,
        horasEstudio:       contexto.aprendizaje.horasUltimos2Dias,
        presupuestoExcedido: contexto.finanzas.hayPresupuestoExcedido,
      },
    })
  } catch (err) {
    console.error('[generate-quest] Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error interno' },
      { status: 500 }
    )
  }
}
