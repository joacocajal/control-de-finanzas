import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Checks if the gamification tables exist by querying gym_rutinas.
// If not, returns instructions to run the migration manually.
export async function GET() {
  try {
    const admin = createAdminClient()

    // Try to select from gym_rutinas — if the table doesn't exist, Supabase returns a 42P01 error
    const { error } = await admin.from('gym_rutinas').select('id').limit(1)

    if (error && (error.code === '42P01' || error.message.includes('does not exist'))) {
      return NextResponse.json({
        status: 'migration_needed',
        message: 'Las tablas de gamificación no existen. Corriendo migración...',
        tables_missing: true,
      })
    }

    return NextResponse.json({ status: 'ok', tables_exist: true })
  } catch (err) {
    return NextResponse.json({ status: 'error', message: String(err) }, { status: 500 })
  }
}
