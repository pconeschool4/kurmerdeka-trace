'use client'

import { useState } from 'react'
import { getSoal, submitQuiz, generateSoalAI } from '@/lib/api'
import type { SoalItem, SubmitQuizResponse, WeakSpot } from '@/types'
import { statusBg, statusBorder, statusLabel, subbabLabel } from '@/lib/utils'

const CP_LIST = [
  { cp: 'CP 3.1', subbab: 'ordo_matriks', label: 'Pengertian & Ordo Matriks' },
  { cp: 'CP 3.2', subbab: 'penjumlahan_matriks', label: 'Operasi Matriks' },
  { cp: 'CP 3.3', subbab: 'matriks_identitas', label: 'Perkalian & Identitas' },
]

const SISWA_ID = 1

type QuizPhase = 'pilih_bab' | 'soal' | 'hasil' | 'latihan' | 'latihan_hasil'

// ── Spinner atom ──────────────────────────────────────────────────────────────
function Spinner({ size = 16 }: { size?: number }) {
  return (
    <span
      className="inline-block rounded-full border-2 border-current border-t-transparent animate-spin"
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  )
}

// ── Error banner dengan retry ─────────────────────────────────────────────────
function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start justify-between gap-3">
      <div className="text-red-700 text-sm">⚠️ {message}</div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs text-red-700 underline shrink-0 hover:text-red-900"
        >
          Coba lagi
        </button>
      )}
    </div>
  )
}

export default function SiswaPage() {
  const [phase, setPhase] = useState<QuizPhase>('pilih_bab')
  const [selectedCP, setSelectedCP] = useState<(typeof CP_LIST)[0] | null>(null)
  
  // Demo purpose: To test AI adaptive language
  const [tingkatPendidikan, setTingkatPendidikan] = useState('SMP Kelas 8')

  const [soalList, setSoalList] = useState<SoalItem[]>([])
  const [jawaban, setJawaban] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryFn, setRetryFn] = useState<(() => void) | null>(null)

  const [hasilQuiz, setHasilQuiz] = useState<SubmitQuizResponse | null>(null)

  const [selectedWeakSpot, setSelectedWeakSpot] = useState<WeakSpot | null>(null)
  const [latihanSoal, setLatihanSoal] = useState<SoalItem[]>([])
  const [latihanJawaban, setLatihanJawaban] = useState<Record<number, string>>({})
  const [latihanHasil, setLatihanHasil] = useState<SubmitQuizResponse | null>(null)
  const [latihanLoadingId, setLatihanLoadingId] = useState<string | null>(null)

  // ── Pilih CP ───────────────────────────────────────────────────────────────
  async function handlePilihCP(cp: (typeof CP_LIST)[0]) {
    setSelectedCP(cp)
    setError(null)
    setRetryFn(null)
    setLoading(true)
    setJawaban({})
    try {
      const soal = await getSoal(cp.subbab, 5)
      if (!soal || soal.length === 0) throw new Error('Soal tidak tersedia, coba CP lain')
      setSoalList(soal)
      setPhase('soal')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Gagal memuat soal'
      setError(msg)
      setRetryFn(() => () => handlePilihCP(cp))
    } finally {
      setLoading(false)
    }
  }

  // ── Submit quiz ────────────────────────────────────────────────────────────
  async function handleSubmitQuiz() {
    if (Object.keys(jawaban).length < soalList.length) {
      setError(`Jawab semua ${soalList.length} soal dulu!`)
      return
    }
    setError(null)
    setRetryFn(null)
    setLoading(true)
    try {
      const payload = soalList.map((s) => ({ soal_id: s.id, jawaban: jawaban[s.id] || '' }))
      const hasil = await submitQuiz(SISWA_ID, payload)
      setHasilQuiz(hasil)
      setPhase('hasil')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Gagal submit, periksa koneksi'
      setError(msg)
      setRetryFn(() => () => handleSubmitQuiz())
    } finally {
      setLoading(false)
    }
  }

  // ── Latihan tambahan ───────────────────────────────────────────────────────
  async function handleMulaiLatihan(ws: WeakSpot) {
    setSelectedWeakSpot(ws)
    setError(null)
    setRetryFn(null)
    setLatihanLoadingId(ws.subbab)
    setLatihanJawaban({})
    try {
      const soal = await generateSoalAI(ws.subbab, 3, tingkatPendidikan)
      if (!soal || soal.length === 0) throw new Error('Soal latihan tidak tersedia')
      setLatihanSoal(soal)
      setPhase('latihan')
    } catch (e: unknown) {
      // Groq gagal atau rate limit — tampilkan pesan ramah, bukan crash
      const msg = e instanceof Error
        ? e.message.includes('503') || e.message.includes('rate')
          ? `Groq API sedang sibuk. Soal manual dimuat sebagai gantinya. Coba klik lagi.`
          : e.message
        : 'Gagal generate soal latihan'
      setError(msg)
      setRetryFn(() => () => handleMulaiLatihan(ws))
    } finally {
      setLatihanLoadingId(null)
    }
  }

  // ── Submit latihan ─────────────────────────────────────────────────────────
  async function handleSubmitLatihan() {
    if (Object.keys(latihanJawaban).length < latihanSoal.length) {
      setError(`Jawab semua ${latihanSoal.length} soal latihan dulu!`)
      return
    }
    setError(null)
    setRetryFn(null)
    setLoading(true)
    try {
      const payload = latihanSoal.map((s) => ({ soal_id: s.id, jawaban: latihanJawaban[s.id] || '' }))
      const hasil = await submitQuiz(SISWA_ID, payload)
      setLatihanHasil(hasil)
      setPhase('latihan_hasil')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Gagal submit latihan'
      setError(msg)
      setRetryFn(() => () => handleSubmitLatihan())
    } finally {
      setLoading(false)
    }
  }

  function handleUlang() {
    setPhase('pilih_bab')
    setSelectedCP(null)
    setSoalList([])
    setJawaban({})
    setHasilQuiz(null)
    setLatihanSoal([])
    setLatihanJawaban({})
    setLatihanHasil(null)
    setSelectedWeakSpot(null)
    setError(null)
    setRetryFn(null)
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* ── Demo Toggle ── */}
      <div className="mb-6 flex items-center justify-end gap-2 text-sm bg-indigo-50/50 p-2 rounded-lg border border-indigo-100">
        <span className="text-indigo-600 font-medium">🧪 Demo Mode:</span>
        <span className="text-gray-500">Siswa level</span>
        <select 
          value={tingkatPendidikan} 
          onChange={(e) => setTingkatPendidikan(e.target.value)}
          className="bg-white border border-gray-200 rounded px-2 py-1 text-gray-700 outline-none focus:border-indigo-400"
        >
          <option value="SD Kelas 4">SD Kelas 4</option>
          <option value="SMP Kelas 8">SMP Kelas 8</option>
          <option value="SMA Kelas 11">SMA Kelas 11</option>
        </select>
      </div>

      {error && <ErrorBanner message={error} onRetry={retryFn ?? undefined} />}

      {phase === 'pilih_bab' && (
        <PilihBabView onPilih={handlePilihCP} loading={loading} />
      )}
      {phase === 'soal' && selectedCP && (
        <SoalView
          cp={selectedCP}
          soalList={soalList}
          jawaban={jawaban}
          onJawab={(id, val) => setJawaban((p) => ({ ...p, [id]: val }))}
          onSubmit={handleSubmitQuiz}
          loading={loading}
        />
      )}
      {phase === 'hasil' && hasilQuiz && (
        <HasilView
          hasil={hasilQuiz}
          onUlang={handleUlang}
          onLatihan={handleMulaiLatihan}
          latihanLoadingId={latihanLoadingId}
        />
      )}
      {phase === 'latihan' && selectedWeakSpot && (
        <LatihanView
          weakSpot={selectedWeakSpot}
          soalList={latihanSoal}
          jawaban={latihanJawaban}
          onJawab={(id, val) => setLatihanJawaban((p) => ({ ...p, [id]: val }))}
          onSubmit={handleSubmitLatihan}
          loading={loading}
        />
      )}
      {phase === 'latihan_hasil' && latihanHasil && (
        <LatihanHasilView 
          hasil={latihanHasil} 
          soalList={latihanSoal}
          jawaban={latihanJawaban}
          onUlang={handleUlang} 
        />
      )}
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function PilihBabView({
  onPilih,
  loading,
}: {
  onPilih: (cp: (typeof CP_LIST)[0]) => void
  loading: boolean
}) {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function handleClick(cp: (typeof CP_LIST)[0]) {
    setLoadingId(cp.cp)
    await onPilih(cp)
    setLoadingId(null)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Quiz Matriks</h1>
        <p className="text-gray-500 mt-1 text-sm">SMP Kelas 8 — Pilih Capaian Pembelajaran</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-700 font-bold text-lg">
            M
          </div>
          <div>
            <div className="font-semibold text-gray-900">Matriks</div>
            <div className="text-xs text-gray-400">SMP Kelas 8 · 3 CP · 15 soal</div>
          </div>
        </div>

        <div className="space-y-2">
          {CP_LIST.map((cp) => (
            <button
              key={cp.cp}
              onClick={() => handleClick(cp)}
              disabled={loading}
              className="w-full text-left flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-indigo-300 hover:bg-indigo-50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-2">
                {loadingId === cp.cp ? (
                  <Spinner size={14} />
                ) : null}
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  {cp.cp}
                </span>
                <span className="text-sm text-gray-700">{cp.label}</span>
              </div>
              <span className="text-gray-300 group-hover:text-indigo-400 text-lg">→</span>
            </button>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-gray-400">
        Setiap CP memiliki 5 soal pilihan ganda · Waktu tidak dibatasi
      </p>
    </div>
  )
}

function SoalView({
  cp,
  soalList,
  jawaban,
  onJawab,
  onSubmit,
  loading,
}: {
  cp: (typeof CP_LIST)[0]
  soalList: SoalItem[]
  jawaban: Record<number, string>
  onJawab: (id: number, val: string) => void
  onSubmit: () => void
  loading: boolean
}) {
  const dijawab = Object.keys(jawaban).length
  const total = soalList.length
  const siapSubmit = dijawab >= total

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-xs font-semibold text-indigo-600 mb-1">{cp.cp}</div>
          <h1 className="text-xl font-bold text-gray-900">{cp.label}</h1>
        </div>
        <div className="text-right text-sm text-gray-500">
          <div className="font-semibold text-gray-800 text-lg">{dijawab}/{total}</div>
          <div className="text-xs">dijawab</div>
        </div>
      </div>

      <div className="h-1.5 bg-gray-100 rounded-full mb-8">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-300"
          style={{ width: `${(dijawab / total) * 100}%` }}
        />
      </div>

      <div className="space-y-5">
        {soalList.map((soal, idx) => (
          <div key={soal.id} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-xs text-gray-400 mb-2">Soal {idx + 1}</div>
            <p className="text-gray-800 font-medium mb-4 leading-relaxed">{soal.soal}</p>
            <div className="grid grid-cols-1 gap-2">
              {soal.pilihan.map((pilihan, optIdx) => {
                const opt = ["A", "B", "C", "D", "E"][optIdx] || String(optIdx)
                const isSelected = jawaban[soal.id] === opt
                return (
                  <button
                    key={opt}
                    onClick={() => onJawab(soal.id, opt)}
                    disabled={loading}
                    className={`text-left px-4 py-2.5 rounded-lg border text-sm transition-all ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-600 text-white font-medium'
                        : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-700'
                    }`}
                  >
                    {pilihan}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <button
          onClick={onSubmit}
          disabled={loading || !siapSubmit}
          className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Spinner size={16} />
              <span>Menghitung skor...</span>
            </>
          ) : (
            `Submit Jawaban (${dijawab}/${total})`
          )}
        </button>
        {!siapSubmit && !loading && (
          <p className="text-center text-xs text-gray-400 mt-2">
            Jawab {total - dijawab} soal lagi untuk submit
          </p>
        )}
      </div>
    </div>
  )
}

function HasilView({
  hasil,
  onUlang,
  onLatihan,
  latihanLoadingId,
}: {
  hasil: SubmitQuizResponse
  onUlang: () => void
  onLatihan: (ws: WeakSpot) => void
  latihanLoadingId: string | null
}) {
  const adaMerahKuning = hasil.skor_per_cp.some(
    (s) => s.status === 'merah' || s.status === 'kuning'
  )

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Hasil Quiz</h1>

      <div className="space-y-3 mb-6">
        {hasil.skor_per_cp.map((skor) => (
          <div key={skor.cp} className={`bg-white rounded-xl border-2 p-5 ${statusBorder(skor.status)}`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="font-semibold text-gray-800">{skor.cp}</span>
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${statusBg(skor.status)}`}>
                  {statusLabel(skor.status)}
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{skor.persentase}%</div>
            </div>
            <div className="h-2 bg-gray-100 rounded-full">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  skor.status === 'hijau' ? 'bg-emerald-400' : skor.status === 'kuning' ? 'bg-amber-400' : 'bg-red-400'
                }`}
                style={{ width: `${skor.persentase}%` }}
              />
            </div>
            <div className="text-xs text-gray-400 mt-2">{skor.benar} benar dari {skor.total_soal} soal</div>
          </div>
        ))}
      </div>

      {hasil.weak_spots.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="font-semibold text-amber-800 mb-3 text-sm">📍 Topik yang perlu dilatih:</div>
          <div className="space-y-2">
            {hasil.weak_spots.map((ws) => {
              const isLoadingThis = latihanLoadingId === ws.subbab
              return (
                <div key={ws.subbab} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-sm text-amber-900">{subbabLabel(ws.subbab)}</span>
                    <span className="ml-2 text-xs text-amber-600">({ws.total_salah}x salah)</span>
                  </div>
                  <button
                    onClick={() => onLatihan(ws)}
                    disabled={latihanLoadingId !== null}
                    className="shrink-0 text-xs bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700 disabled:opacity-60 transition-colors flex items-center gap-1.5"
                  >
                    {isLoadingThis ? (
                      <>
                        <Spinner size={12} />
                        <span>Membuat soal...</span>
                      </>
                    ) : (
                      'Latihan AI →'
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {!adaMerahKuning && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 text-center">
          <div className="text-2xl mb-2">🎉</div>
          <div className="font-semibold text-emerald-800">Luar biasa! Semua CP Mastery!</div>
          <div className="text-sm text-emerald-600 mt-1">Kamu siap ke materi berikutnya</div>
        </div>
      )}

      <button
        onClick={onUlang}
        className="w-full py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
      >
        Kerjakan CP Lain
      </button>
    </div>
  )
}

function LatihanView({
  weakSpot,
  soalList,
  jawaban,
  onJawab,
  onSubmit,
  loading,
}: {
  weakSpot: WeakSpot
  soalList: SoalItem[]
  jawaban: Record<number, string>
  onJawab: (id: number, val: string) => void
  onSubmit: () => void
  loading: boolean
}) {
  const dijawab = Object.keys(jawaban).length
  const total = soalList.length
  const siapSubmit = dijawab >= total

  return (
    <div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-amber-600 bg-amber-100 px-2 py-0.5 rounded">
            ✨ AI Generate
          </span>
        </div>
        <div className="font-semibold text-amber-900">Latihan: {subbabLabel(weakSpot.subbab)}</div>
        <div className="text-xs text-amber-600 mt-1">{total} soal khusus dibuat AI untuk kamu</div>
      </div>

      <div className="space-y-5">
        {soalList.map((soal, idx) => (
          <div key={soal.id} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-xs text-gray-400 mb-2">Soal Latihan {idx + 1}</div>
            <p className="text-gray-800 font-medium mb-4 leading-relaxed">{soal.soal}</p>
            <div className="grid grid-cols-1 gap-2">
              {soal.pilihan.map((pilihan) => {
                const opt = pilihan.charAt(0)
                const isSelected = jawaban[soal.id] === opt
                return (
                  <button
                    key={opt}
                    onClick={() => onJawab(soal.id, opt)}
                    disabled={loading}
                    className={`text-left px-4 py-2.5 rounded-lg border text-sm transition-all ${
                      isSelected
                        ? 'bg-amber-500 border-amber-500 text-white font-medium'
                        : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50 text-gray-700'
                    }`}
                  >
                    {pilihan}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <button
          onClick={onSubmit}
          disabled={loading || !siapSubmit}
          className="w-full py-3 bg-amber-600 text-white font-semibold rounded-xl hover:bg-amber-700 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Spinner size={16} />
              <span>Menghitung skor...</span>
            </>
          ) : (
            `Submit Latihan (${dijawab}/${total})`
          )}
        </button>
      </div>
    </div>
  )
}

function LatihanHasilView({ 
  hasil, 
  soalList,
  jawaban,
  onUlang 
}: { 
  hasil: SubmitQuizResponse; 
  soalList: SoalItem[];
  jawaban: Record<number, string>;
  onUlang: () => void 
}) {
  const semuaHijau = hasil.skor_per_cp.every((s) => s.status === 'hijau')
  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">Hasil Latihan Tambahan</h1>
      <p className="text-gray-500 text-sm mb-6">
        {semuaHijau ? 'Kamu sudah memahami topik ini! 🎉' : 'Terus berlatih, kamu semakin dekat!'}
      </p>
      <div className="space-y-3 mb-8">
        {hasil.skor_per_cp.map((skor) => (
          <div key={skor.cp} className={`bg-white rounded-xl border-2 p-5 ${statusBorder(skor.status)}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBg(skor.status)}`}>
                {statusLabel(skor.status)}
              </span>
              <span className="text-2xl font-bold">{skor.persentase}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  skor.status === 'hijau' ? 'bg-emerald-400' : skor.status === 'kuning' ? 'bg-amber-400' : 'bg-red-400'
                }`}
                style={{ width: `${skor.persentase}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-xl">💡</span> Pembahasan & Analogi AI
        </h2>
        <div className="space-y-4">
          {soalList.map((soal, idx) => {
            const isBenar = jawaban[soal.id] === soal.jawaban
            return (
              <div key={soal.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className={`px-4 py-2 text-xs font-semibold text-white ${isBenar ? 'bg-emerald-500' : 'bg-red-500'}`}>
                  Soal {idx + 1} — {isBenar ? 'Benar ✓' : 'Salah ✗'}
                </div>
                <div className="p-4">
                  <p className="text-gray-800 font-medium mb-3 text-sm">{soal.soal}</p>
                  
                  <div className="flex gap-4 text-sm mb-4">
                    <div className="flex-1 p-2 rounded bg-gray-50 border border-gray-100">
                      <span className="text-xs text-gray-500 block mb-1">Jawaban Kamu:</span>
                      <strong className={isBenar ? 'text-emerald-600' : 'text-red-600'}>{jawaban[soal.id]}</strong>
                    </div>
                    {!isBenar && (
                      <div className="flex-1 p-2 rounded bg-emerald-50 border border-emerald-100">
                        <span className="text-xs text-emerald-600 block mb-1">Kunci Jawaban:</span>
                        <strong className="text-emerald-700">{soal.jawaban}</strong>
                      </div>
                    )}
                  </div>

                  {soal.penjelasan && (
                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-sm text-indigo-900">
                      <span className="font-semibold block mb-1">Penjelasan AI:</span>
                      {soal.penjelasan}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <button
        onClick={onUlang}
        className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
      >
        Kembali ke Pilih Bab
      </button>
    </div>
  )
}
