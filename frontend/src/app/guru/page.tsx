'use client'

import { useEffect, useState } from 'react'
import { getDashboardGuru, getStudent } from '@/lib/api'
import type { DashboardGuruResponse, SiswaRingkasan, StudentResponse } from '@/types'
import { statusBg, statusHex, statusLabel, subbabLabel } from '@/lib/utils'
import { SkorBarChart, StatusPieChart } from '@/components/Charts'

const CP_COLS = ['CP 3.1', 'CP 3.2', 'CP 3.3']

function Spinner() {
  return (
    <span className="inline-block w-5 h-5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
  )
}

export default function GuruPage() {
  const [data, setData] = useState<DashboardGuruResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSiswa, setSelectedSiswa] = useState<SiswaRingkasan | null>(null)
  const [detailSiswa, setDetailSiswa] = useState<StudentResponse | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  function fetchDashboard() {
    setLoading(true)
    setError(null)
    getDashboardGuru()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchDashboard() }, [])

  async function handleKlikSiswa(siswa: SiswaRingkasan) {
    setSelectedSiswa(siswa)
    setDetailSiswa(null)
    setDetailLoading(true)
    try {
      const detail = await getStudent(siswa.siswa_id)
      setDetailSiswa(detail)
    } catch {
      // Siswa belum punya data — modal tetap muncul dengan pesan
    } finally {
      setDetailLoading(false)
    }
  }

  const barChartData = CP_COLS.map((cp) => {
    const hijau = data?.siswa.filter((s) => s.total_hijau > 0).length || 0
    const total = data?.siswa.length || 1
    return {
      cp,
      persentase: Math.round((hijau / total) * 100),
      status: hijau / total >= 0.8 ? 'hijau' : hijau / total >= 0.5 ? 'kuning' : 'merah',
    }
  })

  const pieData = [
    { name: 'Mastery (Hijau)', value: data?.ringkasan.total_hijau || 0, color: statusHex('hijau') },
    { name: 'Hampir (Kuning)', value: data?.ringkasan.total_kuning || 0, color: statusHex('kuning') },
    { name: 'Butuh Bantuan (Merah)', value: data?.ringkasan.total_merah || 0, color: statusHex('merah') },
  ]

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400">
        <Spinner />
        <div className="text-sm">Memuat dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-md mx-auto mt-8">
        <div className="text-red-700 font-medium mb-1">Gagal memuat data</div>
        <div className="text-sm text-red-500 mb-4">{error}</div>
        <p className="text-xs text-gray-400 mb-4">Pastikan backend berjalan di localhost:8000</p>
        <button
          onClick={fetchDashboard}
          className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    )
  }

  if (!data) return null

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Guru</h1>
        <p className="text-gray-500 text-sm mt-1">
          Matriks SMP Kelas 8 · {data.ringkasan.total_siswa} siswa terdaftar
        </p>
      </div>

      {/* 3 Card Ringkasan — stack di mobile, 3 kolom di desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <SummaryCard label="Mastery" count={data.ringkasan.total_hijau} emoji="🟢" color="emerald" />
        <SummaryCard label="Hampir" count={data.ringkasan.total_kuning} emoji="🟡" color="amber" />
        <SummaryCard label="Butuh Bantuan" count={data.ringkasan.total_merah} emoji="🔴" color="red" />
      </div>

      {/* Charts — stack di mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm font-semibold text-gray-700 mb-3">Skor Rata-rata per CP</div>
          <SkorBarChart data={barChartData} />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm font-semibold text-gray-700 mb-1">Distribusi Status CP</div>
          <StatusPieChart data={pieData} />
        </div>
      </div>

      {/* Tabel siswa — scrollable di HP */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-700">Daftar Siswa</div>
          <div className="text-xs text-gray-400 sm:hidden">← Geser untuk melihat semua</div>
        </div>
        {/* overflow-x-auto memungkinkan scroll horizontal di HP */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[540px]">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-2.5 font-medium text-gray-500 whitespace-nowrap">Nama</th>
                <th className="px-4 py-2.5 font-medium text-gray-500 whitespace-nowrap">Kelas</th>
                {CP_COLS.map((cp) => (
                  <th key={cp} className="px-4 py-2.5 font-medium text-gray-500 text-center whitespace-nowrap">
                    {cp}
                  </th>
                ))}
                <th className="px-4 py-2.5 font-medium text-gray-500 text-center whitespace-nowrap">Status</th>
                <th className="px-4 py-2.5 font-medium text-gray-500 whitespace-nowrap"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.siswa.map((siswa) => (
                <tr key={siswa.siswa_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{siswa.nama}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{siswa.kelas}</td>
                  {CP_COLS.map((cp) => {
                    const dominan = siswa.status_dominan
                    return (
                      <td key={cp} className="px-4 py-3 text-center">
                        {dominan === 'belum_kuis' ? (
                          <span className="text-xs text-gray-300">—</span>
                        ) : (
                          <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${statusBg(dominan)}`}>
                            {dominan === 'hijau' ? '✓' : dominan === 'kuning' ? '⚡' : '✗'}
                          </span>
                        )}
                      </td>
                    )
                  })}
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBg(siswa.status_dominan)}`}>
                      {statusLabel(siswa.status_dominan)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => handleKlikSiswa(siswa)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Detail →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail Siswa */}
      {selectedSiswa && (
        <DetailModal
          siswa={selectedSiswa}
          detail={detailSiswa}
          loading={detailLoading}
          onClose={() => { setSelectedSiswa(null); setDetailSiswa(null) }}
        />
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCard({
  label, count, emoji, color,
}: {
  label: string; count: number; emoji: string; color: 'emerald' | 'amber' | 'red'
}) {
  const colorMap = { emerald: 'bg-emerald-50 border-emerald-200', amber: 'bg-amber-50 border-amber-200', red: 'bg-red-50 border-red-200' }
  const textMap = { emerald: 'text-emerald-800', amber: 'text-amber-800', red: 'text-red-800' }
  return (
    <div className={`rounded-xl border p-5 ${colorMap[color]}`}>
      <div className="text-2xl mb-1">{emoji}</div>
      <div className={`text-3xl font-bold ${textMap[color]}`}>{count}</div>
      <div className={`text-sm ${textMap[color]} opacity-70 mt-0.5`}>{label}</div>
    </div>
  )
}

function DetailModal({
  siswa, detail, loading, onClose,
}: {
  siswa: SiswaRingkasan; detail: StudentResponse | null; loading: boolean; onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{siswa.nama}</h2>
            <div className="text-sm text-gray-500">{siswa.kelas}</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none p-1">✕</button>
        </div>

        {loading && (
          <div className="flex items-center justify-center h-32 gap-3 text-gray-400">
            <span className="inline-block w-5 h-5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
            <span className="text-sm">Memuat data...</span>
          </div>
        )}

        {!loading && !detail && (
          <div className="text-sm text-gray-400 text-center py-8">
            Siswa belum mengerjakan quiz
          </div>
        )}

        {!loading && detail && (
          <>
            <div className="mb-5">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Skor per CP</div>
              <div className="space-y-2">
                {detail.skor_per_cp.map((s) => (
                  <div key={s.cp} className="flex items-center gap-3">
                    <div className="text-sm font-medium text-gray-700 w-16">{s.cp}</div>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${s.status === 'hijau' ? 'bg-emerald-400' : s.status === 'kuning' ? 'bg-amber-400' : 'bg-red-400'}`}
                        style={{ width: `${s.persentase}%` }}
                      />
                    </div>
                    <div className="text-sm font-semibold text-gray-800 w-12 text-right">{s.persentase}%</div>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${statusBg(s.status)}`}>
                      {s.status === 'hijau' ? '✓' : s.status === 'kuning' ? '⚡' : '✗'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {detail.weak_spots.length > 0 ? (
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Topik Lemah</div>
                <div className="space-y-2">
                  {detail.weak_spots.map((ws) => (
                    <div key={ws.subbab} className="bg-red-50 rounded-lg px-3 py-2">
                      <div className="text-sm text-red-800 font-medium">{subbabLabel(ws.subbab)}</div>
                      <div className="text-xs text-red-500">{ws.total_salah}x salah · {ws.status}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-3 bg-indigo-50 rounded-lg">
                  <div className="text-xs text-indigo-700">
                    💡 <strong>Rekomendasi:</strong> Minta siswa klik "Latihan Tambahan" untuk soal AI yang spesifik per topik.
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 rounded-lg p-3 text-center">
                <div className="text-sm text-emerald-700 font-medium">🎉 Tidak ada topik lemah!</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
