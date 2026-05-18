'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setLoading(true)

    // Register via server (auto-confirms email, no verification needed)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json() as { error?: string; userId?: string }

    if (!res.ok) {
      setError(data.error ?? 'Error al crear la cuenta.')
      setLoading(false)
      return
    }

    // Sign in immediately after registration
    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError('Cuenta creada. Intentá iniciar sesión.')
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="p-2 bg-indigo-600 rounded-xl">
            <TrendingUp size={20} className="text-white" />
          </div>
          <span className="text-white font-bold text-xl">Mis Finanzas</span>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-7">
          <h1 className="text-white text-xl font-bold mb-1">Crear cuenta</h1>
          <p className="text-gray-500 text-sm mb-6">Empezá a controlar tus finanzas</p>

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs text-gray-400 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 text-sm"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs text-gray-400 mb-1.5">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 text-sm"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            {error && (
              <p className="text-red-400 text-xs bg-red-950/30 border border-red-800/40 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed mt-1"
            >
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <p className="text-center text-gray-500 text-xs mt-5">
            ¿Ya tenés cuenta?{' '}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300">
              Iniciá sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
