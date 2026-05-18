import { createClient } from '@/lib/supabase/client'
import type {
  Presupuesto,
  PresupuestoConCategoria,
  VerificacionPresupuesto,
  CreatePresupuestoInput,
} from '@/types/database.types'

// ─── CRUD ─────────────────────────────────────────────────────

export async function getPresupuestosActivos(): Promise<PresupuestoConCategoria[]> {
  const supabase = createClient()
  const hoy = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('finanzas_presupuestos')
    .select(`
      *,
      categories ( name, color, icon )
    `)
    .lte('fecha_inicio', hoy)
    .or(`fecha_fin.is.null,fecha_fin.gte.${hoy}`)
    .order('fecha_inicio', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as PresupuestoConCategoria[]
}

export async function crearPresupuesto(input: CreatePresupuestoInput): Promise<Presupuesto> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data, error } = await supabase
    .from('finanzas_presupuestos')
    .insert({
      perfil_id: user.id,
      categoria_gasto: input.categoria_gasto,
      monto_limite: input.monto_limite,
      periodo: input.periodo,
      fecha_inicio: input.fecha_inicio ?? new Date().toISOString().split('T')[0],
      fecha_fin: input.fecha_fin ?? null,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as Presupuesto
}

export async function actualizarPresupuesto(
  id: string,
  patch: Partial<Pick<Presupuesto, 'monto_limite' | 'periodo' | 'fecha_fin'>>,
): Promise<Presupuesto> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('finanzas_presupuestos')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as Presupuesto
}

export async function eliminarPresupuesto(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('finanzas_presupuestos').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ─── Verificación ─────────────────────────────────────────────
// Calcula si un nuevo gasto excede el presupuesto activo de esa categoría.
// El trigger on_transaction_check_budget aplica la penalización XP en la DB;
// esta función es solo para mostrar el estado en la UI antes de confirmar.

export async function verificarPresupuesto(
  categoriaId: string,
  montoNuevoGasto: number,
): Promise<VerificacionPresupuesto> {
  const supabase = createClient()
  const hoy = new Date().toISOString().split('T')[0]
  const inicioMes = hoy.substring(0, 7) + '-01' // YYYY-MM-01

  // 1. Buscar presupuesto activo para esa categoría
  const { data: presupuesto } = await supabase
    .from('finanzas_presupuestos')
    .select('*')
    .eq('categoria_gasto', categoriaId)
    .eq('periodo', 'mensual')
    .lte('fecha_inicio', hoy)
    .or(`fecha_fin.is.null,fecha_fin.gte.${hoy}`)
    .limit(1)
    .single()

  if (!presupuesto) {
    return {
      tienePresupuesto: false,
      limite: 0,
      gastadoActual: 0,
      gastadoConNuevo: montoNuevoGasto,
      excede: false,
      porcentajeUso: 0,
    }
  }

  // 2. Calcular total gastado este mes en esa categoría
  const { data: transacciones } = await supabase
    .from('transactions')
    .select('amount')
    .eq('category_id', categoriaId)
    .eq('type', 'expense')
    .gte('transaction_date', inicioMes)
    .lte('transaction_date', hoy)

  const gastadoActual = (transacciones ?? []).reduce(
    (acc, t) => acc + (t.amount as number),
    0,
  )
  const gastadoConNuevo = gastadoActual + montoNuevoGasto
  const limite = presupuesto.monto_limite as number

  return {
    tienePresupuesto: true,
    limite,
    gastadoActual,
    gastadoConNuevo,
    excede: gastadoConNuevo > limite,
    porcentajeUso: Math.round((gastadoConNuevo / limite) * 100),
  }
}
