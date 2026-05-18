import { createClient } from '@/lib/supabase/client'
import type {
  AlimentoBase,
  NutricionDiariaLog,
  RegistroAgua,
  ResumenNutricionDiaria,
  CreateNutricionLogInput,
} from '@/types/database.types'

function hoy(): string {
  return new Date().toISOString().split('T')[0]
}

// ─── Alimentos base (diccionario público) ────────────────────

export async function getAlimentosBase(): Promise<AlimentoBase[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('nutricion_alimentos_base')
    .select('*')
    .order('nombre')
  if (error) throw new Error(error.message)
  return (data ?? []) as AlimentoBase[]
}

// ─── Logs diarios de nutrición ───────────────────────────────

export async function getLogsNutricionHoy(): Promise<NutricionDiariaLog[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('nutricion_diaria_logs')
    .select('*')
    .eq('fecha', hoy())
    .order('id')
  if (error) throw new Error(error.message)
  return (data ?? []) as NutricionDiariaLog[]
}

export async function registrarComidaDiaria(
  input: CreateNutricionLogInput,
): Promise<NutricionDiariaLog> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  if (!input.alimento_id && !input.nombre_alimento_custom) {
    throw new Error('Se requiere alimento_id o nombre_alimento_custom')
  }

  const { data, error } = await supabase
    .from('nutricion_diaria_logs')
    .insert({
      perfil_id: user.id,
      alimento_id: input.alimento_id ?? null,
      nombre_alimento_custom: input.nombre_alimento_custom ?? null,
      cantidad_g: input.cantidad_g,
      calorias_totales: input.calorias_totales,
      proteinas_totales: input.proteinas_totales,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as NutricionDiariaLog
}

export async function eliminarLogNutricion(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('nutricion_diaria_logs').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ─── Agua ─────────────────────────────────────────────────────

export async function registrarAgua(cantidadMl: number): Promise<RegistroAgua> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data, error } = await supabase
    .from('registro_agua')
    .insert({ perfil_id: user.id, cantidad_ml: cantidadMl })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as RegistroAgua
}

export async function getTotalAguaHoy(): Promise<number> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('registro_agua')
    .select('cantidad_ml')
    .eq('fecha', hoy())
  if (error) throw new Error(error.message)
  return (data ?? []).reduce((acc, r) => acc + (r.cantidad_ml as number), 0)
}

export async function eliminarRegistroAgua(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('registro_agua').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ─── Resumen del día (compuesto) ──────────────────────────────

export async function getResumenDiario(): Promise<ResumenNutricionDiaria> {
  const [logs, totalAguaMl] = await Promise.all([
    getLogsNutricionHoy(),
    getTotalAguaHoy(),
  ])

  const totalCalorias = logs.reduce((acc, l) => acc + l.calorias_totales, 0)
  const totalProteinas = logs.reduce((acc, l) => acc + l.proteinas_totales, 0)

  return { logs, totalCalorias, totalProteinas, totalAguaMl }
}

// ─── Helper: calcular macros desde un alimento base ──────────

export function calcularMacros(
  alimento: AlimentoBase,
  cantidadG: number,
): { calorias_totales: number; proteinas_totales: number } {
  const factor = cantidadG / 100
  return {
    calorias_totales: Math.round(alimento.calorias_por_100g * factor * 10) / 10,
    proteinas_totales: Math.round(alimento.proteinas * factor * 10) / 10,
  }
}
