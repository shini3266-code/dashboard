'use client'
import { useState, useEffect } from 'react'
import Watchlist from '@/components/Watchlist'
import StockLineChart from '@/components/LineChart'
import FearGreedGauge from '@/components/FearGreedGauge'
import LiquidityCharts from '@/components/LiquidityCharts'
import UnemploymentCharts from '@/components/UnemploymentCharts'
import SectorFlow from '@/components/SectorFlow'
import MarketHeatmap from '@/components/MarketHeatmap'
import EventCalendar from '@/components/EventCalendar'

interface QuoteData {
  symbol: string
  price: number
  change: number
}

interface FredData {
  value: number | null
}

async function fetchQuote(symbol: string): Promise<QuoteData | null> {
  try {
    const res = await fetch(`/api/quote?symbol=${symbol}`)
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

async function fetchFred(series: string): Promise<FredData | null> {
  try {
    const res = await fetch(`/api/fred?series=${series}`)
    if (!res.ok) return null
    const data = await res.json()
    const obs = data.observations?.filter((o: any) => o.value !== '.')
    const value = obs?.length ? parseFloat(obs[0].value) : null
    return { value }
  } catch { return null }
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)',
      letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10,
      marginTop: 28,
    }}>
      {children}
    </div>
  )
}

// 가격 + 차트 카드
function PriceChartRow({ ticker, label, color, unit = '$', sub, data, formatValue }: {
  ticker: string
  label: string
  color: string
  unit?: string
  sub?: string
  data: QuoteData | null
  formatValue?: (v: number) => string
}) {
  const isUp = (data?.change ?? 0) >= 0
  const fmt = formatValue ?? ((v: number) => `${unit}${v.toLocaleString()}`)

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '180px 1fr 2fr',
      gap: 12,
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '16px',
      marginBottom: 8,
      alignItems: 'center',
    }}>
      {/* 가격 */}
      <div>
        <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)', marginBottom: 2 }}>{ticker}</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 10 }}>{label}</div>
        <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--mono)', lineHeight: 1 }}>
          {data ? `${unit}${data.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '--'}
        </div>
        <div style={{
          fontSize: 13, fontFamily: 'var(--mono)', marginTop: 6,
          color: isUp ? 'var(--up)' : 'var(--down)',
        }}>
          {data ? `${isUp ? '▲ +' : '▼ '}${data.change.toFixed(2)}%` : '--'}
        </div>
        {sub && <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>{sub}</div>}
      </div>

      {/* 1개월 차트 */}
      <div>
        <div style={{ fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--muted)', marginBottom: 4 }}>1개월</div>
        <StockLineChart
          symbol={ticker}
          color={color}
          range="1mo"
          height={90}
          formatValue={fmt}
        />
      </div>

      {/* 1년 차트 */}
      <div>
        <div style={{ fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--muted)', marginBottom: 4 }}>1년</div>
        <StockLineChart
          symbol={ticker}
          color={color}
          range="1y"
          height={90}
          formatValue={fmt}
        />
      </div>
    </div>
  )
}

// 매크로 가격 + 차트 한줄 (FRED)
function FredChartRow({ series, label, desc, color, unit = '%' }: {
  series: string
  label: string
  desc?: string
  color: string
  unit?: string
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

  const min = data.length ? Math.min(...data.map(d => d.value)) : 0
  const max = data.length ? Math.max(...data.map(d => d.value)) : 1
  const padding = (max - min) * 0.1

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '200px 1fr',
      gap: 16,
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '16px',
      marginBottom: 8,
      alignItems: 'center',
    }}>
      <div>
        <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)', marginBottom: 2, letterSpacing: '0.08em' }}>{series}</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 10 }}>{label}</div>
        <div style={{
          fontSize: 26, fontWeight: 700, fontFamily: 'var(--mono)', lineHeight: 1,
          color: latest !== null && latest < 0 ? 'var(--down)' : 'var(--text)',
        }}>
          {latest !== null ? fmt(latest) : '--'}
        </div>
        {change !== null && (
          <div style={{
            fontSize: 13, fontFamily: 'var(--mono)', marginTop: 6,
            color: isUp ? 'var(--up)' : 'var(--down)',
          }}>
            {isUp ? '▲ +' : '▼ '}{fmt(Math.abs(change))}
          </div>
        )}
        {desc && <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4, lineHeight: 1.5 }}>{desc}</div>}
      </div>

      {/* 인라인 미니 차트 */}
      {data.length > 0 && (
        <StockLineChart
          symbol={series}
          color={color}
          range="1y"
          height={110}
          formatValue={(v) => fmt(v)}
          externalData={data}
        />
      )}
    </div>
  )
}

export default function Page() {
  const [quotes, setQuotes] = useState<Record<string, QuoteData | null>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAll() {
      setLoading(true)
      const quoteSymbols = ['SPY', 'QQQ', 'SOXX', 'GC=F', 'BTC-USD', 'KRW=X', 'CL=F', 'DX-Y.NYB', '^VIX']
      const results = await Promise.all(quoteSymbols.map(s => fetchQuote(s)))
      const quoteMap: Record<string, QuoteData | null> = {}
      quoteSymbols.forEach((s, i) => { quoteMap[s] = results[i] })
      setQuotes(quoteMap)
      setLoading(false)
    }
    loadAll()
    const interval = setInterval(loadAll, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>

      {/* 헤더 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 32, paddingBottom: 16, borderBottom: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, background: 'var(--accent)', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--mono)', fontWeight: 700, color: '#fff'
          }}>M</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Market Monitor</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>REAL-TIME FINANCIAL DASHBOARD</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontFamily: 'var(--mono)', color: loading ? 'var(--muted)' : 'var(--up)' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: loading ? 'var(--muted)' : 'var(--up)', animation: loading ? 'none' : 'pulse 2s infinite' }} />
          {loading ? 'LOADING...' : 'LIVE'}
        </div>
      </div>

      {/* 관심종목 */}
      <SectionLabel>⭐ 관심종목</SectionLabel>
      <Watchlist />

      {/* 이벤트 캘린더 */}
      <SectionLabel>📅 이벤트 캘린더</SectionLabel>
      <EventCalendar />

      {/* ETF */}
      <SectionLabel>📊 글로벌 ETF</SectionLabel>
      <PriceChartRow ticker="SPY" label="S&P 500 ETF" color="#8b5cf6" data={quotes['SPY']} />
      <PriceChartRow ticker="QQQ" label="나스닥 100 ETF" color="#3b82f6" data={quotes['QQQ']} />
      <PriceChartRow ticker="SOXX" label="반도체 ETF" color="#06b6d4" data={quotes['SOXX']} />

      {/* 안전자산 & 위험자산 */}
      <SectionLabel>🏅 안전자산 & 위험자산</SectionLabel>
      <PriceChartRow ticker="GC=F" label="금 Gold" color="#f59e0b" unit="$" sub="USD / 온스" data={quotes['GC=F']} />
      <PriceChartRow ticker="BTC-USD" label="비트코인" color="#f97316" unit="$" sub="BTC / USD" data={quotes['BTC-USD']} />
      <PriceChartRow ticker="CL=F" label="WTI 원유" color="#10b981" unit="$" sub="USD / 배럴" data={quotes['CL=F']} />
      <PriceChartRow ticker="KRW=X" label="원달러 환율" color="#6366f1" unit="" sub="KRW / USD" data={quotes['KRW=X']} formatValue={(v) => v.toLocaleString()} />

      {/* 매크로 */}
      <SectionLabel>🌐 매크로 지표</SectionLabel>
      <FredChartRow series="T10Y2Y" label="장단기 금리차 (10Y-2Y)" desc="음수 = 역전 = 경기침체 선행신호" color="#ef4444" />
      <FredChartRow series="DGS10" label="10년물 미국채 금리" desc="미국 장기금리 기준" color="#3b82f6" />
      <PriceChartRow ticker="DX-Y.NYB" label="달러 인덱스 (DXY)" color="#f59e0b" unit="" data={quotes['DX-Y.NYB']} formatValue={(v) => v.toFixed(2)} />

      {/* 시장 심리 */}
      <SectionLabel>😱 시장 심리</SectionLabel>
      <FearGreedGauge />
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 10, padding: 20, marginBottom: 8,
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)', marginBottom: 8 }}>VIX 변동성 지수</div>
            <div style={{
              fontSize: 48, fontWeight: 700, fontFamily: 'var(--mono)', lineHeight: 1,
              color: (quotes['^VIX']?.price ?? 0) >= 30 ? 'var(--down)' : (quotes['^VIX']?.price ?? 0) >= 20 ? 'var(--gold)' : 'var(--up)'
            }}>
              {quotes['^VIX'] ? quotes['^VIX']!.price.toFixed(2) : '--'}
            </div>
            <div style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--muted)', marginTop: 8 }}>
              {(quotes['^VIX']?.price ?? 0) >= 30 ? '🚨 경계 — 시장 패닉'
                : (quotes['^VIX']?.price ?? 0) >= 20 ? '⚠ 주의 — 변동성 확대'
                : '😌 안정 — 정상 범위'}
            </div>
          </div>
          <StockLineChart symbol="^VIX" color="#f59e0b" range="1y" height={110} formatValue={(v) => v.toFixed(1)} />
        </div>
      </div>

      {/* 연준 유동성 */}
      <SectionLabel>💧 연준 유동성</SectionLabel>
      <FredChartRow series="WALCL" label="연준 총자산 (대차대조표)" desc="QE = 자산 증가 · QT = 자산 감소" color="#3b82f6" unit="B" />
      <FredChartRow series="WRESBAL" label="연준 지급준비금" desc="은행 시스템 총 준비금 · 3조달러 이상 안전" color="#8b5cf6" unit="B" />
      <FredChartRow series="RRPONTSYD" label="역레포 잔액 (RRP)" desc="초과유동성 흡수액 · 감소 = 시장으로 유동성 유입" color="#f59e0b" unit="B" />
      <FredChartRow series="WTREGEN" label="TGA 잔고 (재무부 일반계정)" desc="감소 = 유동성 공급 · 증가 = 유동성 흡수" color="#10b981" unit="B" />

      {/* 고용 */}
      <SectionLabel>👷 고용 지표</SectionLabel>
      <UnemploymentCharts />

      {/* 섹터별 자금흐름 */}
      <SectionLabel>🏭 섹터별 자금 흐름</SectionLabel>
      <SectorFlow />

      {/* 미국 증시 히트맵 */}
      <SectionLabel>🗺️ 미국 증시 히트맵</SectionLabel>
      <MarketHeatmap />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </main>
  )
}