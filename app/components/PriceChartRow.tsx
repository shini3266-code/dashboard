'use client'
import { useState, useEffect } from 'react'
import StockLineChart from '@/components/LineChart'
import { QuoteData } from './types'
import { CommentBox, DrawdownBadge } from './ui'
import { getDrawdownComment } from './commentFunctions'

export default function PriceChartRow({ ticker, label, color, unit = '$', sub, data, formatValue, showDrawdown = false, comment, commentLevel, isMobile }: {
  ticker: string
  label: string
  color: string
  unit?: string
  sub?: string
  data: QuoteData | null
  formatValue?: (v: number) => string
  showDrawdown?: boolean
  comment?: { keyword: string; text: string } | null
  commentLevel?: 'good' | 'warn' | 'bad' | 'neutral'
  isMobile: boolean
}) {
  const [high, setHigh] = useState<number | null>(null)

  useEffect(() => {
    if (!showDrawdown) return
    fetch(`/api/history?symbol=${ticker}&range=2y`)
      .then(r => r.json())
      .then((d: { date: string; value: number }[]) => {
        if (d.length) setHigh(Math.max(...d.map(x => x.value)))
      })
      .catch(() => {})
  }, [ticker, showDrawdown])

  const isUp = (data?.change ?? 0) >= 0
  const fmt = formatValue ?? ((v: number) => `${unit}${v.toLocaleString()}`)
  const dd = showDrawdown ? getDrawdownComment(data?.price ?? null, high) : null

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '280px 1fr 2fr',
      gap: 12,
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, padding: isMobile ? '14px' : '16px', marginBottom: 4,
    }}>
      <div>
        <div style={{ fontSize: '0.6rem', color: 'var(--muted)', marginBottom: 2 }}>{ticker}</div>
        <div style={{ fontSize: '0.6rem', color: 'var(--muted)', marginBottom: 10 }}>{label}</div>
        <div style={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1 }}>
          {data ? `${unit}${data.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '--'}
        </div>
        <div style={{ fontSize: '0.6rem', marginTop: 6, color: isUp ? 'var(--up)' : 'var(--down)' }}>
          {data ? `${isUp ? '▲ +' : '▼ '}${data.change.toFixed(2)}%` : '--'}
        </div>
        {sub && <div style={{ fontSize: '0.6rem', color: 'var(--muted)', marginTop: 4 }}>{sub}</div>}
        {dd && <DrawdownBadge dd={dd} />}
        {comment && <CommentBox keyword={comment.keyword} text={comment.text} level={commentLevel} />}
      </div>
      {!isMobile && (
        <div>
          <div style={{ fontSize: '0.6rem', color: 'var(--muted)', marginBottom: 4 }}>1개월</div>
          <StockLineChart symbol={ticker} color={color} range="1mo" height={120} formatValue={fmt} />
        </div>
      )}
      <div>
        <div style={{ fontSize: '0.6rem', color: 'var(--muted)', marginBottom: 4 }}>
          {isMobile ? '1년 차트' : '1년'}
        </div>
        <StockLineChart symbol={ticker} color={color} range="1y" height={isMobile ? 200 : 120} formatValue={fmt} />
      </div>
    </div>
  )
}
