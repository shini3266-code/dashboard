'use client'
import RichEditor from '@/components/RichEditor'
import { Memo, Category } from '../types'

export default function MemoViewer({ selected, categories, isMobile, onBack, onEdit, onDelete, onTogglePin }: {
  selected: Memo
  categories: Category[]
  isMobile: boolean
  onBack: () => void
  onEdit: () => void
  onDelete: () => void
  onTogglePin: () => void
}) {
  const catObj = categories.find(c => c.name === selected.category)
  const watchlistMatch = selected.content.match(/\[WATCHLIST_MEMO\]([\s\S]*?)\[\/WATCHLIST_MEMO\]/)
  const cleanContent = selected.content.replace(/\[WATCHLIST_MEMO\][\s\S]*?\[\/WATCHLIST_MEMO\]/, '')

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {isMobile && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.85rem' }}>
            ← 목록
          </button>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 24, overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 6 }}>{selected.title}</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: catObj?.color ?? 'var(--accent)', background: `${catObj?.color ?? '#3b82f6'}20`, borderRadius: 3, padding: '2px 8px' }}>
                {selected.category}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                {new Date(selected.updated_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={onTogglePin} style={{
              background: selected.pinned ? 'var(--accent)' : 'var(--surface)',
              border: '1px solid var(--border)', borderRadius: 8, padding: '7px 14px',
              color: selected.pinned ? '#fff' : 'var(--muted)', cursor: 'pointer', fontSize: '0.75rem',
            }}>
              {selected.pinned ? '📌 고정됨' : '📌 고정'}
            </button>
            <button onClick={onEdit} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 14px', color: 'var(--text)', cursor: 'pointer', fontSize: '0.75rem' }}>
              수정
            </button>
            <button onClick={onDelete} style={{ background: 'none', border: '1px solid var(--down)', borderRadius: 8, padding: '7px 14px', color: 'var(--down)', cursor: 'pointer', fontSize: '0.75rem' }}>
              삭제
            </button>
          </div>
        </div>

        {watchlistMatch && (
          <div style={{
            background: 'var(--surface2)', border: '1px solid var(--accent)',
            borderLeft: '3px solid var(--accent)', borderRadius: 8, padding: '10px 14px', marginBottom: 12,
          }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--accent)', marginBottom: 6, fontWeight: 700 }}>📌 관심종목 메모</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{watchlistMatch[1]}</div>
          </div>
        )}

        <RichEditor content={cleanContent} onChange={() => {}} editable={false} />
      </div>
    </div>
  )
}
