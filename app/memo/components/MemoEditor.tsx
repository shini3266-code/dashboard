'use client'
import RichEditor from '../RichEditor'
import { Memo, Category } from '../types'

export default function MemoEditor({ form, setForm, categories, selected, isMobile, onSave, onCancel }: {
  form: { title: string; content: string; category: string }
  setForm: (f: any) => void
  categories: Category[]
  selected: Memo | null
  isMobile: boolean
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 24, gap: 12, overflow: 'hidden' }}>
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
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{
              flex: 1, background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '10px 12px', color: 'var(--text)', fontSize: '0.75rem',
            }}>
              {categories.map(c => <option key={c.id}>{c.name}</option>)}
            </select>
            <button onClick={onCancel} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 16px', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.75rem' }}>
              취소
            </button>
            <button onClick={onSave} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 16px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
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
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '10px 12px', color: 'var(--text)', fontSize: '0.75rem',
          }}>
            {categories.map(c => <option key={c.id}>{c.name}</option>)}
          </select>
          <button onClick={onCancel} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.75rem' }}>
            취소
          </button>
          <button onClick={onSave} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
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
  )
}
