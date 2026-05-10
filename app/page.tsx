'use client'
import { useState, useEffect } from 'react'
import Watchlist from '@/components/Watchlist'
import StockLineChart from '@/components/LineChart'
import FearGreedGauge from '@/components/FearGreedGauge'
import UnemploymentCharts from '@/components/UnemploymentCharts'
import SectorFlow from '@/components/SectorFlow'
import MarketHeatmap from '@/components/MarketHeatmap'
import EventCalendar from '@/components/EventCalendar'
import { useIsMobile } from '@/hooks/useIsMobile'
import { QuoteData, FredData, COLORS } from './components/types'
import { SectionLabel, CommentBox, RangeTabs } from './components/ui'
import BookmarkMenu from './components/BookmarkMenu'
import MarketSummaryBar from './components/MarketSummaryBar'
import PriceChartRow from './components/PriceChartRow'
import FredChartRow from './components/FredChartRow'
import {
  getOilLevel, getKrwLevel, getDxyLevel,
  getOilComment, getKrwComment, getDxyComment,
  getYieldComment, getBondComment,
  getFedAssetComment, getReservesComment, getRrpComment, getTgaComment,
} from './components/commentFunctions'

const SHORT_RANGES = ['1mo', '3mo', '6mo'] as const
const LONG_RANGES  = ['1y',  '3y',  '5y' ] as const
type ShortRange = typeof SHORT_RANGES[number]
type LongRange  = typeof LONG_RANGES[number]

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

function etfSummary(change: number | null | undefined) {
  if (change == null) return { keyword: '--', level: 'neutral' as const }
  return {
    keyword: change >= 1.5 ? '강세장' : change >= 0 ? '보합' : change >= -1.5 ? '조정초입' : '조정장',
    level: (change >= 1.5 ? 'good' : change >= 0 ? 'neutral' : change >= -1.5 ? 'warn' : 'bad') as const,
  }
}

export default function Page() {
  const isMobile = useIsMobile()
  const [quotes, setQuotes] = useState<Record<string, QuoteData | null>>({})
  const [freds, setFreds] = useState<Record<string, FredData | null>>({})
  const [loading, setLoading] = useState(true)
  const [vixShort, setVixShort] = useState<ShortRange>('1mo')
  const [vixLong,  setVixLong]  = useState<LongRange>('1y')

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

  // 기본 변수
  const dxy      = quotes['DX-Y.NYB']?.price  ?? null
  const krw      = quotes['KRW=X']?.price      ?? null
  const vix      = quotes['^VIX']?.price        ?? 0
  const oilPrice = quotes['CL=F']?.price        ?? null
  const t10y2y   = freds['T10Y2Y']?.value       ?? null
  const dgs10    = freds['DGS10']?.value         ?? null
  const walcl    = freds['WALCL']?.value         ?? null
  const wresbal  = freds['WRESBAL']?.value       ?? null
  const rrp      = freds['RRPONTSYD']?.value     ?? null
  const tga      = freds['WTREGEN']?.value       ?? null

  // 카드 & summary 공용 comment/level
  const oilComment   = getOilComment(oilPrice)
  const oilLevel     = oilPrice ? getOilLevel(oilPrice).level   : 'neutral' as const
  const krwComment   = getKrwComment(krw)
  const krwLevel     = krw      ? getKrwLevel(krw).level        : 'neutral' as const
  const dxyComment   = getDxyComment(dxy)
  const dxyLevel     = dxy      ? getDxyLevel(dxy).level        : 'neutral' as const
  const yieldComment = getYieldComment(t10y2y)
  const bondComment  = getBondComment(dgs10)

  const t10y2yLevel = t10y2y != null ? (t10y2y < 0 ? 'bad' : t10y2y < 0.5 ? 'warn' : 'good') as const : 'neutral' as const
  const dgs10Level  = dgs10  != null ? (dgs10  >= 5 ? 'bad' : dgs10  >= 4 ? 'warn' : 'good') as const : 'neutral' as const

  const spySummary  = etfSummary(quotes['SPY']?.change)
  const qqqSummary  = etfSummary(quotes['QQQ']?.change)
  const soxxSummary = etfSummary(quotes['SOXX']?.change)

  const goldChange = quotes['GC=F']?.change ?? null
  const goldSummary = goldChange != null ? {
    keyword: goldChange >= 1 ? '강세장' : goldChange >= 0 ? '보합' : goldChange >= -1 ? '조정초입' : '조정장',
    level: (goldChange >= 0 ? 'good' : goldChange >= -1 ? 'neutral' : 'warn') as const,
  } : { keyword: '--', level: 'neutral' as const }

  const btcChange = quotes['BTC-USD']?.change ?? null
  const btcSummary = btcChange != null ? {
    keyword: btcChange >= 3 ? '강세장' : btcChange >= 0 ? '보합' : btcChange >= -3 ? '조정장' : '급락장',
    level: (btcChange >= 0 ? 'good' : btcChange >= -3 ? 'warn' : 'bad') as const,
  } : { keyword: '--', level: 'neutral' as const }

  const vixSummary = {
    keyword: vix >= 30 ? '경계' : vix >= 20 ? '주의' : '안정',
    level: (vix >= 30 ? 'bad' : vix >= 20 ? 'warn' : 'good') as const,
  }

  const summaryItems = [
    { label: 'SPY',  ...spySummary },
    { label: 'QQQ',  ...qqqSummary },
    { label: 'SOXX', ...soxxSummary },
    { label: '금',   ...goldSummary },
    { label: 'BTC',  ...btcSummary },
    ...(oilComment  ? [{ label: 'WTI',   keyword: oilComment.keyword,          level: oilLevel    }] : []),
    ...(krwComment  ? [{ label: '환율',  keyword: krwComment.keyword,          level: krwLevel    }] : []),
    ...(dxyComment  ? [{ label: 'DXY',   keyword: dxyComment.keyword,          level: dxyLevel    }] : []),
    ...(t10y2y != null ? [{ label: '금리차', keyword: yieldComment?.keyword ?? '--', level: t10y2yLevel }] : []),
    ...(dgs10  != null ? [{ label: '10Y',    keyword: bondComment?.keyword  ?? '--', level: dgs10Level  }] : []),
    { label: 'VIX', ...vixSummary },
    ...(walcl   != null ? [{ label: '연준자산', keyword: walcl/1e6 >= 8 ? 'QT진행중' : walcl/1e6 >= 7 ? 'QT중반' : walcl/1e6 >= 6 ? 'QT후반' : '정상화', level: 'neutral' as const }] : []),
    ...(wresbal != null ? [{ label: '지준금',  keyword: wresbal > 3e6 ? '충분' : wresbal > 2.5e6 ? '양호' : wresbal > 2e6 ? '주의' : '위험', level: (wresbal > 3e6 ? 'good' : wresbal > 2.5e6 ? 'neutral' : wresbal > 2e6 ? 'warn' : 'bad') as const }] : []),
    ...(rrp     != null ? [{ label: '역레포',  keyword: rrp < 100 ? '거의소진' : rrp < 500 ? '대폭감소' : '잔존', level: (rrp < 100 ? 'warn' : 'neutral') as const }] : []),
    ...(tga     != null ? [{ label: 'TGA',     keyword: tga > 800 ? '잔고풍부' : tga > 500 ? '정상' : tga > 200 ? '감소중' : '부채한도주의', level: (tga > 500 ? 'neutral' : 'warn') as const }] : []),
  ]

  return (
    <main style={{ maxWidth: isMobile ? '100%' : 1440, margin: '0 auto', padding: isMobile ? 12 : 24 }}>

      {/* 헤더 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, background: 'var(--accent)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: '0.875rem' }}>M</div>
          {!isMobile && (
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Market Monitor</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--muted)' }}>REAL-TIME FINANCIAL DASHBOARD</div>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          <BookmarkMenu />
          <a href="/memo" style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', color: 'var(--text)', textDecoration: 'none', fontSize: '0.7rem' }}>
            📝 메모
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.6rem', color: loading ? 'var(--muted)' : 'var(--up)', marginLeft: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: loading ? 'var(--muted)' : 'var(--up)', animation: loading ? 'none' : 'pulse 2s infinite' }} />
            {!isMobile && (loading ? 'LOADING...' : 'LIVE')}
          </div>
        </div>
      </div>

      <MarketSummaryBar items={summaryItems} />

      <SectionLabel>⭐ 관심종목</SectionLabel>
      <Watchlist />

      <SectionLabel>📅 이벤트 캘린더</SectionLabel>
      <EventCalendar isMobile={isMobile} />

      <SectionLabel>📊 글로벌 ETF</SectionLabel>
      <PriceChartRow ticker="SPY"  label="SPY · S&P 500 ETF"     color={COLORS.etf} data={quotes['SPY']}  showDrawdown isMobile={isMobile} />
      <PriceChartRow ticker="QQQ"  label="QQQ · 나스닥 100 ETF"  color={COLORS.etf} data={quotes['QQQ']}  showDrawdown isMobile={isMobile} />
      <PriceChartRow ticker="SOXX" label="SOXX · 반도체 ETF"     color={COLORS.etf} data={quotes['SOXX']} showDrawdown isMobile={isMobile} />

      <SectionLabel>🏅 안전자산 & 위험자산</SectionLabel>
      <PriceChartRow ticker="GC=F"    label="GC=F · 금 Gold"       color={COLORS.asset} unit="$" sub="USD / 온스"  data={quotes['GC=F']}    showDrawdown isMobile={isMobile} />
      <PriceChartRow ticker="BTC-USD" label="BTC-USD · 비트코인"   color={COLORS.asset} unit="$" sub="BTC / USD"   data={quotes['BTC-USD']} showDrawdown isMobile={isMobile} />
      <PriceChartRow ticker="CL=F"    label="CL=F · WTI 원유"      color={COLORS.asset} unit="$" sub="USD / 배럴"  data={quotes['CL=F']}
        comment={oilComment} commentLevel={oilLevel} isMobile={isMobile}
      />
      <PriceChartRow ticker="KRW=X"   label="KRW=X · 원달러 환율" color={COLORS.asset} unit=""  sub="KRW / USD"   data={quotes['KRW=X']}
        formatValue={(v) => v.toLocaleString()}
        comment={krwComment} commentLevel={krwLevel} isMobile={isMobile}
      />

      <SectionLabel>🌐 매크로 지표</SectionLabel>
      <FredChartRow series="T10Y2Y"   label="T10Y2Y · 장단기 금리차 (10Y-2Y)" desc="음수 = 역전 = 경기침체 선행신호" color={COLORS.macro} getComment={getYieldComment} isMobile={isMobile} />
      <FredChartRow series="DGS10"    label="DGS10 · 10년물 미국채 금리"       desc="미국 장기금리 기준"              color={COLORS.macro} getComment={getBondComment}  isMobile={isMobile} />
      <PriceChartRow ticker="DX-Y.NYB" label="DX-Y.NYB · 달러 인덱스 (DXY)"  color={COLORS.macro} unit="" data={quotes['DX-Y.NYB']}
        formatValue={(v) => v.toFixed(2)}
        comment={dxyComment} commentLevel={dxyLevel} isMobile={isMobile}
      />

      <SectionLabel>😱 시장 심리</SectionLabel>
      <FearGreedGauge isMobile={isMobile} />
      <div style={{
        display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '280px 1fr 2fr',
        gap: 12, background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 10, padding: isMobile ? '14px' : '16px', marginBottom: 4,
      }}>
        <div>
          <div style={{ fontSize: '0.6rem', color: 'var(--muted)', marginBottom: 8 }}>VIX 변동성 지수</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1, color: 'var(--text)' }}>
            {quotes['^VIX'] ? vix.toFixed(2) : '--'}
          </div>
          <CommentBox
            keyword={vixSummary.keyword}
            text={vix >= 30 ? '시장 패닉 상태예요.' : vix >= 20 ? '변동성이 확대되고 있어요.' : '위험자산에 우호적이에요.'}
            level={vixSummary.level}
          />
        </div>
        {!isMobile && (
          <div>
            <RangeTabs ranges={SHORT_RANGES} selected={vixShort} onChange={setVixShort} color={COLORS.fear} />
            <StockLineChart symbol="^VIX" color={COLORS.fear} range={vixShort} height={120} formatValue={(v) => v.toFixed(1)} />
          </div>
        )}
        <div>
          <RangeTabs ranges={LONG_RANGES} selected={vixLong} onChange={setVixLong} color={COLORS.fear} />
          <StockLineChart symbol="^VIX" color={COLORS.fear} range={vixLong} height={isMobile ? 200 : 120} formatValue={(v) => v.toFixed(1)} />
        </div>
      </div>

      <SectionLabel>💧 연준 유동성</SectionLabel>
      <FredChartRow series="WALCL"     label="WALCL · 연준 총자산"         desc="QE = 자산 증가 · QT = 자산 감소" color={COLORS.liquidity} unit="B" getComment={getFedAssetComment}  isMobile={isMobile} />
      <FredChartRow series="WRESBAL"   label="WRESBAL · 연준 지급준비금"   desc="은행 시스템 총 준비금"            color={COLORS.liquidity} unit="B" getComment={getReservesComment} isMobile={isMobile} />
      <FredChartRow series="RRPONTSYD" label="RRPONTSYD · 역레포 잔액 (RRP)" desc="초과유동성 흡수액"             color={COLORS.liquidity} unit="B" getComment={getRrpComment}       isMobile={isMobile} />
      <FredChartRow series="WTREGEN"   label="WTREGEN · TGA 잔고"          desc="재무부 일반계정"                  color={COLORS.liquidity} unit="B" getComment={getTgaComment}       isMobile={isMobile} />

      <SectionLabel>💰 유동성 지표</SectionLabel>
      <FredChartRow series="M2SL" label="M2SL · 미국 M2 통화량" desc="광의 통화량 · 증가 = 유동성 확대" color={COLORS.liquidity} unit="B"
        getComment={(val) => {
          if (!val) return null
          const t = val / 1000
          if (t > 21000) return { keyword: '역대최고', text: '풍부한 유동성이에요.' }
          if (t > 20000) return { keyword: '높은수준', text: '유동성이 충분해요.' }
          return { keyword: '정상', text: '정상 수준이에요.' }
        }}
        isMobile={isMobile}
      />
      <FredChartRow series="WRMFNS" label="WRMFNS · MMF 총잔액" desc="머니마켓펀드 · 증가 = 안전자산 선호" color={COLORS.liquidity} unit="B"
        getComment={(val) => {
          if (!val) return null
          const t = val / 1000
          if (t > 6000) return { keyword: '역대최고', text: '투자자들이 관망 중이에요.' }
          if (t > 5000) return { keyword: '높은수준', text: '안전자산 선호가 강해요.' }
          return { keyword: '정상', text: '정상 수준이에요.' }
        }}
        isMobile={isMobile}
      />

      <SectionLabel>👷 고용 지표</SectionLabel>
      <UnemploymentCharts />

      <SectionLabel>🏭 섹터별 자금 흐름</SectionLabel>
      <SectorFlow />

      {!isMobile && (
        <>
          <SectionLabel>🗺️ 미국 증시 히트맵</SectionLabel>
          <MarketHeatmap />
        </>
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </main>
  )
}