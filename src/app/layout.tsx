import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ascend — Personal Dev OS',
  description: 'Tu sistema gamificado de desarrollo personal: finanzas, fitness y aprendizaje.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  )
}
