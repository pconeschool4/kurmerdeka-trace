import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'KURMERDEKA-TRACE',
  description: 'Adaptive Quiz Platform — Tracking & Remedial Otomatis per CP/TP Kurikulum Merdeka',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={`${geist.className} min-h-screen bg-gray-50 text-gray-900`}>
        {/* Navbar */}
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="font-bold text-lg tracking-tight text-indigo-700">
              KURMERDEKA<span className="text-gray-400 font-normal">-TRACE</span>
            </Link>
            <div className="flex items-center gap-4 text-sm font-medium">
              <Link href="/" className="text-gray-600 hover:text-indigo-700 transition-colors">
                Siswa
              </Link>
              <Link
                href="/guru"
                className="bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 transition-colors"
              >
                Dashboard Guru
              </Link>
            </div>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  )
}
