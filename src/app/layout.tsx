import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Mis Finanzas',
  description: 'Registrá tus ingresos y gastos, visualizá tu balance y recibí consejos de IA.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.className} bg-gray-950 antialiased`}>{children}</body>
    </html>
  )
}
