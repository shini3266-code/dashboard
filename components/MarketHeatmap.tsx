'use client'
import { useEffect, useRef } from 'react'

export default function MarketHeatmap() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // 기존 스크립트 제거
    containerRef.current.innerHTML = ''

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js'
    script.async = true
    script.innerHTML = JSON.stringify({
      exchanges: [],
      dataSource: 'SPX500',
      grouping: 'sector',
      blockSize: 'market_cap_basic',
      blockColor: 'change',
      locale: 'kr',
      symbolUrl: '',
      colorTheme: 'dark',
      hasTopBar: false,
      isDataSetEnabled: false,
      isZoomEnabled: true,
      hasSymbolTooltip: true,
      isMonoSize: false,
      width: '100%',
      height: '500',
    })

    containerRef.current.appendChild(script)
  }, [])

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '16px',
      marginBottom: 8,
    }}>
      <div style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--muted)', letterSpacing: '0.08em', marginBottom: 4 }}>
        S&P 500 섹터 히트맵
      </div>
      <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)', marginBottom: 16 }}>
        시가총액 가중 · 색상 = 전일 대비 등락률
      </div>
      <div
        className="tradingview-widget-container"
        ref={containerRef}
        style={{ borderRadius: 8, overflow: 'hidden' }}
      />
    </div>
  )
}