'use client'
import { useState, useEffect } from 'react'
import StockLineChart from './LineChart'
import { CommentBox } from './ui'

const SHORT_RANGES = ['1m', '3m', '6m'] as const
const LONG_RANGES  = ['1y',  '3y',  '5y' ] as const
type ShortRange = typeof SHORT_RANGES[number]
type LongRange  = typeof LONG_RANGES[number]

const RANGE_POINTS: Record<string, number> = {
  '1m': 22, '3m': 66, '6m': 132,
  '1y': 252, '3y': 756, '5y': 1300,
}

export default function FredChartRow({ series, label, desc, color, unit = '%', getComment, isMobile }: {
  series: string
  label: string
  desc?: string
  color: string
  unit?: string
  getComment?: (val: number | null) => { keyword: string; text: string } | null
  isMobile: boolean
  onDataLoad?: (val: number | null) => void
}) {
  const [data, setData] = useState<{ date: string; value: number }[]>([])
  const [latest, setLatest] = useState<number | null>(null)
  const [change, setChange] = useState<number | null>(null)
  const [shortRange, setShortRange] = useState<ShortRange>('1m')
  const [longRange,  setLongRange ] = useState<LongRange>('1y')

  useEffect(() => {
    fetch(`/api/fredhistory?series=${series}&limit=1300`)  // 5y치 확보
      .then(r => r.json())
      .then((d: { date: string; value: number }[]) => {
        setData(d)
        if (d.length >= 2) {
          setLatest(d[d.length - 1].value)
          setChange(d[d.length - 1].value - d[d.length - 2].value)
          onDataLoad?.(d[d.length - 1].value)
        }
      })
      .catch(() => {})
  }, [series])

  const isUp = (change ?? 0) >= 0

  function fmt(n: number) {
    if (unit === 'B') return `$${Math.round(n).toLocaleString()}B`
    return `${n.toFixed(2)}${unit}`
  }

  function getLevel(): 'good' | 'warn' | 'bad' | 'neutral' {
    if (!latest) return 'neutral'
    if (series === 'T10Y2Y') return latest < 0 ? 'bad' : latest < 0.5 ? 'warn' : 'good'
    if (series === 'DGS10') return latest >= 5 ? 'bad' : latest >= 4 ? 'warn' : 'good'
    if (series === 'WRESBAL') return latest > 3000000 ? 'good' : latest > 2500000 ? 'neutral' : latest > 2000000 ? 'warn' : 'bad'
    if (series === 'RRPONTSYD') return latest < 100 ? 'warn' : 'neutral'
    return 'neutral'
  }

  function fmtYAxis(n: number) {
    if (unit === 'B') {
      if (Math.abs(n) >= 1000000) return `$${(n/1000000).toFixed(1)}T`
      if (Math.abs(n) >= 1000) return `$${(n/1000).toFixed(1)}T`
      return `$${Math.round(n)}B`
    }
    return `${n.toFixed(2)}${unit}`
  }

  const shortData = data.slice(-RANGE_POINTS[shortRange])
  const longData  = data.slice(-RANGE_POINTS[longRange])
  const c = getComment?.(latest) ?? null

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '320px 1fr 1.5fr',
      gap: 12,
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, padding: isMobile ? '14px' : '16px', marginBottom: 4,
    }}>
      <div>
        <div style={{ fontSize: '1.0rem', color: 'var(--muted)', marginBottom: 10 }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}></div>
          <div style={{ fontSize: '2.0rem', fontWeight: 700, lineHeight: 1, color: latest !== null && latest < 0 ? 'var(--down)' : 'var(--text)' }}>
          {latest !== null ? fmt(latest) : '--'}
        </div>
        {change !== null && (
          <div style={{ fontSize: '1.0rem', color: isUp ? 'var(--up)' : 'var(--down)' }}>
            {isUp ? '▲ +' : '▼ '}{fmt(Math.abs(change))}
          </div>
        )}
        {desc && <div style={{ fontSize: '1.0rem', color: 'var(--muted)', marginTop: 4, lineHeight: 1.5 }}>{desc}</div>}
        {c && <CommentBox keyword={c.keyword} text={c.text} level={getLevel()} />}
      </div>
      {/* 왼쪽: 단기 1mo/3mo/6mo */}
      {!isMobile && (
        <div>
          <RangeTabs ranges={SHORT_RANGES} selected={shortRange} onChange={setShortRange} color={color} />
          <StockLineChart
            symbol={series} color={color} height={120}
            formatValue={fmt} externalData={shortData}
            tickCount={10} formatYAxis={fmtYAxis}
          />
        </div>
      )}

      {/* 오른쪽: 장기 1y/3y/5y */}
      <div>
        <RangeTabs ranges={LONG_RANGES} selected={longRange} onChange={setLongRange} color={color} />
        <StockLineChart
          symbol={series} color={color} height={isMobile ? 200 : 120}
          formatValue={fmt} externalData={longData}
          tickCount={20} formatYAxis={fmtYAxis}
        />
      </div>
    </div>
  )
}

function RangeTabs<T extends string>({ ranges, selected, onChange, color }: {
  ranges: readonly T[]
  selected: T
  onChange: (r: T) => void
  color: string
}) {
  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
      {ranges.map(r => (
        <button key={r} onClick={() => onChange(r)} style={{
          fontSize: '1.0rem', padding: '2px 7px', borderRadius: 4,
          border: `1px solid ${selected === r ? color : 'var(--border)'}`,
          background: selected === r ? color : 'transparent',
          color: selected === r ? '#fff' : 'var(--muted)',
          cursor: 'pointer', fontWeight: selected === r ? 700 : 400,
        }}>
          {r.toUpperCase()}
        </button>
      ))}
    </div>
  )
}