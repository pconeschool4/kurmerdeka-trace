// Tipe data yang mirror dengan backend Pydantic models

export interface SoalItem {
  id: number
  bab: string
  cp: string
  subbab: string
  soal: string
  pilihan: string[]
  jawaban: string
  penjelasan: string
  sumber: 'manual' | 'ai'
}

export interface JawabanItem {
  soal_id: number
  jawaban: string
}

export interface SkorCP {
  cp: string
  total_soal: number
  benar: number
  persentase: number
  status: 'hijau' | 'kuning' | 'merah'
}

export interface WeakSpot {
  subbab: string
  total_salah: number
  status: string
}

export interface SubmitQuizResponse {
  skor_per_cp: SkorCP[]
  status_per_cp: Record<string, string>
  weak_spots: WeakSpot[]
}

export interface StudentResponse {
  siswa_id: number
  nama: string
  kelas: string
  skor_per_cp: SkorCP[]
  weak_spots: WeakSpot[]
}

export interface SiswaRingkasan {
  siswa_id: number
  nama: string
  kelas: string
  total_hijau: number
  total_kuning: number
  total_merah: number
  status_dominan: string
}

export interface DashboardGuruResponse {
  ringkasan: {
    total_siswa: number
    total_hijau: number
    total_kuning: number
    total_merah: number
  }
  siswa: SiswaRingkasan[]
}
