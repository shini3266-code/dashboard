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
}

export default function StockLineChart({
  symbol,
  color = '#3b82f6',
  range = '1y',
  height = 200,
  formatValue = (v) => v.toLocaleString(),
  externalData,
}: Props) {
  const [data, setData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)

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
      fontFamily: 'var(--mono)',
      fontSize: '0.6rem',
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
      fontFamily: 'var(--mono)',
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
          fontFamily: 'var(--mono)',
          fontSize: '0.6rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',  // ← 그림자 추가
        }}>
          <div style={{ color: 'var(--muted)', marginBottom: 4, fontSize: '0.6rem' }}>{label}</div>
          <div style={{ color, fontWeight: 700, fontSize: '0.8rem' }}>{formatValue(payload[0].value)}</div>
        </div>
      )
    }
    return null
  }

  const min = Math.min(...data.map(d => d.value))
  const max = Math.max(...data.map(d => d.value))
  const padding = (max - min) * 0.1

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${symbol}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.2} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={tickFormatter}
          tick={{ fill: '#64748b', fontSize: '0.6rem', fontFamily: 'var(--mono)' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[min - padding, max + padding]}
          tick={{ fill: '#64748b', fontSize: '0.6rem', fontFamily: 'var(--mono)' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={formatValue}
          width={60}
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
  )
}