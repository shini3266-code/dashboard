'use client'
import { QuoteData, FredData } from './types'
import { getOilLevel, getKrwLevel, getDxyLevel } from './commentFunctions'

export default function MarketSummaryBar({ quotes, freds }: {
  quotes: Record<string, QuoteData | null>
  freds: Record<string, FredData | null>
}) {
  const items: { label: string; keyword: string; level: 'good' | 'warn' | 'bad' | 'neutral' }[] = []

  ;[{ sym: 'SPY', label: 'SPY' }, { sym: 'QQQ', label: 'QQQ' }, { sym: 'SOXX', label: 'SOXX' }]
    .forEach(({ sym, label }) => {
      const change = quotes[sym]?.change ?? null
      if (change === null) return
      const keyword = change >= 1.5 ? '강세장' : change >= 0 ? '보합' : change >= -1.5 ? '조정초입' : '조정장'
      const level: 'good' | 'warn' | 'bad' | 'neutral' = change >= 1.5 ? 'good' : change >= 0 ? 'neutral' : change >= -1.5 ? 'warn' : 'bad'
      items.push({ label, keyword, level })
    })

  const goldChange = quotes['GC=F']?.change ?? null
  if (goldChange !== null) {
    const keyword = goldChange >= 1 ? '강세장' : goldChange >= 0 ? '보합' : goldChange >= -1 ? '조정초입' : '조정장'
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
  if (oil !== null) { const { keyword, level } = getOilLevel(oil); items.push({ label: 'WTI', keyword, level }) }

  const krw = quotes['KRW=X']?.price ?? null
  if (krw !== null) { const { keyword, level } = getKrwLevel(krw); items.push({ label: '환율', keyword, level }) }

  const t10y2y = freds['T10Y2Y']?.value ?? null
  if (t10y2y !== null) {
    const keyword = t10y2y < 0 ? '역전' : t10y2y < 0.5 ? '회복초입' : '정상'
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
  if (dxy !== null) { const { keyword, level } = getDxyLevel(dxy); items.push({ label: 'DXY', keyword, level }) }

  const vix = quotes['^VIX']?.price ?? null
  if (vix !== null) {
    const keyword = vix >= 30 ? '경계' : vix >= 20 ? '주의' : '안정'
    const level: 'good' | 'warn' | 'bad' | 'neutral' = vix >= 30 ? 'bad' : vix >= 20 ? 'warn' : 'good'
    items.push({ label: 'VIX', keyword, level })
  }

  const walcl = freds['WALCL']?.value ?? null
  if (walcl !== null) {
    const t = walcl / 1000000
    const keyword = t >= 8 ? 'QT진행중' : t >= 7 ? 'QT중반' : t >= 6 ? 'QT후반' : '정상화'
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
    const keyword = rrp < 100 ? '거의소진' : rrp < 500 ? '대폭감소' : '잔존'
    items.push({ label: '역레포', keyword, level: rrp < 100 ? 'warn' : 'neutral' })
  }

  const tga = freds['WTREGEN']?.value ?? null
  if (tga !== null) {
    const keyword = tga > 800 ? '잔고풍부' : tga > 500 ? '정상' : tga > 200 ? '감소중' : '부채한도주의'
    items.push({ label: 'TGA', keyword, level: tga > 500 ? 'neutral' : 'warn' })
  }

  if (items.length === 0) return null

  return (
    <div style={{
      display: 'flex', flexWrap: 'nowrap', overflowX: 'auto',
      gap: 6, padding: '10px 16px',
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, marginBottom: 20,
      msOverflowStyle: 'none', scrollbarWidth: 'none',
    } as React.CSSProperties}>
      {items.map(({ label, keyword, level }, i) => {
        const color = level === 'good' ? '#22c55e' : level === 'warn' ? '#f59e0b' : level === 'bad' ? '#ef4444' : '#e2e8f0'
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            whiteSpace: 'nowrap', paddingRight: 6,
            borderRight: i < items.length - 1 ? '1px solid var(--border)' : 'none',
            marginRight: 6,
          }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--muted)' }}>{label}</span>
            <span style={{ fontSize: '0.6rem', fontWeight: 700, color }}>{keyword}</span>
          </div>
        )
      })}
    </div>
  )
}
