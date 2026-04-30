'use client'
import { useState, useEffect } from 'react'
import Watchlist from '@/components/Watchlist'
import StockLineChart from '@/components/LineChart'
import FearGreedGauge from '@/components/FearGreedGauge'
import LiquidityCharts from '@/components/LiquidityCharts'
import UnemploymentCharts from '@/components/UnemploymentCharts'
import SectorFlow from '@/components/SectorFlow'
import MarketHeatmap from '@/components/MarketHeatmap'

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

function QuoteCard({ label, ticker, data, unit = '$', sub }: {
  label: string
  ticker: string
  data: QuoteData | null
  unit?: string
  sub?: string
}) {
  const isUp = (data?.change ?? 0) >= 0
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '14px 16px',
    }}>
      <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)', marginBottom: 2 }}>{ticker}</div>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--mono)' }}>
        {data ? `${unit}${data.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '--'}
      </div>
      <div style={{ fontSize: 12, fontFamily: 'var(--mono)', color: isUp ? 'var(--up)' : 'var(--down)', marginTop: 4 }}>
        {data ? `${isUp ? '▲ +' : '▼ '}${data.change.toFixed(2)}%` : '--'}
      </div>
      {sub && <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function FredCard({ label, data, unit = '%', desc }: {
  label: string
  data: FredData | null
  unit?: string
  desc?: string
}) {
  const num = data?.value ?? null

  function formatNum(n: number, unit: string) {
    if (unit === 'B') {
      // 소수점 없애고 콤마
      return Math.round(n).toLocaleString() + 'B'
    }
    return n.toFixed(2) + unit
  }

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '14px 16px',
    }}>
      <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)', marginBottom: 4 }}>{label}</div>
      <div style={{
        fontSize: 20, fontWeight: 700, fontFamily: 'var(--mono)',
        color: num !== null && num < 0 ? 'var(--down)' : 'var(--text)',
      }}>
        {num !== null ? formatNum(num, unit) : '--'}
      </div>
      {desc && <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4, fontFamily: 'var(--mono)' }}>{desc}</div>}
    </div>
  )
}

function FearGreed() {
  const [score, setScore] = useState<number | null>(null)
  const [rating, setRating] = useState('')

  useEffect(() => {
    fetch('/api/feargreed')
      .then(r => r.json())
      .then(d => {
        setScore(d.score)
        setRating(d.rating)
      })
      .catch(() => {})
  }, [])

  const color = score === null ? 'var(--muted)'
    : score < 25 ? 'var(--down)'
    : score < 45 ? '#f97316'
    : score < 55 ? 'var(--gold)'
    : score < 75 ? '#84cc16'
    : 'var(--up)'

  const label = score === null ? '--'
    : score < 25 ? '극단적 공포'
    : score < 45 ? '공포'
    : score < 55 ? '중립'
    : score < 75 ? '탐욕'
    : '극단적 탐욕'

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 56, fontWeight: 700, fontFamily: 'var(--mono)', color }}>
        {score ?? '--'}
      </div>
      <div style={{ fontSize: 14, fontFamily: 'var(--mono)', color, marginTop: 4 }}>{label}</div>
      <div style={{
        width: '100%', height: 8, borderRadius: 4, marginTop: 16,
        background: 'linear-gradient(to right, #ef4444, #f59e0b, #22c55e)',
        position: 'relative'
      }}>
        {score !== null && (
          <div style={{
            position: 'absolute', top: -4, left: `${score}%`,
            width: 3, height: 16, background: '#fff',
            borderRadius: 2, transform: 'translateX(-50%)'
          }} />
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)' }}>
        <span>극단적 공포</span>
        <span>중립</span>
        <span>극단적 탐욕</span>
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)',
      letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10,
    }}>
      {children}
    </div>
  )
}

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: 8,
  marginBottom: 28,
} as React.CSSProperties

export default function Page() {
  const [quotes, setQuotes] = useState<Record<string, QuoteData | null>>({})
  const [freds, setFreds] = useState<Record<string, FredData | null>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAll() {
      setLoading(true)

      const quoteSymbols = ['QQQ', 'SPY', 'SOXX', 'GC=F', 'BTC-USD', 'KRW=X', 'CL=F', 'DX-Y.NYB', '^VIX']
      const fredSeries = ['T10Y2Y', 'DGS10', 'WALCL', 'WRESBAL', 'RRPONTSYD', 'WTREGEN']

      const [quoteResults, fredResults] = await Promise.all([
        Promise.all(quoteSymbols.map(s => fetchQuote(s))),
        Promise.all(fredSeries.map(s => fetchFred(s))),
      ])

      const quoteMap: Record<string, QuoteData | null> = {}
      quoteSymbols.forEach((s, i) => { quoteMap[s] = quoteResults[i] })

      const fredMap: Record<string, FredData | null> = {}
      fredSeries.forEach((s, i) => { fredMap[s] = fredResults[i] })

      setQuotes(quoteMap)
      setFreds(fredMap)
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
  
      {/* ETF — 가격 3열 */}
      <SectionLabel>📊 글로벌 ETF</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 8 }}>
        {[
          { ticker: 'SPY', label: 'S&P 500 ETF' },
          { ticker: 'QQQ', label: '나스닥 100 ETF' },
          { ticker: 'SOXX', label: '반도체 ETF' },
        ].map(({ ticker, label }) => (
          <QuoteCard key={ticker} label={label} ticker={ticker} data={quotes[ticker]} />
        ))}
      </div>
  
      {/* ETF — 차트 */}
      <SectionLabel>📊 글로벌 ETF</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 28 }}>
      {[
        { sym: 'SPY', color: '#8b5cf6' },
        { sym: 'QQQ', color: '#3b82f6' },
        { sym: 'SOXX', color: '#06b6d4' },
      ].map(({ sym, color }) => (
        <div key={sym} style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '12px 16px',
        }}>
          <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)', marginBottom: 8 }}>
            {sym} · 1Y
          </div>
          <StockLineChart
            symbol={sym}
            color={color}
            range="1y"
            height={180}
            formatValue={(v) => `$${v.toLocaleString()}`}
          />
        </div>
      ))}
    </div>
  
      {/* 자산 — 가격 3열 */}
      <SectionLabel>🏅 안전자산 & 위험자산</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 8 }}>
        <QuoteCard label="금 Gold" ticker="GC=F" data={quotes['GC=F']} sub="USD / 온스" />
        <QuoteCard label="비트코인" ticker="BTC-USD" data={quotes['BTC-USD']} />
        <QuoteCard label="WTI 원유" ticker="CL=F" data={quotes['CL=F']} sub="USD / 배럴" />
      </div>
  
      {/* 자산 — 차트 */}
      <SectionLabel>🏅 안전자산 & 위험자산</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 28 }}>
      {[
        { sym: 'GC=F',    label: '금',      color: '#f59e0b', fmt: (v: number) => `$${v.toLocaleString()}` },
        { sym: 'BTC-USD', label: '비트코인', color: '#f97316', fmt: (v: number) => `$${v.toLocaleString()}` },
        { sym: 'CL=F',    label: 'WTI 원유', color: '#10b981', fmt: (v: number) => `$${v.toFixed(1)}` },
      ].map(({ sym, label, color, fmt }) => (
        <div key={sym} style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '12px 16px',
        }}>
          <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)', marginBottom: 8 }}>
            {label} · 1Y
          </div>
          <StockLineChart
            symbol={sym}
            color={color}
            range="1y"
            height={180}
            formatValue={fmt}
          />
        </div>
      ))}
    </div>
  
      {/* 매크로 지표 — 가격만 4열 */}
      <SectionLabel>🌐 매크로 지표</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 28 }}>
        <FredCard label="장단기 금리차 (10Y-2Y)" data={freds['T10Y2Y']} desc="음수 = 역전" />
        <FredCard label="10년물 미국채" data={freds['DGS10']} desc="미국 장기금리" />
        <QuoteCard label="달러 인덱스 (DXY)" ticker="DX-Y.NYB" data={quotes['DX-Y.NYB']} unit="" />
        <QuoteCard label="원달러 환율" ticker="KRW=X" data={quotes['KRW=X']} unit="" sub="KRW / USD" />
      </div>
  
      <SectionLabel>😱 시장 심리</SectionLabel>
      <FearGreedGauge />

      {/* VIX */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 10, padding: 20, marginBottom: 28,
      }}>
        <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)', marginBottom: 8 }}>VIX 변동성 지수</div>
        <div style={{
          fontSize: 42, fontWeight: 700, fontFamily: 'var(--mono)',
          color: (quotes['^VIX']?.price ?? 0) >= 30 ? 'var(--down)' : (quotes['^VIX']?.price ?? 0) >= 20 ? 'var(--gold)' : 'var(--up)'
        }}>
          {quotes['^VIX'] ? quotes['^VIX']!.price.toFixed(2) : '--'}
        </div>
        <div style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--muted)', marginTop: 8 }}>
          {(quotes['^VIX']?.price ?? 0) >= 30 ? '🚨 경계 — 시장 패닉' : (quotes['^VIX']?.price ?? 0) >= 20 ? '⚠ 주의 — 변동성 확대' : '😌 안정 — 정상 범위'}
        </div>
        <div style={{ marginTop: 16 }}>
          <StockLineChart symbol="^VIX" color="#f59e0b" range="1y" height={140} formatValue={(v) => v.toFixed(1)} />
        </div>
      </div>
  
      {/* 연준 유동성 */}
      <SectionLabel>💧 연준 유동성</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 28 }}>
        <FredCard label="연준 총자산" data={freds['WALCL']} unit="B" desc="QE/QT 규모" />
        <FredCard label="지급준비금" data={freds['WRESBAL']} unit="B" desc="은행 시스템 총 준비금" />
        <FredCard label="역레포 잔액" data={freds['RRPONTSYD']} unit="B" desc="초과유동성 흡수액" />
        <FredCard label="TGA 잔고" data={freds['WTREGEN']} unit="B" desc="재무부 일반계정" />
      </div>
      <LiquidityCharts />

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