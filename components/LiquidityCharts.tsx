'use client'
import { useEffect, useState } from 'react'
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts'

interface ChartData {
  date: string
  value: number
}

interface LiqChartProps {
  series: string
  label: string
  desc: string
  color: string
  unit?: string
}

function formatB(v: number) {
  if (v >= 1000000) return `$${(v / 1000000).toFixed(2)}T`
  return `$${Math.round(v).toLocaleString()}B`
}

function CustomTooltip({ active, payload, label, color }: any) {
  if (active && payload?.length) {
    return (
      <div style={{
        background: 'var(--surface2)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '8px 12px',
        fontFamily: 'var(--mono)',
        fontSize: 12,
      }}>
        <div style={{ color: 'var(--muted)', marginBottom: 2 }}>{label}</div>
        <div style={{ color, fontWeight: 700 }}>{formatB(payload[0].value)}</div>
      </div>
    )
  }
  return null
}

function LiqChart({ series, label, desc, color, unit = 'B' }: LiqChartProps) {
  const [data, setData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [latest, setLatest] = useState<number | null>(null)
  const [change, setChange] = useState<number | null>(null)

  useEffect(() => {
    fetch(`/api/fredhistory?series=${series}&limit=104`)
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
  }, [series])

  const min = Math.min(...data.map(d => d.value))
  const max = Math.max(...data.map(d => d.value))
  const padding = (max - min) * 0.1

  const tickFormatter = (date: string) => {
    const d = new Date(date)
    return `${d.getFullYear().toString().slice(2)}.${String(d.getMonth() + 1).padStart(2, '0')}`
  }

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '16px',
      marginBottom: 8,
    }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)', marginBottom: 4, letterSpacing: '0.08em' }}>
            {label}
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{desc}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--text)' }}>
            {latest !== null ? formatB(latest) : '--'}
          </div>
          {change !== null && (
            <div style={{
              fontSize: 12, fontFamily: 'var(--mono)', marginTop: 2,
              color: change >= 0 ? 'var(--up)' : 'var(--down)',
            }}>
              {change >= 0 ? '▲ +' : '▼ '}{formatB(Math.abs(change))}
            </div>
          )}
        </div>
      </div>

      {/* 차트 */}
      {loading ? (
        <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 12 }}>
          로딩 중...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${series}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={tickFormatter}
              tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'var(--mono)' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[min - padding, max + padding]}
              tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'var(--mono)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatB(v)}
              width={70}
            />
            <Tooltip content={<CustomTooltip color={color} />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={1.5}
              fill={`url(#grad-${series})`}
              dot={false}
              activeDot={{ r: 4, fill: color }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export default function LiquidityCharts() {
  return (
    <div>
      <LiqChart
        series="WALCL"
        label="연준 총자산 (대차대조표)"
        desc="QE = 자산 증가 · QT = 자산 감소"
        color="#3b82f6"
      />
      <LiqChart
        series="WRESBAL"
        label="연준 지급준비금"
        desc="은행 시스템 총 준비금 · 3조달러 이상 안전"
        color="#8b5cf6"
      />
      <LiqChart
        series="RRPONTSYD"
        label="역레포 잔액 (RRP)"
        desc="초과유동성 흡수액 · 감소 = 시장으로 유동성 유입"
        color="#f59e0b"
      />
      <LiqChart
        series="WTREGEN"
        label="TGA 잔고 (재무부 일반계정)"
        desc="감소 = 유동성 공급 · 증가 = 유동성 흡수"
        color="#10b981"
      />
    </div>
  )
}