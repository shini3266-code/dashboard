'use client'
import { useState, useEffect } from 'react'
import StockLineChart from '@/components/LineChart'
import { CommentBox } from './ui'

export default function FredChartRow({ series, label, desc, color, unit = '%', getComment, isMobile }: {
  series: string
  label: string
  desc?: string
  color: string
  unit?: string
  getComment?: (val: number | null) => { keyword: string; text: string } | null
  isMobile: boolean
}) {
  const [data, setData] = useState<{ date: string; value: number }[]>([])
  const [latest, setLatest] = useState<number | null>(null)
  const [change, setChange] = useState<number | null>(null)

  useEffect(() => {
    fetch(`/api/fredhistory?series=${series}&limit=260`)
      .then(r => r.json())
      .then((d: { date: string; value: number }[]) => {
        setData(d)
        if (d.length >= 2) {
          setLatest(d[d.length - 1].value)
          setChange(d[d.length - 1].value - d[d.length - 2].value)
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

  const data1mo = data.slice(-22)
  const data1y = data.slice(-252)
  const c = getComment?.(latest) ?? null

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '280px 1fr 2fr',
      gap: 12,
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, padding: isMobile ? '14px' : '16px', marginBottom: 4,
    }}>
      <div>
        <div style={{ fontSize: '0.6rem', color: 'var(--muted)', marginBottom: 2, letterSpacing: '0.08em' }}>{series}</div>
        <div style={{ fontSize: '0.6rem', color: 'var(--muted)', marginBottom: 10 }}>{label}</div>
        <div style={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1, color: latest !== null && latest < 0 ? 'var(--down)' : 'var(--text)' }}>
          {latest !== null ? fmt(latest) : '--'}
        </div>
        {change !== null && (
          <div style={{ fontSize: '0.6rem', marginTop: 6, color: isUp ? 'var(--up)' : 'var(--down)' }}>
            {isUp ? '▲ +' : '▼ '}{fmt(Math.abs(change))}
          </div>
        )}
        {desc && <div style={{ fontSize: '0.6rem', color: 'var(--muted)', marginTop: 4, lineHeight: 1.5 }}>{desc}</div>}
        {c && <CommentBox keyword={c.keyword} text={c.text} level={getLevel()} />}
      </div>
      {!isMobile && (
        <div>
          <div style={{ fontSize: '0.6rem', color: 'var(--muted)', marginBottom: 4 }}>1개월</div>
          <StockLineChart symbol={series} color={color} range="1mo" height={120} formatValue={fmt} externalData={data1mo} />
        </div>
      )}
      <div>
        <div style={{ fontSize: '0.6rem', color: 'var(--muted)', marginBottom: 4 }}>
          {isMobile ? '1년 차트' : '1년'}
        </div>
        <StockLineChart symbol={series} color={color} range="1y" height={isMobile ? 200 : 120} formatValue={fmt} externalData={data1y} />
      </div>
    </div>
  )
}
