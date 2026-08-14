// Utility helpers

export type StatusColor = 'hijau' | 'kuning' | 'merah'

/** Return Tailwind class untuk background status */
export function statusBg(status: string): string {
  switch (status) {
    case 'hijau': return 'bg-emerald-100 text-emerald-800'
    case 'kuning': return 'bg-amber-100 text-amber-800'
    case 'merah': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-600'
  }
}

/** Return Tailwind class untuk border/ring status */
export function statusBorder(status: string): string {
  switch (status) {
    case 'hijau': return 'border-emerald-400'
    case 'kuning': return 'border-amber-400'
    case 'merah': return 'border-red-400'
    default: return 'border-gray-300'
  }
}

/** Return warna hex untuk Recharts */
export function statusHex(status: string): string {
  switch (status) {
    case 'hijau': return '#10b981'
    case 'kuning': return '#f59e0b'
    case 'merah': return '#ef4444'
    default: return '#6b7280'
  }
}

/** Label status dalam Bahasa Indonesia */
export function statusLabel(status: string): string {
  switch (status) {
    case 'hijau': return 'Mastery ✓'
    case 'kuning': return 'Hampir ⚡'
    case 'merah': return 'Butuh Latihan ✗'
    case 'belum_kuis': return 'Belum Kuis'
    default: return status
  }
}

/** Nama subbab yang lebih readable */
export function subbabLabel(subbab: string): string {
  const map: Record<string, string> = {
    ordo_matriks: 'Ordo Matriks',
    elemen_matriks: 'Elemen Matriks',
    pengertian_matriks: 'Pengertian Matriks',
    penjumlahan_matriks: 'Penjumlahan Matriks',
    pengurangan_matriks: 'Pengurangan Matriks',
    perkalian_skalar: 'Perkalian Skalar',
    matriks_identitas: 'Matriks Identitas',
    perkalian_matriks: 'Perkalian Matriks',
  }
  return map[subbab] || subbab.replace(/_/g, ' ')
}
