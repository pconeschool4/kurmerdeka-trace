'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import type { SkorCP } from '@/types'
import { statusHex } from '@/lib/utils'

// ── Bar Chart — Skor rata-rata per CP ─────────────────────────────────────────

interface BarChartData {
  cp: string
  persentase: number
  status: string
}

export function SkorBarChart({ data }: { data: BarChartData[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="cp" tick={{ fontSize: 12 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
        <Tooltip
          formatter={(val) => [`${val ?? 0}%`, 'Rata-rata Skor']}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
        />
        <Bar dataKey="persentase" radius={[4, 4, 0, 0]}>
          {data.map((entry, idx) => (
            <Cell key={idx} fill={statusHex(entry.status)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Pie Chart — Distribusi status siswa ──────────────────────────────────────

interface PieChartData {
  name: string
  value: number
  color: string
}

export function StatusPieChart({ data }: { data: PieChartData[] }) {
  const nonEmpty = data.filter((d) => d.value > 0)

  if (nonEmpty.length === 0) {
    return (
      <div className="h-[180px] flex items-center justify-center text-sm text-gray-400">
        Belum ada data
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie
          data={nonEmpty}
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={70}
          paddingAngle={3}
          dataKey="value"
        >
          {nonEmpty.map((entry, idx) => (
            <Cell key={idx} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(val, name) => [val ?? 0, name]}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}
