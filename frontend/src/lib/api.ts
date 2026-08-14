// API client — semua fetch ke backend FastAPI

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `API error ${res.status}`)
  }
  return res.json()
}

// ── Soal ─────────────────────────────────────────────────────────────────────

import type {
  SoalItem,
  SubmitQuizResponse,
  StudentResponse,
  DashboardGuruResponse,
} from '@/types'

/** Ambil soal manual dari DB via endpoint generate dengan cache */
export async function getSoal(subbab: string, jumlah = 5): Promise<SoalItem[]> {
  return apiFetch<SoalItem[]>('/api/generate-soal', {
    method: 'POST',
    body: JSON.stringify({ subbab, level: 'sedang', jumlah }),
  })
}

/** Ambil soal AI generate untuk latihan tambahan */
export async function generateSoalAI(
  subbab: string,
  jumlah = 3,
  tingkat_pendidikan = 'SMP Kelas 8'
): Promise<SoalItem[]> {
  return apiFetch<SoalItem[]>('/api/generate-soal', {
    method: 'POST',
    body: JSON.stringify({ subbab, level: 'sedang', jumlah, tingkat_pendidikan }),
  })
}

// ── Quiz ──────────────────────────────────────────────────────────────────────

export async function submitQuiz(
  siswa_id: number,
  jawaban: { soal_id: number; jawaban: string }[]
): Promise<SubmitQuizResponse> {
  return apiFetch<SubmitQuizResponse>('/api/quiz/submit', {
    method: 'POST',
    body: JSON.stringify({ siswa_id, jawaban }),
  })
}

// ── Student ───────────────────────────────────────────────────────────────────

export async function getStudent(siswa_id: number): Promise<StudentResponse> {
  return apiFetch<StudentResponse>(`/api/student/${siswa_id}`)
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export async function getDashboardGuru(): Promise<DashboardGuruResponse> {
  return apiFetch<DashboardGuruResponse>('/api/dashboard/guru')
}
