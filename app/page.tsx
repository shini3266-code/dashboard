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
import { SectionLabel, CommentBox } from './components/ui'
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

export default function Page() {
  const isMobile = useIsMobile()
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

      <MarketSummaryBar quotes={quotes} freds={freds} />

      <SectionLabel>⭐ 관심종목</SectionLabel>
      <Watchlist />

      <SectionLabel>📅 이벤트 캘린더</SectionLabel>
      <EventCalendar isMobile={isMobile} />

      <SectionLabel>📊 글로벌 ETF</SectionLabel>
      <PriceChartRow ticker="SPY" label="S&P 500 ETF" color={COLORS.etf} data={quotes['SPY']} showDrawdown isMobile={isMobile} />
      <PriceChartRow ticker="QQQ" label="나스닥 100 ETF" color={COLORS.etf} data={quotes['QQQ']} showDrawdown isMobile={isMobile} />
      <PriceChartRow ticker="SOXX" label="반도체 ETF" color={COLORS.etf} data={quotes['SOXX']} showDrawdown isMobile={isMobile} />

      <SectionLabel>🏅 안전자산 & 위험자산</SectionLabel>
      <PriceChartRow ticker="GC=F" label="금 Gold" color={COLORS.asset} unit="$" sub="USD / 온스" data={quotes['GC=F']} showDrawdown isMobile={isMobile} />
      <PriceChartRow ticker="BTC-USD" label="비트코인" color={COLORS.asset} unit="$" sub="BTC / USD" data={quotes['BTC-USD']} showDrawdown isMobile={isMobile} />
      <PriceChartRow ticker="CL=F" label="WTI 원유" color={COLORS.asset} unit="$" sub="USD / 배럴" data={quotes['CL=F']}
        comment={getOilComment(quotes['CL=F']?.price ?? null)}
        commentLevel={getOilLevel(quotes['CL=F']?.price ?? 0).level}
        isMobile={isMobile}
      />
      <PriceChartRow ticker="KRW=X" label="원달러 환율" color={COLORS.asset} unit="" sub="KRW / USD" data={quotes['KRW=X']}
        formatValue={(v) => v.toLocaleString()}
        comment={getKrwComment(krw)}
        commentLevel={krw ? getKrwLevel(krw).level : 'neutral'}
        isMobile={isMobile}
      />

      <SectionLabel>🌐 매크로 지표</SectionLabel>
      <FredChartRow series="T10Y2Y" label="장단기 금리차 (10Y-2Y)" desc="음수 = 역전 = 경기침체 선행신호" color={COLORS.macro} getComment={getYieldComment} isMobile={isMobile} />
      <FredChartRow series="DGS10" label="10년물 미국채 금리" desc="미국 장기금리 기준" color={COLORS.macro} getComment={getBondComment} isMobile={isMobile} />
      <PriceChartRow ticker="DX-Y.NYB" label="달러 인덱스 (DXY)" color={COLORS.macro} unit="" data={quotes['DX-Y.NYB']}
        formatValue={(v) => v.toFixed(2)}
        comment={getDxyComment(dxy)}
        commentLevel={dxy ? getDxyLevel(dxy).level : 'neutral'}
        isMobile={isMobile}
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
            keyword={vix >= 30 ? '경계' : vix >= 20 ? '주의' : '안정'}
            text={vix >= 30 ? '시장 패닉 상태예요.' : vix >= 20 ? '변동성이 확대되고 있어요.' : '위험자산에 우호적이에요.'}
            level={vix >= 30 ? 'bad' : vix >= 20 ? 'warn' : 'good'}
          />
        </div>
        {!isMobile && (
          <div>
            <div style={{ fontSize: '0.6rem', color: 'var(--muted)', marginBottom: 4 }}>1개월</div>
            <StockLineChart symbol="^VIX" color={COLORS.fear} range="1mo" height={120} formatValue={(v) => v.toFixed(1)} />
          </div>
        )}
        <div>
          <div style={{ fontSize: '0.6rem', color: 'var(--muted)', marginBottom: 4 }}>{isMobile ? '1년 차트' : '1년'}</div>
          <StockLineChart symbol="^VIX" color={COLORS.fear} range="1y" height={isMobile ? 200 : 120} formatValue={(v) => v.toFixed(1)} />
        </div>
      </div>

      <SectionLabel>💧 연준 유동성</SectionLabel>
      <FredChartRow series="WALCL" label="연준 총자산" desc="QE = 자산 증가 · QT = 자산 감소" color={COLORS.liquidity} unit="B" getComment={getFedAssetComment} isMobile={isMobile} />
      <FredChartRow series="WRESBAL" label="연준 지급준비금" desc="은행 시스템 총 준비금" color={COLORS.liquidity} unit="B" getComment={getReservesComment} isMobile={isMobile} />
      <FredChartRow series="RRPONTSYD" label="역레포 잔액 (RRP)" desc="초과유동성 흡수액" color={COLORS.liquidity} unit="B" getComment={getRrpComment} isMobile={isMobile} />
      <FredChartRow series="WTREGEN" label="TGA 잔고" desc="재무부 일반계정" color={COLORS.liquidity} unit="B" getComment={getTgaComment} isMobile={isMobile} />

      <SectionLabel>💰 유동성 지표</SectionLabel>
      <FredChartRow series="M2SL" label="미국 M2 통화량" desc="광의 통화량 · 증가 = 유동성 확대" color={COLORS.liquidity} unit="B"
        getComment={(val) => {
          if (!val) return null
          const t = val / 1000
          if (t > 21000) return { keyword: '역대최고', text: '풍부한 유동성이에요.' }
          if (t > 20000) return { keyword: '높은수준', text: '유동성이 충분해요.' }
          return { keyword: '정상', text: '정상 수준이에요.' }
        }}
        isMobile={isMobile}
      />
      <FredChartRow series="WRMFNS" label="MMF 총잔액" desc="머니마켓펀드 · 증가 = 안전자산 선호" color={COLORS.liquidity} unit="B"
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
