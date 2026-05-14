'use client'
import { Memo } from '../types'

export default function TrashViewer({ memos, onRestore, onPermanentDelete, onClose }: {
  memos: Memo[]
  onRestore: (id: string) => void
  onPermanentDelete: (id: string) => void
  onClose: () => void
}) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>🗑️ 휴지통 ({memos.length})</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: '1.3rem' }}>← 돌아가기</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {memos.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: '1.3rem' }}>휴지통이 비어있습니다</div>
        ) : memos.map(memo => (
          <div key={memo.id} style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{memo.title}</div>
              <div style={{ fontSize: '1.3rem', color: 'var(--muted)' }}>
                {new Date(memo.deleted_at!).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })} 삭제됨
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button onClick={() => onRestore(memo.id)} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 14px', color: 'var(--text)', cursor: 'pointer', fontSize: '1.3rem' }}>
                복원
              </button>
              <button onClick={() => onPermanentDelete(memo.id)} style={{ background: 'none', border: '1px solid var(--down)', borderRadius: 8, padding: '6px 14px', color: 'var(--down)', cursor: 'pointer', fontSize: '1.3rem' }}>
                영구삭제
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}