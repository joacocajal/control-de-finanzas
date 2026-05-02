'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function trySignIn(emailVal: string, passwordVal: string): Promise<boolean> {
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: emailVal,
      password: passwordVal,
    })
    if (!authError) {
      router.push('/dashboard')
      router.refresh()
      return true
    }
    return false
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (!authError) {
      router.push('/dashboard')
      router.refresh()
      return
    }

    const msg = authError.message.toLowerCase()

    // Email not confirmed → auto-confirm via server, then retry
    if (msg.includes('not confirmed') || msg.includes('email') || msg.includes('confirm')) {
      const res = await fetch('/api/auth/confirm-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (res.ok) {
        const ok = await trySignIn(email, password)
        if (!ok) {
          setError('Contraseña incorrecta.')
          setLoading(false)
        }
        return
      }

      setError('No se pudo verificar tu cuenta. Revisá tu email de confirmación.')
      setLoading(false)
      return
    }

    if (msg.includes('invalid') || msg.includes('credentials') || msg.includes('password')) {
      setError('Email o contraseña incorrectos.')
    } else {
      setError(authError.message)
    }
    setLoading(false)
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
          <h1 className="text-white text-xl font-bold mb-1">Iniciar sesión</h1>
          <p className="text-gray-500 text-sm mb-6">Accedé a tu panel de finanzas</p>

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
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 text-sm"
                placeholder="••••••••"
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
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <p className="text-center text-gray-500 text-xs mt-5">
            ¿No tenés cuenta?{' '}
            <Link href="/register" className="text-indigo-400 hover:text-indigo-300">
              Registrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
