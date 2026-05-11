'use client'
import { useState, useEffect } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'
import { supabase } from '@/lib/supabase'

function getDeviceId() {
  return 'my-dashboard-user'
}

interface WatchItem {
  id: string
  symbol: string
  price: number
  change_pct: number
  memo: string
  added_at: string
}

function WatchCard({ item, onRemove, onMemo, memoPreview, refreshing }: {
  item: WatchItem
  onRemove: (id: string, symbol: string) => void
  onMemo: () => void
  memoPreview?: string
  refreshing: boolean  // ← props로 받기
}) {
  const [showChart, setShowChart] = useState(false)

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: 16,
    }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <a  href={`https://www.investing.com/search/?q=${item.symbol}&tab=news`}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', textDecoration: 'none' }}
            >
              {item.symbol} ↗
            </a>
          <div style={{ display: 'flex', gap: 10, marginTop: 4, alignItems: 'baseline' }}>
            <span style={{ fontSize: 22, fontWeight: 700 }}>
              ${item.price?.toFixed(2)}
            </span>
            <span style={{
              fontSize: 13,
              color: item.change_pct >= 0 ? 'var(--up)' : 'var(--down)',
            }}>
              {item.change_pct >= 0 ? '▲ +' : '▼ '}{item.change_pct?.toFixed(2)}%
            </span>
          </div>
          <div style={{ fontSize: '0.5rem', color: 'var(--muted)', marginTop: 4 }}>
            {refreshing ? '⟳ 갱신 중...' : '전일 대비'}
          </div>
        </div>
        <button
          onClick={() => onRemove(item.id, item.symbol)}
          style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18 }}
        >✕</button>
      </div>

      {/* 차트 토글 버튼 */}
      <button
        onClick={() => setShowChart(prev => !prev)}
        style={{
          width: '100%',
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          padding: '5px 0',
          color: 'var(--muted)',
          cursor: 'pointer',
          fontSize: '0.4rem',
          marginBottom: showChart ? 8 : 0,
        }}
      >
        {showChart ? '차트 닫기 ↑' : '차트 보기 ↓'}
      </button>

      {showChart && (
        <iframe
          src={`https://s.tradingview.com/widgetembed/?symbol=${item.symbol}&interval=D&hidesidetoolbar=1&theme=dark&style=1&timezone=Asia%2FSeoul&withdateranges=1&locale=kr`}
          style={{ width: '100%', height: 280, border: 'none', borderRadius: 8, marginBottom: 10 }}
        />
      )}

      {/* 메모 미리보기 */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--surface2)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '8px 12px', cursor: 'pointer', marginTop: 8,
        }}
        onClick={onMemo}
      >
        <div style={{
          fontSize: '0.6rem', color: 'var(--text)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          flex: 1, marginRight: 8,
        }}>
          {memoPreview
            ? memoPreview.replace(/<[^>]+>/g, '').split('\n')[0]
            : '📌 메모 없음 — 클릭해서 추가하세요'}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onMemo() }}
          style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 6, padding: '4px 10px',
            color: 'var(--text)', cursor: 'pointer', fontSize: 11, fontWeight: 700,
            whiteSpace: 'nowrap',
          }}
        >
          📝 더보기
        </button>
      </div>
    </div>
  )
}

function MemoModal({ symbol, onClose }: { symbol: string; onClose: () => void }) {
  const [memo, setMemo] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase
      .from('watchlist_memos')
      .select('memo')
      .eq('symbol', symbol)
      .single()
      .then(({ data }) => {
        if (data?.memo) setMemo(data.memo)
      })
  }, [symbol])

  async function saveMemo() {
    setSaving(true)
    await supabase
      .from('watchlist_memos')
      .upsert({ symbol, memo, updated_at: new Date(data.updated_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }).toISOString() }, { onConflict: 'symbol' })
    await fetch('/api/watchlist-memo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, memo }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div onClick={handleBackdrop} style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 12, padding: 24, width: '100%', maxWidth: 560,
        maxHeight: '80vh', display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700 }}>📌 {symbol}</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--muted)', marginTop: 2 }}>
              매수 근거 · 목표가 · 임박 이벤트 등
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>
        <textarea
          value={memo}
          onChange={e => setMemo(e.target.value)}
          placeholder={`${symbol} 메모를 입력하세요.\n\n예시:\n- 매수 근거: AI 반도체 수요 지속\n- 목표가: $600\n- 손절가: $480\n- 다음 실적: 2025년 7월`}
          spellCheck={false}
          style={{
            flex: 1, minHeight: 300,
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '12px 14px',
            color: 'var(--text)', fontSize: '0.7rem', lineHeight: 1.8, resize: 'vertical',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{
            background: 'none', border: '1px solid var(--border)',
            borderRadius: 8, padding: '8px 16px', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.6rem',
          }}>닫기</button>
          <button onClick={saveMemo} disabled={saving} style={{
            background: saved ? '#22c55e' : 'var(--accent)', color: '#fff', border: 'none',
            borderRadius: 8, padding: '8px 20px',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '0.6rem', fontWeight: 700, transition: 'background 0.3s', opacity: saving ? 0.7 : 1,
          }}>
            {saving ? '저장 중...' : saved ? '✓ 저장됨' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Watchlist() {
  const [input, setInput] = useState('')
  const [watchlist, setWatchlist] = useState<WatchItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [memoSymbol, setMemoSymbol] = useState<string | null>(null)
  const [memoPreview, setMemoPreview] = useState<Record<string, string>>({})
  const [refreshing, setRefreshing] = useState(false)
  const isMobile = useIsMobile()

  async function refreshPrices(items: WatchItem[]) {
    if (!items.length) return
    setRefreshing(true)
    const updated = await Promise.all(
      items.map(async item => {
        try {
          const res = await fetch(`/api/quote?symbol=${item.symbol}`)
          if (!res.ok) return item
          const q = await res.json()
          return { ...item, price: q.price, change_pct: q.change }
        } catch { return item }
      })
    )
    setWatchlist(updated)
    setRefreshing(false)
  }

  async function loadMemoPreviews(symbols: string[]) {
    if (!symbols.length) return
    const { data } = await supabase
      .from('watchlist_memos')
      .select('symbol, memo')
      .in('symbol', symbols)
    if (data) {
      const map: Record<string, string> = {}
      data.forEach(d => { map[d.symbol] = d.memo })
      setMemoPreview(map)
    }
  }

  useEffect(() => {
    async function load() {
      const deviceId = getDeviceId()
      const { data } = await supabase
        .from('watchlist')
        .select('*')
        .eq('device_id', deviceId)
        .order('added_at', { ascending: true })
      if (data) {
        setWatchlist(data)
        loadMemoPreviews(data.map(d => d.symbol))
        await refreshPrices(data)
      }
    }
    load()

    const interval = setInterval(async () => {
      const deviceId = getDeviceId()
      const { data } = await supabase
        .from('watchlist')
        .select('*')
        .eq('device_id', deviceId)
        .order('added_at', { ascending: true })
      if (data) await refreshPrices(data)
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  async function addTicker() {
    const sym = input.toUpperCase().trim()
    if (!sym) return
    if (watchlist.find(w => w.symbol === sym)) {
      setError('이미 추가된 종목이에요')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/quote?symbol=${sym}`)
      if (!res.ok) throw new Error()
      const q = await res.json()  // ← q로 통일
      if (!q || !q.price) throw new Error()

      const deviceId = getDeviceId()
      const { data: inserted, error: dbError } = await supabase
        .from('watchlist')
        .insert({
          device_id: deviceId,
          symbol: sym,
          price: q.price,        // ← q.price
          change_pct: q.change,  // ← q.change
          memo: '',
        })
        .select()
        .single()

      if (dbError) throw dbError
      setWatchlist(prev => [...prev, inserted])
      setInput('')
    } catch {
      setError('티커를 찾을 수 없어요. 정확한 티커를 입력해주세요. (예: AAPL, 005930.KS)')
    } finally {
      setLoading(false)
    }
  }

  async function removeTicker(id: string, symbol: string) {
    const hasMemo = memoPreview[symbol] && memoPreview[symbol].trim().length > 0
    if (hasMemo) {
      const ok = confirm(`${symbol}에 메모가 있어요. 종목을 삭제해도 메모는 보관돼요. 계속할까요?`)
      if (!ok) return
    }
    setWatchlist(prev => prev.filter(w => w.id !== id))
    await supabase.from('watchlist').delete().eq('id', id)
  }

  return (
    <div>
      {memoSymbol && (
        <MemoModal
          symbol={memoSymbol}
          onClose={() => {
            setMemoSymbol(null)
            loadMemoPreviews(watchlist.map(w => w.symbol))
          }}
        />
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTicker()}
          placeholder="티커 입력 (예: AAPL, TSLA, 005930.KS)"
          style={{
            flex: 1, background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: '0.7rem',
          }}
        />
        <button
          onClick={addTicker}
          disabled={loading}
          style={{
            background: 'var(--accent)', color: '#fff', border: 'none',
            borderRadius: 8, padding: '10px 18px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 700, opacity: loading ? 0.7 : 1, fontSize: '0.6rem',
          }}
        >
          {loading ? '...' : '추가'}
        </button>
      </div>

      {error && (
        <div style={{ color: 'var(--down)', fontSize: '0.6rem', marginBottom: 12 }}>{error}</div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
        gap: 12,
      }}>
        {watchlist.map(item => (
          <WatchCard
            key={item.id}
            item={item}
            onRemove={removeTicker}
            onMemo={() => setMemoSymbol(item.symbol)}
            memoPreview={memoPreview[item.symbol]}
            refreshing={refreshing}  // ← props로 전달
          />
        ))}
      </div>
    </div>
  )
}