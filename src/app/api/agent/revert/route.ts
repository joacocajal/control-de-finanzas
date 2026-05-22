import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  let actionId: string
  try {
    const body = await request.json() as { action_id?: string }
    if (!body.action_id) {
      return NextResponse.json({ error: 'action_id requerido' }, { status: 400 })
    }
    actionId = body.action_id
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 })
  }

  const { data: action, error: fetchError } = await supabase
    .from('agent_actions_log')
    .select('*')
    .eq('id', actionId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !action) {
    return NextResponse.json({ error: 'Acción no encontrada' }, { status: 404 })
  }

  if (action.status === 'reverted') {
    return NextResponse.json({ error: 'Esta acción ya fue revertida' }, { status: 409 })
  }

  try {
    const table = action.target_table as string
    const rowId = action.target_row_id as string | null

    if (action.action_type === 'insert' && rowId) {
      const { error } = await supabase.from(table).delete().eq('id', rowId)
      if (error) throw new Error(error.message)
    } else if (action.action_type === 'update' && rowId && action.previous_state) {
      const { error } = await supabase
        .from(table)
        .update(action.previous_state as Record<string, unknown>)
        .eq('id', rowId)
      if (error) throw new Error(error.message)
    } else if (action.action_type === 'delete' && action.previous_state) {
      const { error } = await supabase.from(table).insert(action.previous_state as Record<string, unknown>)
      if (error) throw new Error(error.message)
    } else {
      return NextResponse.json({ error: 'No se puede revertir esta acción' }, { status: 422 })
    }

    const { error: updateError } = await supabase
      .from('agent_actions_log')
      .update({ status: 'reverted' })
      .eq('id', actionId)
    if (updateError) throw new Error(updateError.message)

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al revertir' },
      { status: 500 }
    )
  }
}
