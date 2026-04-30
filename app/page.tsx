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

// ATH 낙폭 (ETF, 자산)
function getDrawdownComment(current: number | null, high: number | null) {
  if (!current || !high) return null
  const drawdown = ((current - high) / high) * 100
  const status = drawdown >= -2 ? '강세장'
    : drawdown >= -10 ? '조정 초입'
    : drawdown >= -20 ? '조정장'
    : drawdown >= -30 ? '약세장'
    : '급락장'
  const comment = drawdown >= -2 ? '전고점 근처예요. 강세장이에요.'
    : drawdown >= -10 ? '소폭 조정 중이에요. 매수 기회를 탐색할 구간이에요.'
    : drawdown >= -20 ? '조정 구간이에요. 리스크 관리가 필요해요.'
    : drawdown >= -30 ? '약세장이에요. 방어적 접근이 필요해요.'
    : '급락 구간이에요. 현금 비중을 높이세요.'
  return { drawdown, status, comment }
}

// 장단기 금리차
function getYieldComment(val: number | null) {
  if (val === null) return null
  if (val < 0) return `${val.toFixed(2)}% — 역전 중이에요. 경기침체 선행신호예요. 역전 해소 시점을 주목하세요.`
  if (val < 0.5) return `${val.toFixed(2)}% — 역전에서 막 회복됐어요. 실제 침체는 역전 해소 후 올 수 있어요.`
  return `${val.toFixed(2)}% — 정상 구간이에요. 장기금리가 단기금리보다 높아요.`
}

// 10년물 금리
function getBondComment(val: number | null) {
  if (val === null) return null
  if (val >= 5) return `${val.toFixed(2)}% — 고금리 구간이에요. 주식 밸류에이션 압박이 커요.`
  if (val >= 4) return `${val.toFixed(2)}% — 제한적 구간이에요. 성장주에 부담이에요.`
  if (val >= 3) return `${val.toFixed(2)}% — 중립 구간이에요. 시장 영향은 제한적이에요.`
  return `${val.toFixed(2)}% — 저금리 구간이에요. 성장주에 유리해요.`
}

// 달러인덱스
function getDxyComment(val: number | null) {
  if (val === null) return null
  if (val >= 105) return `${val.toFixed(2)} — 강달러 구간이에요. 신흥국·원자재에 부담이에요.`
  if (val >= 100) return `${val.toFixed(2)} — 달러 강세예요. 글로벌 유동성 위축 압력이 있어요.`
  if (val >= 95) return `${val.toFixed(2)} — 중립 구간이에요.`
  return `${val.toFixed(2)} — 달러 약세예요. 위험자산·신흥국에 우호적이에요.`
}

// 원달러 환율
function getKrwComment(val: number | null) {
  if (val === null) return null
  if (val >= 1400) return `${Math.round(val)}원 — 원화 약세 구간이에요. 외국인 자금유출 압력이 있어요.`
  if (val >= 1300) return `${Math.round(val)}원 — 원화 소폭 약세예요. 환율 변동성에 주의하세요.`
  return `${Math.round(val)}원 — 원화 강세 구간이에요. 외국인 자금유입에 우호적이에요.`
}

// 금
function getGoldComment(current: number | null, high: number | null) {
  if (!current || !high) return null
  const dd = ((current - high) / high) * 100
  if (dd >= -2) return `$${Math.round(current).toLocaleString()} — ATH 근처예요. 안전자산 수요가 강해요.`
  if (dd >= -10) return `$${Math.round(current).toLocaleString()} — ATH 대비 ${dd.toFixed(1)}%. 소폭 조정 중이에요.`
  return `$${Math.round(current).toLocaleString()} — ATH 대비 ${dd.toFixed(1)}%. 달러 강세·금리 상승 압력이에요.`
}

// 비트코인
function getBtcComment(current: number | null, high: number | null) {
  if (!current || !high) return null
  const dd = ((current - high) / high) * 100
  if (dd >= -10) return `$${Math.round(current).toLocaleString()} — ATH 근처예요. 위험선호 심리가 강해요.`
  if (dd >= -30) return `$${Math.round(current).toLocaleString()} — ATH 대비 ${dd.toFixed(1)}%. 조정 구간이에요.`
  return `$${Math.round(current).toLocaleString()} — ATH 대비 ${dd.toFixed(1)}%. 하락장이에요. 유동성 수축 주의.`
}

// WTI 원유
function getOilComment(val: number | null) {
  if (val === null) return null
  if (val >= 90) return `$${val.toFixed(1)} — 고유가 구간이에요. 인플레이션 압력이 커요.`
  if (val >= 70) return `$${val.toFixed(1)} — 중립 구간이에요. 경기 회복 수요를 반영해요.`
  return `$${val.toFixed(1)} — 저유가 구간이에요. 경기 둔화 우려가 있어요.`
}

// 연준 총자산
function getFedAssetComment(val: number | null) {
  if (val === null) return null
  const t = val / 1000000 // 조 달러
  if (t >= 8) return `$${t.toFixed(2)}T — 대규모 자산 보유 중이에요. QT 진행 중이에요.`
  if (t >= 7) return `$${t.toFixed(2)}T — QT로 자산이 축소 중이에요. 유동성 위축 압력이 있어요.`
  return `$${t.toFixed(2)}T — 코로나 이전 수준으로 복귀 중이에요.`
}

// 역레포
function getRrpComment(val: number | null) {
  if (val === null) return null
  const b = val / 1000 // 조 달러
  if (val < 100) return `$${Math.round(val)}B — 거의 소진됐어요. 시장 초과유동성이 없어요.`
  if (val < 500) return `$${Math.round(val)}B — 많이 줄었어요. 시장으로 유동성이 유입됐어요.`
  return `$${b.toFixed(2)}T — 아직 초과유동성이 남아있어요.`
}

// TGA
function getTgaComment(val: number | null) {
  if (val === null) return null
  if (val > 700) return `$${Math.round(val)}B — 잔고가 높아요. 지출 시 유동성 공급 가능성이 있어요.`
  if (val > 300) return `$${Math.round(val)}B — 정상 수준이에요.`
  return `$${Math.round(val)}B — 잔고가 낮아요. 부채한도 이슈 주의가 필요해요.`
}

// 실업률
function getUnempComment(val: number | null) {
  if (val === null) return null
  if (val <= 4) return `${val.toFixed(1)}% — 완전고용 수준이에요. 고용시장이 탄탄해요.`
  if (val <= 5) return `${val.toFixed(1)}% — 소폭 상승 중이에요. 고용 냉각 신호를 모니터링하세요.`
  return `${val.toFixed(1)}% — 고용시장이 악화되고 있어요. 연준 피벗 기대가 커질 수 있어요.`
}

function CommentBox({ text, level }: { text: string | null, level?: 'good' | 'warn' | 'bad' | 'neutral' }) {
  if (!text) return null
  const color = level === 'good' ? 'var(--up)'
    : level === 'warn' ? 'var(--gold)'
    : level === 'bad' ? 'var(--down)'
    : 'var(--muted)'
  const border = level === 'good' ? 'var(--up)'
    : level === 'warn' ? 'var(--gold)'
    : level === 'bad' ? 'var(--down)'
    : 'var(--border)'
  return (
    <div style={{
      marginTop: 8,
      background: 'var(--surface2)',
      borderRadius: 6,
      padding: '6px 8px',
      borderLeft: `2px solid ${border}`,
    }}>
      <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color, lineHeight: 1.6 }}>
        {text}
      </div>
    </div>
  )
}

// 가격 + 차트 카드
function PriceChartRow({ ticker, label, color, unit = '$', sub, data, formatValue, showDrawdown = false }: {
  ticker: string
  label: string
  color: string
  unit?: string
  sub?: string
  data: QuoteData | null
  formatValue?: (v: number) => string
  showDrawdown?: boolean  // ← 추가
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
  const dd = showDrawdown ? getDrawdownComment(ticker, data?.price ?? null, high) : null

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '200px 1fr 2fr',
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

        {/* ATH 낙폭 + 멘트 */}
        {dd && (
          <div style={{
            marginTop: 10,
            background: 'var(--surface2)',
            borderRadius: 6,
            padding: '6px 8px',
            borderLeft: `2px solid ${dd.drawdown >= -2 ? 'var(--up)' : dd.drawdown >= -10 ? 'var(--gold)' : 'var(--down)'}`,
          }}>
            <div style={{
              fontSize: 11, fontFamily: 'var(--mono)', fontWeight: 700,
              color: dd.drawdown >= -2 ? 'var(--up)' : dd.drawdown >= -10 ? 'var(--gold)' : 'var(--down)',
            }}>
              {dd.status} {dd.drawdown.toFixed(1)}%
            </div>
            <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)', marginTop: 2, lineHeight: 1.5 }}>
              ATH 대비 {dd.drawdown.toFixed(1)}% 낙폭. {dd.comment}
            </div>
          </div>
        )}
      </div>

      {/* 1개월 차트 */}
      <div>
        <div style={{ fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--muted)', marginBottom: 4 }}>1개월</div>
        <StockLineChart symbol={ticker} color={color} range="1mo" height={90} formatValue={fmt} />
      </div>

      {/* 1년 차트 */}
      <div>
        <div style={{ fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--muted)', marginBottom: 4 }}>1년</div>
        <StockLineChart symbol={ticker} color={color} range="1y" height={90} formatValue={fmt} />
      </div>
    </div>
  )
}

// 매크로 가격 + 차트 한줄 (FRED)
function FredChartRow({ series, label, desc, color, unit = '%', getComment }: {
  series: string
  label: string
  desc?: string
  color: string
  unit?: string
  getComment?: (val: number | null) => string | null  // ← 추가
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
  function getLevel(val: number | null): 'good' | 'warn' | 'bad' | 'neutral' {
    if (!val) return 'neutral'
    if (series === 'T10Y2Y') return val < 0 ? 'bad' : val < 0.5 ? 'warn' : 'good'
    if (series === 'DGS10') return val >= 5 ? 'bad' : val >= 4 ? 'warn' : 'good'
    if (series === 'WALCL') return 'neutral'
    if (series === 'RRPONTSYD') return val < 100 ? 'warn' : 'neutral'
    if (series === 'WTREGEN') return val < 300 ? 'warn' : 'neutral'
    return 'neutral'
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '200px 1fr 2fr',
      gap: 12,
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
          fontSize: 24, fontWeight: 700, fontFamily: 'var(--mono)', lineHeight: 1,
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

        {/* 멘트 */}
        {getComment && <CommentBox text={getComment(latest)} level={getLevel(latest)} />}
      </div>

      <div>
        <div style={{ fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--muted)', marginBottom: 4 }}>1개월</div>
        <StockLineChart symbol={series} color={color} range="1mo" height={90} formatValue={fmt} externalData={data1mo} />
      </div>
      <div>
        <div style={{ fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--muted)', marginBottom: 4 }}>1년</div>
        <StockLineChart symbol={series} color={color} range="1y" height={90} formatValue={fmt} externalData={data1y} />
      </div>
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
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 24, zoom: 1.1 }}>

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
      <PriceChartRow ticker="SPY" label="S&P 500 ETF" color="#8b5cf6" data={quotes['SPY']} showDrawdown />
      <PriceChartRow ticker="QQQ" label="나스닥 100 ETF" color="#3b82f6" data={quotes['QQQ']} showDrawdown />
      <PriceChartRow ticker="SOXX" label="반도체 ETF" color="#06b6d4" data={quotes['SOXX']} showDrawdown />

      {/* 안전자산 & 위험자산 */}
      <SectionLabel>🏅 안전자산 & 위험자산</SectionLabel>
      <PriceChartRow ticker="GC=F" label="금 Gold" color="#f59e0b" unit="$" sub="USD / 온스" data={quotes['GC=F']} showDrawdown />
      <PriceChartRow ticker="BTC-USD" label="비트코인" color="#f97316" unit="$" data={quotes['BTC-USD']} showDrawdown />
      <PriceChartRow ticker="CL=F" label="WTI 원유" color="#10b981" unit="$" data={quotes['CL=F']} />
      <PriceChartRow ticker="KRW=X" label="원달러 환율" color="#6366f1" unit="" data={quotes['KRW=X']} formatValue={(v) => v.toLocaleString()} />

      {/* 매크로 */}
      <SectionLabel>🌐 매크로 지표</SectionLabel>
      <FredChartRow series="T10Y2Y" label="장단기 금리차 (10Y-2Y)" color="#ef4444" getComment={getYieldComment} />
      <FredChartRow series="DGS10" label="10년물 미국채 금리" color="#3b82f6" getComment={getBondComment} />
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
      <FredChartRow series="WALCL" label="연준 총자산" color="#3b82f6" unit="B" getComment={getFedAssetComment} />
      <FredChartRow series="WRESBAL" label="연준 지급준비금" color="#8b5cf6" unit="B" getComment={(v) => v ? `$${Math.round(v).toLocaleString()}B — ${v > 3000000 ? '충분한 수준이에요.' : v > 2000000 ? '감소 중이에요. 주의가 필요해요.' : '위험 수준이에요. QT 중단 가능성이 있어요.'}` : null} />
      <FredChartRow series="RRPONTSYD" label="역레포 잔액 (RRP)" color="#f59e0b" unit="B" getComment={getRrpComment} />
      <FredChartRow series="WTREGEN" label="TGA 잔고" color="#10b981" unit="B" getComment={getTgaComment} />

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