'use client'
import Link from 'next/link'
import { Memo, Category } from '../types'

export default function MemoSidebar({ memos, categories, filtered, selected, selectedCategory, loading, onSelect, onNew, onCategoryChange, onShowCatModal }: {
  memos: Memo[]
  categories: Category[]
  filtered: Memo[]
  selected: Memo | null
  selectedCategory: string
  loading: boolean
  onSelect: (memo: Memo) => void
  onNew: () => void
  onCategoryChange: (cat: string) => void
  onShowCatModal: () => void
  onShowTrash: () => void
  trashedCount: number
}) {
  const allCategories = ['전체', ...categories.map(c => c.name)]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Link href="/" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: '1.3rem' }}>
            ← 대시보드
          </Link>
          <button onClick={onNew} style={{
            background: 'var(--accent)', color: '#fff', border: 'none',
            borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: '1.3rem', fontWeight: 700,
          }}>
            + 새 메모
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {allCategories.map(cat => {
            const catObj = categories.find(c => c.name === cat)
            return (
              <button key={cat} onClick={() => onCategoryChange(cat)} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: selectedCategory === cat ? 'rgba(59,130,246,0.15)' : 'none',
                color: selectedCategory === cat ? 'var(--text)' : 'var(--muted)',
                border: 'none', borderRadius: 6, padding: '7px 10px',
                cursor: 'pointer', fontSize: '1.3rem', textAlign: 'left',
                borderLeft: selectedCategory === cat ? `3px solid ${catObj?.color ?? 'var(--accent)'}` : '3px solid transparent',
              }}>
                {catObj && <div style={{ width: 8, height: 8, borderRadius: '50%', background: catObj.color }} />}
                {cat}
                <span style={{ marginLeft: 'auto', fontSize: '1.3rem', color: 'var(--muted)' }}>
                  {cat === '전체' ? memos.length : memos.filter(m => m.category === cat).length}
                </span>
              </button>
            )
          })}
        </div>

        <button onClick={onShowCatModal} style={{
          width: '100%', marginTop: 8, background: 'none', border: '1px solid var(--border)',
          borderRadius: 6, padding: '6px', cursor: 'pointer', color: 'var(--muted)', fontSize: '1.3rem',
        }}>
          ⚙️ 카테고리 관리
        </button>
        <button onClick={onShowTrash} style={{
          width: '100%', marginTop: 6, background: 'none', border: '1px solid var(--border)',
          borderRadius: 6, padding: '6px', cursor: 'pointer', color: 'var(--muted)', fontSize: '1.3rem',
        }}>
          🗑️ 휴지통 {trashedCount > 0 && `(${trashedCount})`}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: 20, color: 'var(--muted)', fontSize: '1.3rem', textAlign: 'center' }}>로딩 중...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 20, color: 'var(--muted)', fontSize: '1.3rem', textAlign: 'center' }}>메모 없음</div>
        ) : filtered.map(memo => {
          const catObj = categories.find(c => c.name === memo.category)
          return (
            <div key={memo.id} onClick={() => onSelect(memo)} style={{
              padding: '12px 16px', borderBottom: '1px solid var(--border)',
              cursor: 'pointer',
              background: selected?.id === memo.id ? 'var(--surface)' : 'transparent',
              borderLeft: selected?.id === memo.id
                ? `3px solid ${catObj?.color ?? 'var(--accent)'}`
                : memo.pinned ? '3px solid var(--accent)' : '3px solid transparent',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                {memo.pinned && <span style={{ fontSize: '1.3rem' }}>📌</span>}
                <div style={{ fontSize: '1.3rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {memo.title}
                </div>
              </div>
              <div style={{ fontSize: '1.3rem', color: 'var(--muted)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {memo.content.replace(/<[^>]+>/g, '').replace(/\[WATCHLIST_MEMO\][\s\S]*?\[\/WATCHLIST_MEMO\]/, '').trim() || '내용 없음'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.3rem', color: catObj?.color ?? 'var(--accent)', background: `${catObj?.color ?? '#3b82f6'}20`, borderRadius: 3, padding: '1px 6px' }}>
                  {memo.category}
                </span>
                <span style={{ fontSize: '1.3rem', color: 'var(--muted)' }}>
                  {new Date(memo.updated_at).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
