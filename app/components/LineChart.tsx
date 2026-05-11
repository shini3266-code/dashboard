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

interface Props {
  symbol: string
  color?: string
  range?: string
  height?: number
  formatValue?: (v: number) => string
  externalData?: { date: string; value: number }[]
  tickCount?: number
  formatYAxis?: (v: number) => string
}

export default function StockLineChart({
  symbol,
  color = '#3b82f6',
  range,              // ← 외부에서 제어할 때
  ranges = '1y',
  height = 200,
  formatValue = (v) => v.toLocaleString(),
  externalData,
  tickCount = 6,
  formatYAxis,
}: Props) {
  const [data, setData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)

  // useEffect(() => {
  //   if (range) setActiveRange(range)
  // }, [range])

  useEffect(() => {
    if (externalData) {
      setData(externalData)
      setLoading(false)
      return
    }
    setLoading(true)
    fetch(`/api/history?symbol=${symbol}&range=${range}`) 
      .then(r => r.json())
      .then(d => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [symbol, range, externalData])

  if (loading) return (
    <div style={{
      height,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--muted)',
      fontSize: '0.5rem',
    }}>
      로딩 중...
    </div>
  )

  if (!data.length) return (
    <div style={{
      height,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--muted)',
      fontSize: '0.6rem',
    }}>
      데이터 없음
    </div>
  )

  // 날짜 포맷 (월만 표시)
  const tickFormatter = (date: string) => {
    const d = new Date(date)
    return `${d.getMonth() + 1}월`
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div style={{
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '10px 14px',
          fontSize: '0.5rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',  // ← 그림자 추가
        }}>
          <div style={{ color: 'var(--muted)', marginBottom: 4, fontSize: '0.5rem' }}>{label}</div>
          <div style={{ color, fontWeight: 700, fontSize: '0.6rem' }}>{formatValue(payload[0].value)}</div>
        </div>
      )
    }
    return null
  }

  const min = Math.min(...data.map(d => d.value))
  const max = Math.max(...data.map(d => d.value))
  const padding = (max - min) * 0.1

  return (
    <div>
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${symbol}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.5} />
            <stop offset="95%" stopColor={color} stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={true} />
        <XAxis
          dataKey="date"
          type="category"
          tickFormatter={(date) => {
            const d = new Date(date)
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          }}
          tick={{ fill: '#64748b', fontSize: 5 }}
          // tick={(props) => (
          //   <text x={props.x} y={props.y} dy={10} fill="#64748b" fontSize={5} textAnchor="middle">
          //     {tickFormatter(props.value)}
          //   </text>
          // )}
          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          tickLine={false}
          interval={0}
          ticks={(() => {
            if (!data.length) return []
            const count = tickCount
            const step = Math.floor((data.length - 1) / (count - 1))
            return Array.from({ length: count }, (_, i) =>
              data[Math.min(i * step, data.length - 1)].date
            )
          })()}
          tickFormatter={(date) => {
            const d = new Date(date)
            return `${d.getMonth() + 1}/${d.getDate()}`
          }}
        />
        <YAxis
          domain={[min - padding, max + padding]}
          // tick={{ fill: '#64748b', fontSize: 10 }}
          tick={(props) => (
            <text x={props.x} y={props.y} dy={4} fill="#64748b" fontSize={10} textAnchor="end">
              {formatValue(props.value)}
            </text>
          )}
          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          tickLine={false}
          tickFormatter={formatYAxis ?? formatValue}
          width={60}
          tickCount={5}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#grad-${symbol})`}
          dot={false}
          activeDot={{ r: 4, fill: color }}
        />
      </AreaChart>
    </ResponsiveContainer>
    </div>
  )
}