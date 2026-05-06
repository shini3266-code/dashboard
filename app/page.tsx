'use client'
import { useState, useEffect } from 'react'
import Watchlist from '@/components/Watchlist'
import StockLineChart from '@/components/LineChart'
import FearGreedGauge from '@/components/FearGreedGauge'
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

const COLORS = {
  etf: '#38bdf8',
  asset: '#f59e0b',
  macro: '#22c55e',
  fear: '#ef4444',
  liquidity: '#3b82f6',
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

// ── 레벨 함수 ──────────────────────────────────────
function getOilLevel(val: number) {
  if (val >= 90) return { keyword: '고유가', level: 'bad' as const }
  if (val >= 70) return { keyword: '중립', level: 'neutral' as const }
  return { keyword: '저유가', level: 'warn' as const }
}

function getKrwLevel(val: number) {
  if (val >= 1400) return { keyword: '원화 약세', level: 'bad' as const }
  if (val >= 1300) return { keyword: '주의', level: 'warn' as const }
  return { keyword: '원화 강세', level: 'good' as const }
}

function getDxyLevel(val: number) {
  if (val >= 105) return { keyword: '강달러', level: 'bad' as const }
  if (val >= 100) return { keyword: '달러 강세', level: 'warn' as const }
  if (val >= 95) return { keyword: '중립', level: 'neutral' as const }
  return { keyword: '달러 약세', level: 'good' as const }
}

// ── 멘트 함수 ──────────────────────────────────────
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
  const level = drawdown >= -2 ? 'good' as const
    : drawdown >= -10 ? 'warn' as const
    : 'bad' as const
  return { drawdown, status, comment, level }
}

function getYieldComment(val: number | null) {
  if (val === null) return null
  if (val < 0) return { keyword: '역전', text: `경기침체 선행신호예요. 역전 해소 시점을 주목하세요.` }
  if (val < 0.5) return { keyword: '회복 초입', text: `실제 침체는 역전 해소 후 올 수 있어요.` }
  return { keyword: '정상', text: `장기금리가 단기금리보다 높아요.` }
}

function getBondComment(val: number | null) {
  if (val === null) return null
  if (val >= 5) return { keyword: '고금리', text: `주식 밸류에이션 압박이 커요.` }
  if (val >= 4) return { keyword: '제한적', text: `성장주에 부담이에요.` }
  if (val >= 3) return { keyword: '중립', text: `시장 영향은 제한적이에요.` }
  return { keyword: '저금리', text: `성장주에 유리해요.` }
}

function getDxyComment(val: number | null) {
  if (val === null) return null
  const { keyword } = getDxyLevel(val)
  if (val >= 105) return { keyword, text: `신흥국·원자재에 부담이에요.` }
  if (val >= 100) return { keyword, text: `글로벌 유동성 위축 압력이 있어요.` }
  if (val >= 95) return { keyword, text: `달러 방향성이 중립이에요.` }
  return { keyword, text: `위험자산·신흥국에 우호적이에요.` }
}

function getOilComment(val: number | null) {
  if (val === null) return null
  const { keyword } = getOilLevel(val)
  if (val >= 90) return { keyword, text: `인플레이션 압력이 커요.` }
  if (val >= 70) return { keyword, text: `경기 회복 수요를 반영해요.` }
  return { keyword, text: `경기 둔화 우려가 있어요.` }
}

function getKrwComment(val: number | null) {
  if (val === null) return null
  const { keyword } = getKrwLevel(val)
  if (val >= 1400) return { keyword, text: `외국인 자금유출 압력이 있어요.` }
  if (val >= 1300) return { keyword, text: `환율 변동성에 주의하세요.` }
  return { keyword, text: `외국인 자금유입에 우호적이에요.` }
}

function getFedAssetComment(val: number | null) {
  if (val === null) return null
  const t = val / 1000000
  if (t >= 8) return { keyword: 'QT 진행 중', text: `대규모 자산 보유 중이에요.` }
  if (t >= 7) return { keyword: 'QT 중반', text: `코로나 고점 대비 많이 줄었어요.` }
  if (t >= 6) return { keyword: 'QT 후반', text: `코로나 이전 수준에 근접하고 있어요.` }
  return { keyword: '정상화', text: `코로나 이전 수준으로 복귀했어요.` }
}

function getReservesComment(val: number | null) {
  if (val === null) return null
  const b = Math.round(val / 1000)
  if (val > 3000000) return { keyword: '충분', text: `은행 시스템이 안정적이에요.` }
  if (val > 2500000) return { keyword: '양호', text: `아직 안전 수준이에요.` }
  if (val > 2000000) return { keyword: '주의', text: `감소 추세예요. 모니터링이 필요해요.` }
  return { keyword: '위험', text: `QT 중단 가능성이 있어요.` }
}

function getRrpComment(val: number | null) {
  if (val === null) return null
  if (val < 100) return { keyword: '거의 소진', text: `시장 초과유동성이 없어요.` }
  if (val < 500) return { keyword: '대폭 감소', text: `시장으로 유동성이 유입됐어요.` }
  return { keyword: '잔존', text: `아직 초과유동성이 남아있어요.` }
}

function getTgaComment(val: number | null) {
  if (val === null) return null
  if (val > 800) return { keyword: '잔고 풍부', text: `지출 시 유동성 공급 가능성이 있어요.` }
  if (val > 500) return { keyword: '정상', text: `정상 수준이에요.` }
  if (val > 200) return { keyword: '감소 중', text: `지출이 늘거나 세수가 줄고 있어요.` }
  return { keyword: '부채한도 주의', text: `잔고가 매우 낮아요.` }
}

// ── 공통 컴포넌트 ──────────────────────────────────
function CommentBox({ keyword, text, level = 'neutral' }: {
  keyword?: string
  text: string | null
  level?: 'good' | 'warn' | 'bad' | 'neutral'
}) {
  if (!text) return null
  const color = level === 'good' ? '#22c55e'
    : level === 'warn' ? '#f59e0b'
    : level === 'bad' ? '#ef4444'
    : '#64748b'
  return (
    <div style={{ marginTop: 8 }}>
      {keyword && (
        <div style={{ marginBottom: 4 }}>
          <span style={{
            fontSize: '0.6rem', fontFamily: 'var(--mono)', fontWeight: 700,
            color, border: `1px solid ${color}`, borderRadius: 6, padding: '2px 8px',
          }}>
            {keyword}
          </span>
        </div>
      )}
      <div style={{ fontSize: '0.6rem', fontFamily: 'var(--mono)', color: 'var(--muted)', lineHeight: 1.6 }}>
        {text}
      </div>
    </div>
  )
}

function DrawdownBadge({ dd }: {
  dd: { drawdown: number; status: string; comment: string; level: 'good' | 'warn' | 'bad' } | null
}) {
  if (!dd) return null
  const color = dd.level === 'good' ? '#22c55e' : dd.level === 'warn' ? '#f59e0b' : '#ef4444'
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={{
          fontSize: '0.6rem', fontFamily: 'var(--mono)', fontWeight: 700,
          color, border: `1px solid ${color}`, borderRadius: 6, padding: '2px 8px',
        }}>
          {dd.status}
        </span>
        <span style={{ fontSize: '0.6rem', fontFamily: 'var(--mono)', color: 'var(--muted)' }}>
          ATH 대비 {dd.drawdown.toFixed(1)}% 낙폭
        </span>
      </div>
      <div style={{ fontSize: '0.6rem', fontFamily: 'var(--mono)', color: 'var(--muted)', lineHeight: 1.6 }}>
        {dd.comment}
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: '0.8rem', color: 'var(--text)',
      letterSpacing: '0.12em', textTransform: 'uppercase',
      marginBottom: 10, marginTop: 28,
    }}>
      {children}
    </div>
  )
}

// ── 가격 + 1개월 + 1년 차트 ────────────────────────
function PriceChartRow({ ticker, label, color, unit = '$', sub, data, formatValue, showDrawdown = false, comment, commentLevel }: {
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
      display: 'grid', gridTemplateColumns: '200px 1fr 2fr',
      gap: 12, background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '16px', marginBottom: 8,
    }}>
      <div>
        <div style={{ fontSize: '0.6rem', fontFamily: 'var(--mono)', color: 'var(--muted)', marginBottom: 2 }}>{ticker}</div>
        <div style={{ fontSize: '0.6rem', color: 'var(--muted)', marginBottom: 10 }}>{label}</div>
        <div style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--mono)', lineHeight: 1 }}>
          {data ? `${unit}${data.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '--'}
        </div>
        <div style={{ fontSize: '0.6rem', fontFamily: 'var(--mono)', marginTop: 6, color: isUp ? 'var(--up)' : 'var(--down)' }}>
          {data ? `${isUp ? '▲ +' : '▼ '}${data.change.toFixed(2)}%` : '--'}
        </div>
        {sub && <div style={{ fontSize: '0.6rem', color: 'var(--muted)', marginTop: 4 }}>{sub}</div>}
        {dd && <DrawdownBadge dd={dd} />}
        {comment && <CommentBox keyword={comment.keyword} text={comment.text} level={commentLevel} />}
      </div>
      <div>
        <div style={{ fontSize: '0.5rem', fontFamily: 'var(--mono)', color: 'var(--muted)', marginBottom: 4 }}>1개월</div>
        <StockLineChart symbol={ticker} color={color} range="1mo" height={120} formatValue={fmt} />
      </div>
      <div>
        <div style={{ fontSize: '0.5rem', fontFamily: 'var(--mono)', color: 'var(--muted)', marginBottom: 4 }}>1년</div>
        <StockLineChart symbol={ticker} color={color} range="1y" height={120} formatValue={fmt} />
      </div>
    </div>
  )
}

// ── FRED 가격 + 차트 ────────────────────────────────
function FredChartRow({ series, label, desc, color, unit = '%', getComment }: {
  series: string
  label: string
  desc?: string
  color: string
  unit?: string
  getComment?: (val: number | null) => { keyword: string; text: string } | null
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
      display: 'grid', gridTemplateColumns: '200px 1fr 2fr',
      gap: 12, background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '16px', marginBottom: 8,
    }}>
      <div>
        <div style={{ fontSize: '0.6rem', fontFamily: 'var(--mono)', color: 'var(--muted)', marginBottom: 2, letterSpacing: '0.08em' }}>{series}</div>
        <div style={{ fontSize: '0.6rem', color: 'var(--muted)', marginBottom: 10 }}>{label}</div>
        <div style={{
          fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--mono)', lineHeight: 1,
          color: latest !== null && latest < 0 ? 'var(--down)' : 'var(--text)',
        }}>
          {latest !== null ? fmt(latest) : '--'}
        </div>
        {change !== null && (
          <div style={{ fontSize: '0.6rem', fontFamily: 'var(--mono)', marginTop: 6, color: isUp ? 'var(--up)' : 'var(--down)' }}>
            {isUp ? '▲ +' : '▼ '}{fmt(Math.abs(change))}
          </div>
        )}
        {desc && <div style={{ fontSize: '0.6rem', color: 'var(--muted)', marginTop: 4, lineHeight: 1.5 }}>{desc}</div>}
        {c && <CommentBox keyword={c.keyword} text={c.text} level={getLevel()} />}
      </div>
      <div>
        <div style={{ fontSize: '0.5rem', fontFamily: 'var(--mono)', color: 'var(--muted)', marginBottom: 4 }}>1개월</div>
        <StockLineChart symbol={series} color={color} range="1mo" height={120} formatValue={fmt} externalData={data1mo} />
      </div>
      <div>
        <div style={{ fontSize: '0.5rem', fontFamily: 'var(--mono)', color: 'var(--muted)', marginBottom: 4 }}>1년</div>
        <StockLineChart symbol={series} color={color} range="1y" height={120} formatValue={fmt} externalData={data1y} />
      </div>
    </div>
  )
}

// ── Summary Bar ────────────────────────────────────
function MarketSummaryBar({ quotes, freds }: {
  quotes: Record<string, QuoteData | null>
  freds: Record<string, FredData | null>
}) {
  const items: { label: string; keyword: string; level: 'good' | 'warn' | 'bad' | 'neutral' }[] = []

  ;[{ sym: 'SPY', label: 'SPY' }, { sym: 'QQQ', label: 'QQQ' }, { sym: 'SOXX', label: 'SOXX' }]
    .forEach(({ sym, label }) => {
      const change = quotes[sym]?.change ?? null
      if (change === null) return
      const keyword = change >= 1.5 ? '강세장' : change >= 0 ? '보합' : change >= -1.5 ? '조정 초입' : '조정장'
      const level: 'good' | 'warn' | 'bad' | 'neutral' = change >= 1.5 ? 'good' : change >= 0 ? 'neutral' : change >= -1.5 ? 'warn' : 'bad'
      items.push({ label, keyword, level })
    })

  const goldChange = quotes['GC=F']?.change ?? null
  if (goldChange !== null) {
    const keyword = goldChange >= 1 ? '강세장' : goldChange >= 0 ? '보합' : goldChange >= -1 ? '조정 초입' : '조정장'
    const level: 'good' | 'warn' | 'bad' | 'neutral' = goldChange >= 0 ? 'good' : goldChange >= -1 ? 'neutral' : 'warn'
    items.push({ label: '금', keyword, level })
  }

  const btcChange = quotes['BTC-USD']?.change ?? null
  if (btcChange !== null) {
    const keyword = btcChange >= 3 ? '강세장' : btcChange >= 0 ? '보합' : btcChange >= -3 ? '조정장' : '급락장'
    const level: 'good' | 'warn' | 'bad' | 'neutral' = btcChange >= 0 ? 'good' : btcChange >= -3 ? 'warn' : 'bad'
    items.push({ label: 'BTC', keyword, level })
  }

  const oil = quotes['CL=F']?.price ?? null
  if (oil !== null) {
    const { keyword, level } = getOilLevel(oil)
    items.push({ label: 'WTI', keyword, level })
  }

  const krw = quotes['KRW=X']?.price ?? null
  if (krw !== null) {
    const { keyword, level } = getKrwLevel(krw)
    items.push({ label: '환율', keyword, level })
  }

  const t10y2y = freds['T10Y2Y']?.value ?? null
  if (t10y2y !== null) {
    const keyword = t10y2y < 0 ? '역전' : t10y2y < 0.5 ? '회복 초입' : '정상'
    const level: 'good' | 'warn' | 'bad' | 'neutral' = t10y2y < 0 ? 'bad' : t10y2y < 0.5 ? 'warn' : 'good'
    items.push({ label: '금리차', keyword, level })
  }

  const dgs10 = freds['DGS10']?.value ?? null
  if (dgs10 !== null) {
    const keyword = dgs10 >= 5 ? '고금리' : dgs10 >= 4 ? '제한적' : dgs10 >= 3 ? '중립' : '저금리'
    const level: 'good' | 'warn' | 'bad' | 'neutral' = dgs10 >= 5 ? 'bad' : dgs10 >= 4 ? 'warn' : 'good'
    items.push({ label: '10Y', keyword, level })
  }

  const dxy = quotes['DX-Y.NYB']?.price ?? null
  if (dxy !== null) {
    const { keyword, level } = getDxyLevel(dxy)
    items.push({ label: 'DXY', keyword, level })
  }

  const vix = quotes['^VIX']?.price ?? null
  if (vix !== null) {
    const keyword = vix >= 30 ? '경계' : vix >= 20 ? '주의' : '안정'
    const level: 'good' | 'warn' | 'bad' | 'neutral' = vix >= 30 ? 'bad' : vix >= 20 ? 'warn' : 'good'
    items.push({ label: 'VIX', keyword, level })
  }

  const walcl = freds['WALCL']?.value ?? null
  if (walcl !== null) {
    const t = walcl / 1000000
    const keyword = t >= 8 ? 'QT 진행 중' : t >= 7 ? 'QT 중반' : t >= 6 ? 'QT 후반' : '정상화'
    items.push({ label: '연준자산', keyword, level: 'neutral' })
  }

  const wresbal = freds['WRESBAL']?.value ?? null
  if (wresbal !== null) {
    const keyword = wresbal > 3000000 ? '충분' : wresbal > 2500000 ? '양호' : wresbal > 2000000 ? '주의' : '위험'
    const level: 'good' | 'warn' | 'bad' | 'neutral' = wresbal > 3000000 ? 'good' : wresbal > 2500000 ? 'neutral' : wresbal > 2000000 ? 'warn' : 'bad'
    items.push({ label: '지준금', keyword, level })
  }

  const rrp = freds['RRPONTSYD']?.value ?? null
  if (rrp !== null) {
    const keyword = rrp < 100 ? '거의 소진' : rrp < 500 ? '대폭 감소' : '잔존'
    const level: 'good' | 'warn' | 'bad' | 'neutral' = rrp < 100 ? 'warn' : 'neutral'
    items.push({ label: '역레포', keyword, level })
  }

  const tga = freds['WTREGEN']?.value ?? null
  if (tga !== null) {
    const keyword = tga > 800 ? '잔고 풍부' : tga > 500 ? '정상' : tga > 200 ? '감소 중' : '부채한도 주의'
    const level: 'good' | 'warn' | 'bad' | 'neutral' = tga > 500 ? 'neutral' : 'warn'
    items.push({ label: 'TGA', keyword, level })
  }

  if (items.length === 0) return null

  return (
    <div style={{
      display: 'flex', flexWrap: 'nowrap', overflowX: 'auto',
      gap: 0, padding: '3px 10px',
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, marginBottom: 20,
      msOverflowStyle: 'none', scrollbarWidth: 'none',
    } as React.CSSProperties}>
      {items.map(({ label, keyword, level }, i) => {
        const color = level === 'good' ? '#22c55e'
          : level === 'warn' ? '#f59e0b'
          : level === 'bad' ? '#ef4444'
          : '#64748b'
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            whiteSpace: 'nowrap', paddingRight: 12,
            borderRight: i < items.length - 1 ? '1px solid var(--border)' : 'none',
            marginRight: 12,
          }}>
            <span style={{ fontSize: '0.6rem', fontFamily: 'var(--mono)', color: 'var(--muted)' }}>{label}</span>
            <span style={{ fontSize: '0.6rem', fontFamily: 'var(--mono)', fontWeight: 700, color }}>{keyword}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── 메인 페이지 ────────────────────────────────────
export default function Page() {
  const [quotes, setQuotes] = useState<Record<string, QuoteData | null>>({})
  const [freds, setFreds] = useState<Record<string, FredData | null>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAll() {
      setLoading(true)
      const quoteSymbols = ['SPY', 'QQQ', 'SOXX', 'GC=F', 'BTC-USD', 'KRW=X', 'CL=F', 'DX-Y.NYB', '^VIX']
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

  const dxy = quotes['DX-Y.NYB']?.price ?? null
  const krw = quotes['KRW=X']?.price ?? null
  const vix = quotes['^VIX']?.price ?? 0

  return (
    <main style={{ maxWidth: 1300, margin: '0 auto', padding: 24 }}>

      {/* 헤더 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, background: 'var(--accent)', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--mono)', fontWeight: 700, color: '#fff'
          }}>M</div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>Market Monitor</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>REAL-TIME FINANCIAL DASHBOARD</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.6rem', fontFamily: 'var(--mono)', color: loading ? 'var(--muted)' : 'var(--up)' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: loading ? 'var(--muted)' : 'var(--up)', animation: loading ? 'none' : 'pulse 2s infinite' }} />
          {loading ? 'LOADING...' : 'LIVE'}
        </div>
      </div>

      {/* Summary Bar */}
      <MarketSummaryBar quotes={quotes} freds={freds} />

      {/* 관심종목 */}
      <SectionLabel>⭐ 관심종목</SectionLabel>
      <Watchlist />

      {/* 이벤트 캘린더 */}
      <SectionLabel>📅 이벤트 캘린더</SectionLabel>
      <EventCalendar />

      {/* ETF */}
      <SectionLabel>📊 글로벌 ETF</SectionLabel>
      <PriceChartRow ticker="SPY" label="S&P 500 ETF" color={COLORS.etf} data={quotes['SPY']} showDrawdown />
      <PriceChartRow ticker="QQQ" label="나스닥 100 ETF" color={COLORS.etf} data={quotes['QQQ']} showDrawdown />
      <PriceChartRow ticker="SOXX" label="반도체 ETF" color={COLORS.etf} data={quotes['SOXX']} showDrawdown />

      {/* 안전자산 & 위험자산 */}
      <SectionLabel>🏅 안전자산 & 위험자산</SectionLabel>
      <PriceChartRow ticker="GC=F" label="금 Gold" color={COLORS.asset} unit="$" sub="USD / 온스" data={quotes['GC=F']} showDrawdown />
      <PriceChartRow ticker="BTC-USD" label="비트코인" color={COLORS.asset} unit="$" sub="BTC / USD" data={quotes['BTC-USD']} showDrawdown />
      <PriceChartRow ticker="CL=F" label="WTI 원유" color={COLORS.asset} unit="$" sub="USD / 배럴" data={quotes['CL=F']}
        comment={getOilComment(quotes['CL=F']?.price ?? null)}
        commentLevel={(() => { const v = quotes['CL=F']?.price ?? 0; return getOilLevel(v).level })()}
      />
      <PriceChartRow ticker="KRW=X" label="원달러 환율" color={COLORS.asset} unit="" sub="KRW / USD" data={quotes['KRW=X']}
        formatValue={(v) => v.toLocaleString()}
        comment={getKrwComment(krw)}
        commentLevel={krw ? getKrwLevel(krw).level : 'neutral'}
      />

      {/* 매크로 */}
      <SectionLabel>🌐 매크로 지표</SectionLabel>
      <FredChartRow series="T10Y2Y" label="장단기 금리차 (10Y-2Y)" desc="음수 = 역전 = 경기침체 선행신호" color={COLORS.macro} getComment={getYieldComment} />
      <FredChartRow series="DGS10" label="10년물 미국채 금리" desc="미국 장기금리 기준" color={COLORS.macro} getComment={getBondComment} />
      <PriceChartRow ticker="DX-Y.NYB" label="달러 인덱스 (DXY)" color={COLORS.macro} unit="" data={quotes['DX-Y.NYB']}
        formatValue={(v) => v.toFixed(2)}
        comment={getDxyComment(dxy)}
        commentLevel={dxy ? getDxyLevel(dxy).level : 'neutral'}
      />

      {/* 시장 심리 */}
      <SectionLabel>😱 시장 심리</SectionLabel>
      <FearGreedGauge />
      <div style={{
        display: 'grid', gridTemplateColumns: '200px 1fr 2fr', gap: 12,
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '16px', marginBottom: 8,
      }}>
        <div>
          <div style={{ fontSize: '0.6rem', fontFamily: 'var(--mono)', color: 'var(--muted)', marginBottom: 8 }}>VIX 변동성 지수</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--mono)', lineHeight: 1, color: 'var(--text)' }}>
            {quotes['^VIX'] ? vix.toFixed(2) : '--'}
          </div>
          <CommentBox
            keyword={vix >= 30 ? '경계' : vix >= 20 ? '주의' : '안정'}
            text={vix >= 30 ? '시장 패닉 상태예요. 방어적 접근이 필요해요.'
              : vix >= 20 ? '변동성이 확대되고 있어요.'
              : '투자자들이 편안한 상태예요. 위험자산에 우호적이에요.'}
            level={vix >= 30 ? 'bad' : vix >= 20 ? 'warn' : 'good'}
          />
        </div>
        <div>
          <div style={{ fontSize: '0.5rem', fontFamily: 'var(--mono)', color: 'var(--muted)', marginBottom: 4 }}>1개월</div>
          <StockLineChart symbol="^VIX" color={COLORS.fear} range="1mo" height={120} formatValue={(v) => v.toFixed(1)} />
        </div>
        <div>
          <div style={{ fontSize: '0.5rem', fontFamily: 'var(--mono)', color: 'var(--muted)', marginBottom: 4 }}>1년</div>
          <StockLineChart symbol="^VIX" color={COLORS.fear} range="1y" height={120} formatValue={(v) => v.toFixed(1)} />
        </div>
      </div>

      {/* 연준 유동성 */}
      <SectionLabel>💧 연준 유동성</SectionLabel>
      <FredChartRow series="WALCL" label="연준 총자산" desc="QE = 자산 증가 · QT = 자산 감소" color={COLORS.liquidity} unit="B" getComment={getFedAssetComment} />
      <FredChartRow series="WRESBAL" label="연준 지급준비금" desc="은행 시스템 총 준비금" color={COLORS.liquidity} unit="B" getComment={getReservesComment} />
      <FredChartRow series="RRPONTSYD" label="역레포 잔액 (RRP)" desc="초과유동성 흡수액" color={COLORS.liquidity} unit="B" getComment={getRrpComment} />
      <FredChartRow series="WTREGEN" label="TGA 잔고" desc="재무부 일반계정" color={COLORS.liquidity} unit="B" getComment={getTgaComment} />

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