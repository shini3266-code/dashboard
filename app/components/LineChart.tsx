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

const CustomXTick = ({ x, y, payload }: any) => {
  if (!payload?.value) return null
  const d = new Date(payload.value)
  const label = `${d.getMonth() + 1}/${d.getDate()}`
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={10} textAnchor="middle" fill="#808c9e" fontSize={5}>
        {label}
      </text>
    </g>
  )
}

const CustomYTick = ({ x, y, payload, formatter }: any) => {
  if (payload?.value == null) return null
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={4} textAnchor="end" fill="#808c9e" fontSize={5}>
        {formatter ? formatter(payload.value) : payload.value}
      </text>
    </g>
  )
}

export default function StockLineChart({
  symbol,
  color = '#3b82f6',
  range = '1y',
  height = 200,
  formatValue = (v) => v.toLocaleString(),
  externalData,
  tickCount = 6,
  formatYAxis,
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
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [symbol, range, externalData])

  if (loading) return (
    <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '1.3rem' }}>
      로딩 중...
    </div>
  )

  if (!data.length) return (
    <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '1.3rem' }}>
      데이터 없음
    </div>
  )

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length && payload[0]?.value != null) {
      return (
        <div style={{
          background: 'var(--surface2)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '8px 12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        }}>
          <div style={{ color: 'var(--muted)', marginBottom: 4, fontSize: 10 }}>{label}</div>
          <div style={{ color, fontWeight: 700, fontSize: 11 }}>{formatValue(payload[0].value)}</div>
        </div>
      )
    }
    return null
  }

  const min = data.length ? Math.min(...data.map(d => d.value)) : 0
  const max = data.length ? Math.max(...data.map(d => d.value)) : 0
  const padding = (max - min) * 0.1 || 1

  const xTicks = (() => {
    if (!data.length) return []
    const count = tickCount
    const step = Math.floor((data.length - 1) / (count - 1))
    return Array.from({ length: count }, (_, i) =>
      data[Math.min(i * step, data.length - 1)].date
    )
  })()

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
            tick={<CustomXTick />}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            tickLine={false}
            interval={0}
            ticks={xTicks}
          />
          <YAxis
            domain={[min - padding, max + padding]}
            tick={<CustomYTick formatter={formatYAxis ?? formatValue} />}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            tickLine={false}
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