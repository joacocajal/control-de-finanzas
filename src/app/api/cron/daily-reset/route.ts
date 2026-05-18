// POST /api/cron/daily-reset
// Reset de medianoche — Modo Hardcore:
//   1. Falla todas las misiones pendientes de días anteriores (dispara trigger XP).
//   2. Genera misión nueva vía Game Master para cada usuario activo.
// Auth: Bearer CRON_SECRET
// Invocar: cron diario a las 00:05 (o via Vercel Cron / n8n Schedule).

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── Tipos ────────────────────────────────────────────────────

interface ResetResult {
  userId: string
  misionesFailadas: number
  questGenerado: boolean
  error?: string
}

// ─── Helper: llamar internamente al endpoint generate-quest ──

async function generateQuestForUser(
  userId: string,
  baseUrl: string,
  cronSecret: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${baseUrl}/api/agent/generate-quest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cronSecret}`,
      },
      body: JSON.stringify({ user_id: userId }),
    })

    const json = await res.json() as { ok?: boolean; message?: string; error?: string }

    // "Ya existe misión" no es error real
    if (res.status === 200) return { ok: true }

    return { ok: false, error: json.error ?? `HTTP ${res.status}` }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'fetch error' }
  }
}

// ─── Route handler ────────────────────────────────────────────

export async function POST(request: Request) {
  // Auth
  const token = (request.headers.get('Authorization') ?? '').replace('Bearer ', '').trim()
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET no configurada' }, { status: 500 })
  }
  if (token !== cronSecret) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const hoy = new Date().toISOString().split('T')[0]

  // Base URL para llamadas internas (Vercel/local)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  try {
    // ── PASO 1: Fallar misiones pendientes de días anteriores ──────────────
    // El trigger on_mision_estado_changed se encarga de restar XP automáticamente.
    const { data: pendientes, error: fetchErr } = await supabase
      .from('misiones_diarias')
      .select('id, perfil_id, descripcion, xp_penalizacion')
      .eq('estado', 'pendiente')
      .lt('fecha', hoy)  // días anteriores a hoy

    if (fetchErr) throw new Error(`Error fetching pendientes: ${fetchErr.message}`)

    const misionesPendientes = pendientes ?? []

    let totalFailadas = 0
    if (misionesPendientes.length > 0) {
      const ids = misionesPendientes.map(m => m.id)

      // Update en lote → dispara el trigger de XP por cada fila
      const { error: updateErr } = await supabase
        .from('misiones_diarias')
        .update({ estado: 'fallada' })
        .in('id', ids)

      if (updateErr) throw new Error(`Error actualizando misiones: ${updateErr.message}`)
      totalFailadas = ids.length
    }

    // ── PASO 2: Usuarios activos (tienen perfil gamificado) ────────────────
    // "Activo" = tuvo actividad en los últimos 7 días o tiene misiones registradas
    const hace7Dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const { data: usuariosActivos, error: usersErr } = await supabase
      .from('misiones_diarias')
      .select('perfil_id')
      .gte('fecha', hace7Dias)

    if (usersErr) throw new Error(`Error buscando usuarios activos: ${usersErr.message}`)

    // Deduplicar user IDs
    const userIds = [...new Set((usuariosActivos ?? []).map(u => u.perfil_id as string))]

    // ── PASO 3: Generar misión nueva para cada usuario ─────────────────────
    const resultados: ResetResult[] = await Promise.all(
      userIds.map(async (userId): Promise<ResetResult> => {
        const misionesFailadas = misionesPendientes.filter(m => m.perfil_id === userId).length

        const questResult = await generateQuestForUser(userId, baseUrl, cronSecret)

        return {
          userId,
          misionesFailadas,
          questGenerado: questResult.ok,
          error: questResult.error,
        }
      })
    )

    const exitosos  = resultados.filter(r => r.questGenerado).length
    const fallidos  = resultados.filter(r => !r.questGenerado).length

    console.info(
      `[daily-reset] ${hoy} | Misiones failadas: ${totalFailadas} | Quests generados: ${exitosos}/${userIds.length}`
    )

    return NextResponse.json({
      ok: true,
      fecha: hoy,
      misiones_failadas_total: totalFailadas,
      usuarios_procesados: userIds.length,
      quests_generados: exitosos,
      quests_fallidos: fallidos,
      detalle: resultados,
    })
  } catch (err) {
    console.error('[daily-reset] Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error interno' },
      { status: 500 }
    )
  }
}

// ─── GET: healthcheck rápido del cron ─────────────────────────
export async function GET(request: Request) {
  const token = (request.headers.get('Authorization') ?? '').replace('Bearer ', '').trim()
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || token !== cronSecret) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  return NextResponse.json({
    ok: true,
    message: 'Daily reset endpoint activo',
    hora_servidor: new Date().toISOString(),
  })
}
