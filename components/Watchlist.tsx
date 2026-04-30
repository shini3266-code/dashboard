'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 기기마다 고유 ID 생성 (로그인 없이 구분)
function getDeviceId() {
  let id = localStorage.getItem('device_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('device_id', id)
  }
  return id
}

interface WatchItem {
  id: string
  symbol: string
  price: number
  change_pct: number  // change → change_pct
  memo: string
  addedAt: string
}

export default function Watchlist() {
  const [input, setInput] = useState('')
  const [watchlist, setWatchlist] = useState<WatchItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // DB에서 불러오기
  useEffect(() => {
    async function load() {
      const deviceId = getDeviceId()
      const { data } = await supabase
        .from('watchlist')
        .select('*')
        .eq('device_id', deviceId)
        .order('added_at', { ascending: true })
      if (data) setWatchlist(data)
    }
    load()
  }, [])

  // 종목 추가
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

  // 메모 수정
  async function updateMemo(id: string, memo: string) {
    setWatchlist(prev => prev.map(w => w.id === id ? { ...w, memo } : w))
    await supabase.from('watchlist').update({ memo }).eq('id', id)
  }

  // 종목 삭제
  async function removeTicker(id: string) {
    setWatchlist(prev => prev.filter(w => w.id !== id))
    await supabase.from('watchlist').delete().eq('id', id)
  }

  return (
    <div>
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
            fontFamily: 'var(--mono)',
            fontSize: 13,
          }}
        />
        <button
          onClick={addTicker}
          disabled={loading}
          style={{
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '10px 18px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 700,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? '...' : '추가'}
        </button>
      </div>

      {error && (
        <div style={{ color: 'var(--down)', fontFamily: 'var(--mono)', fontSize: 12, marginBottom: 12 }}>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 700 }}>
                {item.symbol}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4, alignItems: 'baseline' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 700 }}>
                  ${item.price?.toFixed(2)}
                </span>
                <span style={{
                  fontFamily: 'var(--mono)', fontSize: 13,
                  color: item.change_pct >= 0 ? 'var(--up)' : 'var(--down)',
                }}>
                  {item.change_pct >= 0 ? '▲ +' : '▼ '}{item.change_pct?.toFixed(2)}%
                </span>
              </div>
            </div>
            <button onClick={() => removeTicker(item.id)} style={{
              background: 'none', border: 'none',
              color: 'var(--muted)', cursor: 'pointer', fontSize: 18,
            }}>✕</button>
          </div>

          {/* 캔들차트 */}
          <iframe
            src={`https://s.tradingview.com/widgetembed/?symbol=${item.symbol}&interval=D&hidesidetoolbar=1&theme=dark&style=1&timezone=Asia%2FSeoul&withdateranges=1&locale=kr`}
            style={{ width: '100%', height: 300, border: 'none', borderRadius: 8, marginBottom: 10 }}
          />

          {/* 메모 */}
          <textarea
            value={item.memo}
            onChange={e => updateMemo(item.id, e.target.value)}
            placeholder="📌 메모 — 임박한 이벤트, 매수 근거, 목표가 등"
            rows={3}
            spellCheck={false}
            style={{
              width: '100%',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '10px 12px',
              color: 'var(--text)',
              resize: 'vertical',
              fontFamily: 'var(--mono)',
              fontSize: 12,
              lineHeight: 1.6,
            }}
          />
        </div>
      ))}

      {watchlist.length === 0 && (
        <div style={{
          color: 'var(--muted)', fontFamily: 'var(--mono)',
          fontSize: 13, textAlign: 'center', padding: 40,
        }}>
          티커를 입력해서 관심종목을 추가하세요
        </div>
      )}
    </div>
  )
}