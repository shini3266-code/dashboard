'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import RichEditor from '@/components/RichEditor'
import { useIsMobile } from '@/hooks/useIsMobile'
import { supabase } from '@/lib/supabase'
import Watchlist from '@/components/Watchlist'

interface Memo {
  id: string
  title: string
  content: string
  category: string
  linked_symbol?: string
  pinned: boolean
  created_at: string
  updated_at: string
}

interface Category {
  id: string
  name: string
  color: string
}

const DEFAULT_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#f97316', /*'#06b6d4',*/ '#64748b']

function WatchlistMemoBox({ content }: { content: string }) {
  const match = content.match(/\[WATCHLIST_MEMO\]([\s\S]*?)\[\/WATCHLIST_MEMO\]/)
  if (!match) return null

  return (
    <div style={{
      background: 'var(--surface2)',
      border: '1px solid var(--accent)',
      borderLeft: '3px solid var(--accent)',
      borderRadius: 8,
      padding: '10px 14px',
      marginBottom: 12,
    }}>
      <div style={{ fontSize: '0.6rem', color: 'var(--accent)', marginBottom: 6, fontWeight: 700 }}>
        📌 관심종목 메모
      </div>
      <div style={{ fontSize: '0.6rem', color: 'var(--text)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
        {match[1]}
      </div>
    </div>
  )
}

// ── 카테고리 관리 모달 ─────────────────────────────
function CategoryModal({ categories, onClose, onSave, onDelete }: {
  categories: Category[]
  onClose: () => void
  onSave: (cat: Omit<Category, 'id'>, editId?: string) => void
  onDelete: (id: string) => void
}) {
  const [form, setForm] = useState({ name: '', color: DEFAULT_COLORS[0] })
  const [editId, setEditId] = useState<string | null>(null)

  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose()
  }

  function startEdit(cat: Category) {
    setEditId(cat.id)
    setForm({ name: cat.name, color: cat.color })
  }

  function handleSave() {
    if (!form.name.trim()) return
    onSave({ name: form.name, color: form.color }, editId ?? undefined)  // ← editId 넘기는지 확인
    setForm({ name: '', color: DEFAULT_COLORS[0] })
    setEditId(null)
  }

  return (
    <div onClick={handleBackdrop} style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 12, padding: 24, width: '100%', maxWidth: 400,
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 700 }}>카테고리 관리</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
        </div>

        {/* 기존 카테고리 목록 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 240, overflowY: 'auto' }}>
          {categories.map(cat => (
            <div key={cat.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'var(--surface2)', borderRadius: 8, padding: '8px 12px',
            }}>
              {editId === cat.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                  <input
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    autoFocus
                    style={{
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 6, padding: '4px 8px', color: 'var(--text)', fontSize: '0.6rem',
                      width: '100%',
                    }}
                  />
                  {/* 색상 선택 */}
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {DEFAULT_COLORS.map(c => (
                      <div
                        key={c}
                        onClick={() => setForm({ ...form, color: c })}
                        style={{
                          width: 16, height: 16, borderRadius: '50%', background: c,
                          cursor: 'pointer',
                          outline: form.color === c ? '2px solid white' : 'none',
                          outlineOffset: 1,
                        }}
                      />
                    ))}
                  </div>
                  {/* 저장/취소 버튼 */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => { setEditId(null); setForm({ name: '', color: DEFAULT_COLORS[0] }) }}
                      style={{
                        background: 'none', border: '1px solid var(--border)',
                        borderRadius: 6, padding: '3px 10px',
                        color: 'var(--muted)', cursor: 'pointer', fontSize: '0.6rem',
                      }}
                    >취소</button>
                    <button
                      onClick={() => {
                        onSave({ name: form.name, color: form.color }, cat.id)  // ← cat.id 넘기기
                        setEditId(null)
                        setForm({ name: '', color: DEFAULT_COLORS[0] })
                      }}
                      style={{
                        background: 'var(--accent)', color: '#fff', border: 'none',
                        borderRadius: 6, padding: '3px 10px',
                        cursor: 'pointer', fontSize: '0.6rem',
                      }}
                    >저장</button>
                  </div>
                </div>
              ) : (
                // 보기 모드
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: cat.color }} />
                    <span style={{ fontSize: '0.6rem' }}>{cat.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => startEdit(cat)}
                      style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.6rem' }}
                    >✏️</button>
                    <button
                      onClick={() => {
                        if (confirm(`"${cat.name}" 카테고리를 삭제할까요?`)) onDelete(cat.id)
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--down)', cursor: 'pointer', fontSize: '0.6rem' }}
                    >🗑️</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* 새 카테고리 추가 */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--muted)', marginBottom: 8 }}>새 카테고리 추가</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              placeholder="카테고리 이름"
              style={{
                flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: '0.6rem',
              }}
            />
            <button
              onClick={handleSave}
              style={{
                background: 'var(--accent)', color: '#fff', border: 'none',
                borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: '0.6rem', fontWeight: 700,
              }}
            >추가</button>
          </div>

          {/* 색상 선택 */}
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            {DEFAULT_COLORS.map(c => (
              <div
                key={c}
                onClick={() => setForm({ ...form, color: c })}
                style={{
                  width: 18, height: 18, borderRadius: '50%', background: c,
                  cursor: 'pointer', outline: form.color === c ? '2px solid white' : 'none',
                  outlineOffset: 2,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── 메인 메모 페이지 ───────────────────────────────
export default function MemoPage() {
  const [memos, setMemos] = useState<Memo[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState('전체')
  const [selected, setSelected] = useState<Memo | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', category: '' })
  const [loading, setLoading] = useState(true)
  const [showCatModal, setShowCatModal] = useState(false)
  const isMobile = useIsMobile()

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    const [{ data: memoData }, { data: catData }] = await Promise.all([
      supabase.from('memos').select('*').order('updated_at', { ascending: false }),
      supabase.from('memo_categories').select('*').order('created_at', { ascending: true }),
    ])
    if (memoData) setMemos(memoData)
    if (catData) setCategories(catData)
    setLoading(false)
  }

  // 카테고리 추가/수정
  async function saveCategory(data: Omit<Category, 'id'>, editId?: string) {
    if (editId) {
      // 수정
      const { data: updated } = await supabase
        .from('memo_categories')
        .update({ name: data.name, color: data.color })
        .eq('id', editId)
        .select()
        .single()
      if (updated) setCategories(prev => prev.map(c => c.id === editId ? (updated as Category) : c))
    } else {
      // 추가
      const { data: inserted } = await supabase
        .from('memo_categories')
        .insert({ name: data.name, color: data.color })
        .select()
        .single()
      if (inserted) setCategories(prev => [...prev, inserted as Category])
    }
  }

  // 카테고리 삭제
  async function deleteCategory(id: string) {
    await supabase.from('memo_categories').delete().eq('id', id)
    setCategories(prev => prev.filter(c => c.id !== id))
  }

  // 고정 토글
  async function togglePin(id: string, pinned: boolean) {
    await supabase.from('memos').update({ pinned: !pinned }).eq('id', id)
    setMemos(prev => prev.map(m => m.id === id ? { ...m, pinned: !pinned } : m))
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, pinned: !pinned } : null)
  }

  // 메모 저장
  async function saveMemo() {
    if (!form.title.trim()) return
    const category = form.category || categories[0]?.name || '기타'

    if (selected && isEditing) {
      const { data } = await supabase
        .from('memos')
        .update({ ...form, category, updated_at: new Date().toISOString() })
        .eq('id', selected.id)
        .select()
        .single()
      if (data) {
        setMemos(prev => prev.map(m => m.id === data.id ? data : m))
        setSelected(data)
      }
    } else {
      const { data } = await supabase
        .from('memos')
        .insert({ ...form, category, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .select()
        .single()
      if (data) {
        setMemos(prev => [data, ...prev])
        setSelected(data)
      }
    }
    setIsEditing(false)
  }

  // 메모 삭제
  async function deleteMemo(id: string) {
    if (!confirm('메모를 삭제할까요?')) return
    await supabase.from('memos').delete().eq('id', id)
    setMemos(prev => prev.filter(m => m.id !== id))
    setSelected(null)
  }

  const allCategories = ['전체', ...categories.map(c => c.name)]
  const filtered = (selectedCategory === '전체' ? memos : memos.filter(m => m.category === selectedCategory))
  .sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  })
  const currentCat = categories.find(c => c.name === selectedCategory)

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
  
      {/* 카테고리 모달 */}
      {showCatModal && (
        <CategoryModal
          categories={categories}
          onClose={() => setShowCatModal(false)}
          onSave={saveCategory}
          onDelete={deleteCategory}
        />
      )}
  
      {/* 사이드바 — 모바일에서 편집/조회 중이면 숨김 */}
      {(!isMobile || (!isEditing && !selected)) && (
        <div style={{
          width: isMobile ? '100%' : 260,
          borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', flexShrink: 0,
        }}>
          {/* 상단 */}
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Link href="/" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: '0.75rem' }}>
                ← 대시보드
              </Link>
              <button
                onClick={() => {
                  setSelected(null)
                  setIsEditing(true)
                  setForm({ title: '', content: '', category: categories[0]?.name ?? '기타' })
                }}
                style={{
                  background: 'var(--accent)', color: '#fff', border: 'none',
                  borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700,
                }}
              >
                + 새 메모
              </button>
            </div>
  
            {/* 카테고리 목록 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {allCategories.map(cat => {
                const catObj = categories.find(c => c.name === cat)
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      background: selectedCategory === cat ? 'rgba(59,130,246,0.15)' : 'none',
                      color: selectedCategory === cat ? 'var(--text)' : 'var(--muted)',
                      border: 'none', borderRadius: 6, padding: '7px 10px',
                      cursor: 'pointer', fontSize: '0.75rem', textAlign: 'left',
                      borderLeft: selectedCategory === cat ? `3px solid ${catObj?.color ?? 'var(--accent)'}` : '3px solid transparent',
                    }}
                  >
                    {catObj && <div style={{ width: 8, height: 8, borderRadius: '50%', background: catObj.color }} />}
                    {cat}
                    <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--muted)' }}>
                      {cat === '전체' ? memos.length : memos.filter(m => m.category === cat).length}
                    </span>
                  </button>
                )
              })}
            </div>
  
            <button
              onClick={() => setShowCatModal(true)}
              style={{
                width: '100%', marginTop: 8,
                background: 'none', border: '1px solid var(--border)',
                borderRadius: 6, padding: '6px', cursor: 'pointer',
                color: 'var(--muted)', fontSize: '0.7rem',
              }}
            >
              ⚙️ 카테고리 관리
            </button>
          </div>
  
          {/* 메모 목록 */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: 20, color: 'var(--muted)', fontSize: '0.75rem', textAlign: 'center' }}>로딩 중...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 20, color: 'var(--muted)', fontSize: '0.75rem', textAlign: 'center' }}>메모 없음</div>
            ) : filtered.map(memo => {
              const catObj = categories.find(c => c.name === memo.category)
              return (
                <div
                  key={memo.id}
                  onClick={() => { setSelected(memo); setIsEditing(false) }}
                  style={{
                    padding: '12px 16px', borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    background: selected?.id === memo.id ? 'var(--surface)' : 'transparent',
                    borderLeft: selected?.id === memo.id
                      ? `3px solid ${catObj?.color ?? 'var(--accent)'}`
                      : memo.pinned ? '3px solid var(--accent)' : '3px solid transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                    {memo.pinned && <span style={{ fontSize: '0.65rem' }}>📌</span>}
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {memo.title}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {memo.content.replace(/<[^>]+>/g, '').replace(/\[WATCHLIST_MEMO\][\s\S]*?\[\/WATCHLIST_MEMO\]/, '').trim() || '내용 없음'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '0.65rem', color: catObj?.color ?? 'var(--accent)',
                      background: `${catObj?.color ?? '#3b82f6'}20`, borderRadius: 3, padding: '1px 6px',
                    }}>
                      {memo.category}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>
                      {new Date(memo.updated_at).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
  
      {/* 메인 영역 — 모바일에서 selected 또는 isEditing 일 때만 표시 */}
      {(!isMobile || isEditing || selected) && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {isEditing ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 24, gap: 12, overflow: 'hidden' }}>
  
              {/* PC: 한 줄 / 모바일: 두 줄 */}
              {isMobile ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="제목"
                    autoFocus
                    style={{
                      width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: '0.85rem', fontWeight: 700,
                    }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select
                      value={form.category}
                      onChange={e => setForm({ ...form, category: e.target.value })}
                      style={{
                        flex: 1, background: 'var(--surface)', border: '1px solid var(--border)',
                        borderRadius: 8, padding: '10px 12px', color: 'var(--text)', fontSize: '0.75rem',
                      }}
                    >
                      {categories.map(c => <option key={c.id}>{c.name}</option>)}
                    </select>
                    <button
                      onClick={() => { setIsEditing(false); setSelected(null) }}
                      style={{
                        background: 'none', border: '1px solid var(--border)',
                        borderRadius: 8, padding: '10px 16px', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.75rem',
                      }}
                    >
                      취소
                    </button>
                    <button
                      onClick={saveMemo}
                      style={{
                        background: 'var(--accent)', color: '#fff', border: 'none',
                        borderRadius: 8, padding: '10px 16px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700,
                      }}
                    >
                      저장
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="제목"
                    autoFocus
                    style={{
                      flex: 1, background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: '0.85rem', fontWeight: 700,
                    }}
                  />
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    style={{
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 8, padding: '10px 12px', color: 'var(--text)', fontSize: '0.75rem',
                    }}
                  >
                    {categories.map(c => <option key={c.id}>{c.name}</option>)}
                  </select>
                  <button
                    onClick={() => { setIsEditing(false); setSelected(null) }}
                    style={{
                      background: 'none', border: '1px solid var(--border)',
                      borderRadius: 8, padding: '10px 14px', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.75rem',
                    }}
                  >
                    취소
                  </button>
                  <button
                    onClick={saveMemo}
                    style={{
                      background: 'var(--accent)', color: '#fff', border: 'none',
                      borderRadius: 8, padding: '10px 18px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700,
                    }}
                  >
                    저장
                  </button>
                </div>
              )}
  
              <RichEditor
                content={form.content}
                onChange={(html) => {
                  const match = selected?.content.match(/\[WATCHLIST_MEMO\][\s\S]*?\[\/WATCHLIST_MEMO\]/)
                  const prefix = match ? match[0] : ''
                  setForm({ ...form, content: prefix + html })
                }}
                editable={true}
              />
            </div>
  
          ) : selected ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
  
              {/* 모바일 뒤로가기 */}
              {isMobile && (
                <div style={{
                  padding: '12px 16px', borderBottom: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <button
                    onClick={() => setSelected(null)}
                    style={{
                      background: 'none', border: 'none',
                      color: 'var(--accent)', cursor: 'pointer', fontSize: '0.85rem',
                    }}
                  >
                    ← 목록
                  </button>
                </div>
              )}
  
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 24, overflow: 'auto' }}>
                {/* 헤더 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 6 }}>{selected.title}</div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      {(() => {
                        const catObj = categories.find(c => c.name === selected.category)
                        return (
                          <span style={{ fontSize: '0.7rem', color: catObj?.color ?? 'var(--accent)', background: `${catObj?.color ?? '#3b82f6'}20`, borderRadius: 3, padding: '2px 8px' }}>
                            {selected.category}
                          </span>
                        )
                      })()}
                      <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                        {new Date(selected.updated_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      onClick={() => togglePin(selected.id, selected.pinned)}
                      style={{
                        background: selected.pinned ? 'var(--accent)' : 'var(--surface)',
                        border: '1px solid var(--border)', borderRadius: 8, padding: '7px 14px',
                        color: selected.pinned ? '#fff' : 'var(--muted)', cursor: 'pointer', fontSize: '0.75rem',
                      }}
                    >
                      {selected.pinned ? '📌 고정됨' : '📌 고정'}
                    </button>
                    <button
                      onClick={() => { setIsEditing(true); setForm({ title: selected.title, content: selected.content, category: selected.category }) }}
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 14px', color: 'var(--text)', cursor: 'pointer', fontSize: '0.75rem' }}
                    >
                      ✏️ 수정
                    </button>
                    <button
                      onClick={() => deleteMemo(selected.id)}
                      style={{ background: 'none', border: '1px solid var(--down)', borderRadius: 8, padding: '7px 14px', color: 'var(--down)', cursor: 'pointer', fontSize: '0.75rem' }}
                    >
                      삭제
                    </button>
                  </div>
                </div>
  
                {/* 관심종목 인라인 박스 */}
                {selected.linked_symbol && (() => {
                  const match = selected.content.match(/\[WATCHLIST_MEMO\]([\s\S]*?)\[\/WATCHLIST_MEMO\]/)
                  if (!match) return null
                  return (
                    <div style={{
                      background: 'var(--surface2)', border: '1px solid var(--accent)',
                      borderLeft: '3px solid var(--accent)', borderRadius: 8,
                      padding: '10px 14px', marginBottom: 12,
                    }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--accent)', marginBottom: 6, fontWeight: 700 }}>
                        📌 관심종목 메모
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                        {match[1]}
                      </div>
                    </div>
                  )
                })()}
  
                <RichEditor
                  content={selected.content.replace(/\[WATCHLIST_MEMO\][\s\S]*?\[\/WATCHLIST_MEMO\]/, '')}
                  onChange={() => {}}
                  editable={false}
                />
              </div>
            </div>
  
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: '2rem' }}>📝</div>
              <div style={{ fontSize: '0.8rem' }}>메모를 선택하거나 새 메모를 작성하세요</div>
            </div>
          )}
        </div>
      )}
    </div>
  )  
}