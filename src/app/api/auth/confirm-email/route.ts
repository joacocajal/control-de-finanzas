import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const schema = z.object({ email: z.string().email() })

export async function POST(request: Request) {
  const body = await request.json() as unknown
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Email inválido' }, { status: 400 })

  try {
    const admin = createAdminClient()
    const { data: { users }, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 })
    if (listError) throw listError

    const user = users.find((u) => u.email === parsed.data.email)
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

    if (!user.email_confirmed_at) {
      const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
        email_confirm: true,
      })
      if (updateError) throw updateError
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[confirm-email]', err)
    return NextResponse.json({ error: 'No se pudo confirmar el email' }, { status: 500 })
  }
}
