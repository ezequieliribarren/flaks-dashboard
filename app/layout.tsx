import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Flaks — Tablero de Clientes',
  description: 'Panel de gestión de clientes Flaks',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
