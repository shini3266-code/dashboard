'use client'
import { useEffect, useState } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'
import {
  ResponsiveContainer, AreaChart, Area,
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
        background: 'var(--surface2)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '10px 14px',
        fontSize: '1.3rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
      }}>
        <div style={{ color: 'var(--muted)', marginBottom: 4, fontSize: '1.3rem' }}>{label}</div>
        <div style={{ color, fontWeight: 700, fontSize: '1.3rem' }}>{payload[0].value?.toLocaleString()}{suffix}</div>
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

  {/* 실업률 멘트 */}
  {latest !== null && (
    <div style={{
      marginTop: 8, background: 'var(--surface2)', borderRadius: 6,
      padding: '6px 8px',
      borderLeft: `2px solid ${latest <= 4 ? 'var(--up)' : latest <= 5 ? 'var(--gold)' : 'var(--down)'}`,
    }}>
      <div style={{
        fontSize: '1.3rem', lineHeight: 1.6,
        color: latest <= 4 ? 'var(--up)' : latest <= 5 ? 'var(--gold)' : 'var(--down)',
      }}>
        {latest <= 4
          ? `${latest.toFixed(1)}% — 완전고용 수준이에요. 고용시장이 탄탄해요.`
          : latest <= 5
          ? `${latest.toFixed(1)}% — 소폭 상승 중이에요. 고용 냉각 신호를 모니터링하세요.`
          : `${latest.toFixed(1)}% — 고용시장이 악화되고 있어요. 연준 피벗 기대가 커질 수 있어요.`}
      </div>
    </div>
  )}

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
          <div style={{ fontSize: '1.3rem', color: 'var(--muted)', marginBottom: 4, letterSpacing: '0.08em' }}>
            미국 실업률 (UNRATE)
          </div>
          <div style={{ fontSize: '1.3rem', color: 'var(--muted)' }}>
            4% 이하 = 완전고용 · 월간 데이터
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '2.0rem', fontWeight: 700, color: 'var(--text)' }}>
            {latest !== null ? `${latest.toFixed(1)}%` : '--'}
          </div>
          {change !== null && (
            <div style={{
              fontSize: '1.3rem', marginTop: 2,
              color: change > 0 ? 'var(--down)' : change < 0 ? 'var(--up)' : 'var(--muted)',
            }}>
              {change > 0 ? '▲ +' : change < 0 ? '▼ ' : ''}{change.toFixed(1)}%p
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '1.3rem' }}>
          로딩 중...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="grad-jobless" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={tickFormatter}
              tick={{ fill: '#64748b', fontSize: '1.3rem' }}
              axisLine={false} tickLine={false} interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: '1.3rem' }}
              axisLine={false} tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
              width={36}
            />
            <Tooltip content={<CustomTooltip color="#ef4444" suffix="건" />} />
            <ReferenceLine y={300000} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.5} />
            <Area
              type="monotone" dataKey="value"
              stroke="#ef4444" strokeWidth={1.5}
              fill="url(#grad-jobless)"
              dot={false} activeDot={{ r: 4, fill: '#ef4444' }}
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

  {latest !== null && (
    <div style={{
      marginTop: 8, background: 'var(--surface2)', borderRadius: 6,
      padding: '6px 8px',
      borderLeft: `2px solid ${latest > 300000 ? 'var(--down)' : latest > 250000 ? 'var(--gold)' : 'var(--up)'}`,
    }}>
      <div style={{
        fontSize: '1.3rem', lineHeight: 1.6,
        color: latest > 300000 ? 'var(--down)' : latest > 250000 ? 'var(--gold)' : 'var(--up)',
      }}>
        {latest > 300000
          ? `${Math.round(latest).toLocaleString()}건 — 30만 초과예요. 고용 냉각 신호예요. 연준 피벗 기대가 커져요.`
          : latest > 250000
          ? `${Math.round(latest).toLocaleString()}건 — 정상 범위 상단이에요. 모니터링이 필요해요.`
          : `${Math.round(latest).toLocaleString()}건 — 건강한 수준이에요. 고용시장이 탄탄해요.`}
      </div>
    </div>
  )}
  
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
          <div style={{ fontSize: '1.3rem', color: 'var(--muted)', marginBottom: 4, letterSpacing: '0.08em' }}>
            주간 신규 실업수당 청구 (ICSA)
          </div>
          <div style={{ fontSize: '1.3rem', color: 'var(--muted)' }}>
            30만+ 급증 = 고용 냉각 신호 · 주간 데이터
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '2.0rem', fontWeight: 700, color: 'var(--text)' }}>
            {latest !== null ? `${Math.round(latest).toLocaleString()}건` : '--'}
          </div>
          {change !== null && (
            <div style={{
              fontSize: '1.3rem', marginTop: 2,
              color: change > 0 ? 'var(--down)' : 'var(--up)',
            }}>
              {change > 0 ? '▲ +' : '▼ '}{Math.abs(Math.round(change)).toLocaleString()}건
            </div>
          )}
        </div>
      </div>
  
      {loading ? (
        <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '1.3rem' }}>
          로딩 중...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="grad-jobless" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={tickFormatter}
              tick={{ fill: '#64748b', fontSize: '1.3rem' }}
              axisLine={false} tickLine={false} interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: '1.3rem' }}
              axisLine={false} tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
              width={36}
            />
            <Tooltip content={<CustomTooltip color="#ef4444" suffix="건" />} />
            <ReferenceLine y={300000} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.5} />
            <Area
              type="monotone" dataKey="value"
              stroke="#ef4444" strokeWidth={1.5}
              fill="url(#grad-jobless)"
              dot={false} activeDot={{ r: 4, fill: '#ef4444' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export default function UnemploymentCharts() {
  const isMobile = useIsMobile()
  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 8, marginBottom: 8 }}>
      <UnempChart />
      <JoblessChart />
    </div>
  )
}

