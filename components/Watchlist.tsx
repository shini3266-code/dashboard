'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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

// ── 메모 팝업 ──────────────────────────────────────
function MemoModal({ symbol, onClose }: { symbol: string; onClose: () => void }) {
  const [memo, setMemo] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // 기존 메모 불러오기
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
      .upsert({ symbol, memo, updated_at: new Date().toISOString() }, { onConflict: 'symbol' })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // 바깥 클릭 시 닫기
  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 24,
        width: '100%',
        maxWidth: 560,
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, fontFamily: 'var(--mono)' }}>
              📌 {symbol}
            </div>
            <div style={{ fontSize: '0.6rem', color: 'var(--muted)', fontFamily: 'var(--mono)', marginTop: 2 }}>
              매수 근거 · 목표가 · 임박 이벤트 등
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none',
              color: 'var(--muted)', cursor: 'pointer', fontSize: '1.2rem',
            }}
          >✕</button>
        </div>

        {/* 메모장 */}
        <textarea
          value={memo}
          onChange={e => setMemo(e.target.value)}
          placeholder={`${symbol} 메모를 입력하세요.\n\n예시:\n- 매수 근거: AI 반도체 수요 지속\n- 목표가: $600\n- 손절가: $480\n- 다음 실적: 2025년 7월`}
          spellCheck={false}
          style={{
            flex: 1,
            minHeight: 300,
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '12px 14px',
            color: 'var(--text)',
            fontFamily: 'var(--mono)',
            fontSize: '0.6rem',
            lineHeight: 1.8,
            resize: 'vertical',
          }}
        />

        {/* 버튼 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: '1px solid var(--border)',
              borderRadius: 8, padding: '8px 16px',
              color: 'var(--muted)', cursor: 'pointer',
              fontFamily: 'var(--mono)', fontSize: '0.6rem',
            }}
          >
            닫기
          </button>
          <button
            onClick={saveMemo}
            disabled={saving}
            style={{
              background: saved ? '#22c55e' : 'var(--accent)',
              color: '#fff', border: 'none',
              borderRadius: 8, padding: '8px 20px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--mono)', fontSize: '0.6rem', fontWeight: 700,
              transition: 'background 0.3s',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? '저장 중...' : saved ? '✓ 저장됨' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 메인 Watchlist ─────────────────────────────────
export default function Watchlist() {
  const [input, setInput] = useState('')
  const [watchlist, setWatchlist] = useState<WatchItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [memoSymbol, setMemoSymbol] = useState<string | null>(null)
  const [memoPreview, setMemoPreview] = useState<Record<string, string>>({})

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
        // 메모 미리보기 로드
        loadMemoPreviews(data.map(d => d.symbol))
      }
    }
    load()
  }, [])

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
      const data = await res.json()
      if (!data || !data.price) throw new Error()

      const deviceId = getDeviceId()
      const { data: inserted, error: dbError } = await supabase
        .from('watchlist')
        .insert({
          device_id: deviceId,
          symbol: sym,
          price: data.price,
          change_pct: data.change,
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
    // 메모 있으면 확인
    const hasMemo = memoPreview[symbol] && memoPreview[symbol].trim().length > 0
    if (hasMemo) {
      const ok = confirm(`${symbol}에 메모가 있어요. 종목을 삭제해도 메모는 보관돼요. 계속할까요?`)
      if (!ok) return
    }
    setWatchlist(prev => prev.filter(w => w.id !== id))
    await supabase.from('watchlist').delete().eq('id', id)
    // 메모는 삭제 안 함 (watchlist_memos 테이블에 보존)
  }

  return (
    <div>
      {/* 메모 팝업 */}
      {memoSymbol && (
        <MemoModal
          symbol={memoSymbol}
          onClose={() => {
            setMemoSymbol(null)
            // 팝업 닫을 때 미리보기 새로고침
            loadMemoPreviews(watchlist.map(w => w.symbol))
          }}
        />
      )}

      {/* 입력칸 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTicker()}
          placeholder="티커 입력 (예: AAPL, TSLA, 005930.KS)"
          style={{
            flex: 1,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '10px 14px',
            color: 'var(--text)',
            fontSize: '0.6rem',
          }}
        />
        <button
          onClick={addTicker}
          disabled={loading}
          style={{
            background: 'var(--accent)', color: '#fff', border: 'none',
            borderRadius: 8, padding: '10px 18px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 700, opacity: loading ? 0.7 : 1,
            fontSize: '0.6rem',
            fontFamily: 'var(--mono)',
          }}
        >
          {loading ? '...' : '추가'}
        </button>
      </div>

      {error && (
        <div style={{ color: 'var(--down)', fontFamily: 'var(--mono)', fontSize: '0.6rem', marginBottom: 12 }}>
          {error}
        </div>
      )}

      {/* 종목 카드 */}
      {watchlist.map(item => (
        <div key={item.id} style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 16,
          marginBottom: 12,
        }}>
          {/* 헤더 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '0.8rem', fontWeight: 700 }}>
                {item.symbol}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4, alignItems: 'baseline' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '1.2rem', fontWeight: 700 }}>
                  ${item.price?.toFixed(2)}
                </span>
                <span style={{
                  fontFamily: 'var(--mono)', fontSize: '0.6rem',
                  color: item.change_pct >= 0 ? 'var(--up)' : 'var(--down)',
                }}>
                  {item.change_pct >= 0 ? '▲ +' : '▼ '}{item.change_pct?.toFixed(2)}%
                </span>
              </div>
            </div>
            <button
              onClick={() => removeTicker(item.id, item.symbol)}
              style={{
                background: 'none', border: 'none',
                color: 'var(--muted)', cursor: 'pointer', fontSize: '0.8rem',
              }}
            >✕</button>
          </div>

          {/* 차트 */}
          <iframe
            src={`https://s.tradingview.com/widgetembed/?symbol=${item.symbol}&interval=D&hidesidetoolbar=1&theme=dark&style=1&timezone=Asia%2FSeoul&withdateranges=1&locale=kr`}
            style={{ width: '100%', height: 300, border: 'none', borderRadius: 8, marginBottom: 10 }}
          />

          {/* 메모 미리보기 + 더보기 버튼 */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '8px 12px',
            cursor: 'pointer',
          }}
            onClick={() => setMemoSymbol(item.symbol)}
          >
            <div style={{
              fontSize: '0.6rem', fontFamily: 'var(--mono)', color: 'var(--muted)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              flex: 1, marginRight: 8,
            }}>
              {memoPreview[item.symbol]
                ? memoPreview[item.symbol].split('\n')[0]  // 첫줄만 미리보기
                : '📌 메모 없음 — 클릭해서 추가하세요'}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setMemoSymbol(item.symbol) }}
              style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 6, padding: '4px 10px',
                color: 'var(--text)', cursor: 'pointer',
                fontFamily: 'var(--mono)', fontSize: '0.6rem', fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              📝 더보기
            </button>
          </div>
        </div>
      ))}

      {/* {watchlist.length === 0 && (
        <div style={{
          color: 'var(--text)', fontFamily: 'var(--mono)',
          fontSize: '0.6rem', textAlign: 'center', padding: 40,
        }}>
          티커를 입력해서 관심종목을 추가하세요
        </div>
      )} */}
    </div>
  )
}