// Quest Service — interfaz unificada de misiones diarias.
// El XP se aplica/resta vía triggers en la DB (on_mision_estado_changed).
// Aquí solo manejamos estado y consultas.
import { createClient } from '@/lib/supabase/client'
import type { MisionDiaria, MisionEstado, CreateMisionInput } from '@/types/database.types'

function hoy(): string {
  return new Date().toISOString().split('T')[0]
}

// ─── Queries ─────────────────────────────────────────────────

export async function getMisionesHoy(): Promise<MisionDiaria[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('misiones_diarias')
    .select('*')
    .eq('fecha', hoy())
    .order('estado')    // pendiente primero (alphabetical: completada < fallada < pendiente → no ideal)
    .order('dificultad')
  if (error) throw new Error(error.message)
  return (data ?? []) as MisionDiaria[]
}

export async function getMisionesPorFecha(fecha: string): Promise<MisionDiaria[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('misiones_diarias')
    .select('*')
    .eq('fecha', fecha)
    .order('estado')
  if (error) throw new Error(error.message)
  return (data ?? []) as MisionDiaria[]
}

// ─── Mutaciones ───────────────────────────────────────────────

export async function crearMision(input: CreateMisionInput): Promise<MisionDiaria> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data, error } = await supabase
    .from('misiones_diarias')
    .insert({
      ...input,
      perfil_id: user.id,
      xp_penalizacion: Math.floor(input.xp_recompensa / 2),
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as MisionDiaria
}

// Cambia el estado de una misión y aplica XP via RPC (no trigger).
export async function actualizarEstadoMision(
  misionId: string,
  estado: Extract<MisionEstado, 'completada' | 'fallada'>,
): Promise<MisionDiaria> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data, error } = await supabase
    .from('misiones_diarias')
    .update({ estado })
    .eq('id', misionId)
    .select()
    .single()
  if (error) throw new Error(error.message)

  const mision = data as MisionDiaria

  if (estado === 'completada') {
    const { error: xpError } = await supabase.rpc('otorgar_xp', {
      p_perfil_id: user.id,
      p_categoria: 'finanzas',
      p_xp_ganado: mision.xp_recompensa,
    })
    if (xpError) console.error('Error otorgando XP:', xpError.message)
  } else {
    const { error: xpError } = await supabase.rpc('restar_xp', {
      p_perfil_id: user.id,
      p_categoria: 'finanzas',
      p_xp_perdido: mision.xp_penalizacion,
    })
    if (xpError) console.error('Error restando XP:', xpError.message)
  }

  return mision
}

export async function completarMision(misionId: string): Promise<MisionDiaria> {
  return actualizarEstadoMision(misionId, 'completada')
}

export async function fallarMision(misionId: string): Promise<MisionDiaria> {
  return actualizarEstadoMision(misionId, 'fallada')
}

// ─── Stats del día ────────────────────────────────────────────

export interface ResumenMisiones {
  total: number
  completadas: number
  falladas: number
  pendientes: number
  xpGanado: number
  xpPerdido: number
}

export function calcularResumenMisiones(misiones: MisionDiaria[]): ResumenMisiones {
  return misiones.reduce<ResumenMisiones>(
    (acc, m) => {
      acc.total++
      if (m.estado === 'completada') {
        acc.completadas++
        acc.xpGanado += m.xp_recompensa
      } else if (m.estado === 'fallada') {
        acc.falladas++
        acc.xpPerdido += m.xp_penalizacion
      } else {
        acc.pendientes++
      }
      return acc
    },
    { total: 0, completadas: 0, falladas: 0, pendientes: 0, xpGanado: 0, xpPerdido: 0 },
  )
}
