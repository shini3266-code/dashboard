'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const CATEGORIES = ['전체', '시장분석', '종목메모', '매매일지', '공부', '기타']

interface Memo {
  id: string
  title: string
  content: string
  category: string
  created_at: string
  updated_at: string
}

export default function MemoPage() {
  const [memos, setMemos] = useState<Memo[]>([])
  const [selectedCategory, setSelectedCategory] = useState('전체')
  const [selected, setSelected] = useState<Memo | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', category: '시장분석' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data } = await supabase
      .from('memos')
      .select('*')
      .order('updated_at', { ascending: false })
    if (data) setMemos(data)
    setLoading(false)
  }

  async function saveMemo() {
    if (!form.title.trim()) return
    if (selected && isEditing) {
      // 수정
      const { data } = await supabase
        .from('memos')
        .update({ ...form, updated_at: new Date().toISOString() })
        .eq('id', selected.id)
        .select()
        .single()
      if (data) {
        setMemos(prev => prev.map(m => m.id === data.id ? data : m))
        setSelected(data)
      }
    } else {
      // 새로 추가
      const { data } = await supabase
        .from('memos')
        .insert({ ...form, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .select()
        .single()
      if (data) {
        setMemos(prev => [data, ...prev])
        setSelected(data)
      }
    }
    setIsEditing(false)
  }

  async function deleteMemo(id: string) {
    const ok = confirm('메모를 삭제할까요?')
    if (!ok) return
    await supabase.from('memos').delete().eq('id', id)
    setMemos(prev => prev.filter(m => m.id !== id))
    setSelected(null)
  }

  const filtered = selectedCategory === '전체'
    ? memos
    : memos.filter(m => m.category === selectedCategory)

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>

      {/* 사이드바 */}
      <div style={{
        width: 260, borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
      }}>
        {/* 상단 */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Link href="/" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: 12 }}>
              ← 대시보드
            </Link>
            <button
              onClick={() => { setSelected(null); setIsEditing(true); setForm({ title: '', content: '', category: '시장분석' }) }}
              style={{
                background: 'var(--accent)', color: '#fff', border: 'none',
                borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 700,
              }}
            >
              + 새 메모
            </button>
          </div>

          {/* 카테고리 필터 */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  background: selectedCategory === cat ? 'var(--accent)' : 'var(--surface2)',
                  color: selectedCategory === cat ? '#fff' : 'var(--muted)',
                  border: 'none', borderRadius: 4, padding: '3px 8px',
                  cursor: 'pointer', fontSize: 11,
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 메모 목록 */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: 20, color: 'var(--muted)', fontSize: 12, textAlign: 'center' }}>로딩 중...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 20, color: 'var(--muted)', fontSize: 12, textAlign: 'center' }}>메모 없음</div>
          ) : filtered.map(memo => (
            <div
              key={memo.id}
              onClick={() => { setSelected(memo); setIsEditing(false) }}
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)',
                cursor: 'pointer',
                background: selected?.id === memo.id ? 'var(--surface)' : 'transparent',
                borderLeft: selected?.id === memo.id ? '2px solid var(--accent)' : '2px solid transparent',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {memo.title}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {memo.content.split('\n')[0] || '내용 없음'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  fontSize: 10, color: 'var(--accent)',
                  background: 'rgba(59,130,246,0.1)', borderRadius: 3, padding: '1px 6px',
                }}>
                  {memo.category}
                </span>
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>
                  {new Date(memo.updated_at).toLocaleDateString('ko-KR')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 메인 영역 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {isEditing ? (
          // 편집 모드
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 24, gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="제목"
                autoFocus
                style={{
                  flex: 1, background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 16, fontWeight: 700,
                }}
              />
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '10px 12px', color: 'var(--text)', fontSize: 13,
                }}
              >
                {CATEGORIES.filter(c => c !== '전체').map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <button
                onClick={() => { setIsEditing(false); setSelected(null) }}
                style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', color: 'var(--muted)', cursor: 'pointer', fontSize: 13 }}
              >
                취소
              </button>
              <button
                onClick={saveMemo}
                style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
              >
                저장
              </button>
            </div>
            <textarea
              value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
              placeholder="내용을 입력하세요..."
              spellCheck={false}
              style={{
                flex: 1, background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '16px', color: 'var(--text)', fontSize: 14,
                lineHeight: 1.8, resize: 'none',
              }}
            />
          </div>
        ) : selected ? (
          // 보기 모드
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 24, overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{selected.title}</div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--accent)', background: 'rgba(59,130,246,0.1)', borderRadius: 3, padding: '2px 8px' }}>
                    {selected.category}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                    {new Date(selected.updated_at).toLocaleString('ko-KR')}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => { setIsEditing(true); setForm({ title: selected.title, content: selected.content, category: selected.category }) }}
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 14px', color: 'var(--text)', cursor: 'pointer', fontSize: 12 }}
                >
                  ✏️ 수정
                </button>
                <button
                  onClick={() => deleteMemo(selected.id)}
                  style={{ background: 'none', border: '1px solid var(--down)', borderRadius: 8, padding: '7px 14px', color: 'var(--down)', cursor: 'pointer', fontSize: 12 }}
                >
                  삭제
                </button>
              </div>
            </div>
            <div style={{
              flex: 1, fontSize: 14, lineHeight: 1.9, color: 'var(--text)',
              whiteSpace: 'pre-wrap', borderTop: '1px solid var(--border)', paddingTop: 16,
            }}>
              {selected.content}
            </div>
          </div>
        ) : (
          // 빈 상태
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 40 }}>📝</div>
            <div style={{ fontSize: 14 }}>메모를 선택하거나 새 메모를 작성하세요</div>
          </div>
        )}
      </div>
    </div>
  )
}