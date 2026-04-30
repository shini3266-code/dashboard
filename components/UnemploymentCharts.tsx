'use client'
import { useEffect, useState } from 'react'
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine
} from 'recharts'

interface ChartData {
  date: string
  value: number
}

function CustomTooltip({ active, payload, label, color, suffix = '' }: any) {
  if (active && payload?.length) {
    return (
      <div style={{
        background: 'var(--surface2)', border: '1px solid var(--border)',
        borderRadius: 8, padding: '8px 12px', fontFamily: 'var(--mono)', fontSize: 12,
      }}>
        <div style={{ color: 'var(--muted)', marginBottom: 2 }}>{label}</div>
        <div style={{ color, fontWeight: 700 }}>{payload[0].value?.toLocaleString()}{suffix}</div>
      </div>
    )
  }
  return null
}

function UnempChart() {
  const [data, setData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [latest, setLatest] = useState<number | null>(null)
  const [change, setChange] = useState<number | null>(null)

  useEffect(() => {
    fetch(`/api/fredhistory?series=UNRATE&limit=60`)
      .then(r => r.json())
      .then((d: ChartData[]) => {
        setData(d)
        if (d.length >= 2) {
          setLatest(d[d.length - 1].value)
          setChange(d[d.length - 1].value - d[d.length - 2].value)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const tickFormatter = (date: string) => {
    const d = new Date(date)
    return `${d.getFullYear().toString().slice(2)}.${String(d.getMonth() + 1).padStart(2, '0')}`
  }

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '16px', marginBottom: 8,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)', marginBottom: 4, letterSpacing: '0.08em' }}>
            미국 실업률 (UNRATE)
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
            4% 이하 = 완전고용 · 월간 데이터
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--text)' }}>
            {latest !== null ? `${latest.toFixed(1)}%` : '--'}
          </div>
          {change !== null && (
            <div style={{
              fontSize: 12, fontFamily: 'var(--mono)', marginTop: 2,
              color: change > 0 ? 'var(--down)' : change < 0 ? 'var(--up)' : 'var(--muted)',
            }}>
              {change > 0 ? '▲ +' : change < 0 ? '▼ ' : ''}{change.toFixed(1)}%p
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 12 }}>
          로딩 중...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="grad-unemp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={tickFormatter}
              tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'var(--mono)' }}
              axisLine={false} tickLine={false} interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'var(--mono)' }}
              axisLine={false} tickLine={false}
              tickFormatter={(v) => `${v}%`}
              width={36}
            />
            <Tooltip content={<CustomTooltip color="#f97316" suffix="%" />} />
            <ReferenceLine y={4} stroke="#f97316" strokeDasharray="3 3" strokeOpacity={0.5} />
            <Area
              type="monotone" dataKey="value"
              stroke="#f97316" strokeWidth={1.5}
              fill="url(#grad-unemp)"
              dot={false} activeDot={{ r: 4, fill: '#f97316' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

function JoblessChart() {
  const [data, setData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [latest, setLatest] = useState<number | null>(null)
  const [change, setChange] = useState<number | null>(null)

  useEffect(() => {
    fetch(`/api/fredhistory?series=ICSA&limit=104`)
      .then(r => r.json())
      .then((d: ChartData[]) => {
        setData(d)
        if (d.length >= 2) {
          setLatest(d[d.length - 1].value)
          setChange(d[d.length - 1].value - d[d.length - 2].value)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const tickFormatter = (date: string) => {
    const d = new Date(date)
    return `${d.getFullYear().toString().slice(2)}.${String(d.getMonth() + 1).padStart(2, '0')}`
  }

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '16px', marginBottom: 8,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)', marginBottom: 4, letterSpacing: '0.08em' }}>
            주간 신규 실업수당 청구 (ICSA)
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
            30만+ 급증 = 고용 냉각 신호 · 주간 데이터
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--text)' }}>
            {latest !== null ? `${Math.round(latest).toLocaleString()}건` : '--'}
          </div>
          {change !== null && (
            <div style={{
              fontSize: 12, fontFamily: 'var(--mono)', marginTop: 2,
              color: change > 0 ? 'var(--down)' : 'var(--up)',
            }}>
              {change > 0 ? '▲ +' : '▼ '}{Math.abs(Math.round(change)).toLocaleString()}건
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 12 }}>
          로딩 중...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={tickFormatter}
              tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'var(--mono)' }}
              axisLine={false} tickLine={false} interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'var(--mono)' }}
              axisLine={false} tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
              width={36}
            />
            <Tooltip content={<CustomTooltip color="#ef4444" suffix="건" />} />
            <ReferenceLine y={300000} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.5} />
            <Bar dataKey="value" fill="#ef4444" fillOpacity={0.7} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export default function UnemploymentCharts() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 8 }}>
      <UnempChart />
      <JoblessChart />
    </div>
  )
}