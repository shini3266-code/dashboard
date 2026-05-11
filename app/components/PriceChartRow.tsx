'use client'
import { useState, useEffect } from 'react'
import StockLineChart from './LineChart'
import { QuoteData } from './types'
import { CommentBox, DrawdownBadge } from './ui'
import { getDrawdownComment } from './commentFunctions'

const SHORT_RANGES = ['1m', '3m', '6m'] as const
const LONG_RANGES  = ['1y', '3y', '5y'] as const

type ShortRange = typeof SHORT_RANGES[number]
type LongRange  = typeof LONG_RANGES[number]

const rangeMap: Record<string, string> = {
  '1m': '1mo', '3m': '3mo', '6m': '6mo',
  '1y': '1y',  '3y': '3y',  '5y': '5y',
}

export default function PriceChartRow({ ticker, label, color, unit = '$', sub, data, formatValue, showDrawdown = false, comment, commentLevel, keyword, keywordLevel, isMobile }: {
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
  keyword?: string
  keywordLevel?: 'good' | 'warn' | 'bad' | 'neutral'
  isMobile: boolean
}) {
  const [shortRange, setShortRange] = useState<ShortRange>('1m')
  const [longRange,  setLongRange ] = useState<LongRange>('1y')
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
  const fmt = (v: number) => {
    if (unit === '') return v.toFixed(2)  // DXY 같은 경우
    return `${unit}${Math.round(v).toLocaleString()}`  // 소수점 제거
  }
  const dd = showDrawdown ? getDrawdownComment(data?.price ?? null, high) : null

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '320px 1fr 1.5fr',
      gap: 12,
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, padding: isMobile ? '14px' : '16px', marginBottom: 4,
    }}>
      <div>
        <div style={{ fontSize: '1.3rem', color: 'var(--muted)', marginBottom: 10 }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <div style={{ fontSize: '2.0rem', fontWeight: 700, lineHeight: 1 }}>
            {data ? `${unit}${data.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '--'}
          </div>
          <div style={{ fontSize: '1.3rem', color: isUp ? 'var(--up)' : 'var(--down)' }}>
            {data ? `${isUp ? '▲ +' : '▼ '}${data.change.toFixed(2)}%` : '--'}
          </div>
        </div>

        {sub && <div style={{ fontSize: '1.3rem', color: 'var(--muted)', marginTop: 4 }}>{sub}</div>}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
          {keyword && (
            <span style={{
              fontSize: '1.3rem', fontWeight: 700,
              color: keywordLevel === 'good' ? '#22c55e' : keywordLevel === 'warn' ? '#f59e0b' : keywordLevel === 'bad' ? '#ef4444' : '#e2e8f0',
              border: '1px solid',
              borderColor: keywordLevel === 'good' ? '#22c55e' : keywordLevel === 'warn' ? '#f59e0b' : keywordLevel === 'bad' ? '#ef4444' : '#e2e8f0',
              borderRadius: 6, padding: '2px 8px',
            }}>
              {keyword}
            </span>
          )}
          {dd && (
            <span style={{ fontSize: '1.3rem', color: 'var(--muted)' }}>
              ATH 대비 {dd.drawdown.toFixed(1)}% 낙폭
            </span>
          )}
        </div>

        {comment && <CommentBox keyword={comment.keyword} text={comment.text} level={commentLevel} />}
      </div>

      {/* 단기 차트 - 1m/3m/6m */}
      {!isMobile && (
        <div>
          <RangeTabs ranges={SHORT_RANGES} selected={shortRange} onChange={setShortRange} />
          <StockLineChart
            symbol={ticker} color={color}
            range={rangeMap[shortRange]}
            height={120} formatValue={fmt}
            tickCount={5}
            formatYAxis={fmtYAxis}
          />
        </div>
      )}

      {/* 장기 차트 - 1y/3y/5y */}
      <div>
        <RangeTabs ranges={LONG_RANGES} selected={longRange} onChange={setLongRange} />
        <StockLineChart
          symbol={ticker} color={color}
          range={rangeMap[longRange]}
          height={isMobile ? 200 : 120} formatValue={fmt}
          tickCount={10}
          formatYAxis={fmtYAxis}
        />
      </div>
    </div>
  )
}

function RangeTabs<T extends string>({ ranges, selected, onChange }: {
  ranges: readonly T[]
  selected: T
  onChange: (r: T) => void
}) {
  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
      {ranges.map(r => (
        <button key={r} onClick={() => onChange(r)} style={{
          fontSize: '1.3rem', padding: '2px 7px', borderRadius: 4,
          border: `1px solid ${selected === r ? 'var(--accent)' : 'var(--border)'}`,
          background: selected === r ? 'var(--accent)' : 'transparent',
          color: selected === r ? '#fff' : 'var(--muted)',
          cursor: 'pointer', fontWeight: selected === r ? 700 : 400,
        }}>
          {r.toUpperCase()}
        </button>
      ))}
    </div>
  )
}