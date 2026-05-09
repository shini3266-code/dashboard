'use client'
import { useState } from 'react'
import { Category, DEFAULT_COLORS } from '../types'

export default function CategoryModal({ categories, onClose, onSave, onDelete }: {
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
    onSave({ name: form.name, color: form.color }, editId ?? undefined)
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
          <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>카테고리 관리</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
        </div>

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
                      borderRadius: 6, padding: '4px 8px', color: 'var(--text)', fontSize: '0.75rem', width: '100%',
                    }}
                  />
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {DEFAULT_COLORS.map(c => (
                      <div key={c} onClick={() => setForm({ ...form, color: c })} style={{
                        width: 16, height: 16, borderRadius: '50%', background: c, cursor: 'pointer',
                        outline: form.color === c ? '2px solid white' : 'none', outlineOffset: 1,
                      }} />
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => { setEditId(null); setForm({ name: '', color: DEFAULT_COLORS[0] }) }}
                      style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 10px', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.7rem' }}>
                      취소
                    </button>
                    <button onClick={() => { onSave({ name: form.name, color: form.color }, cat.id); setEditId(null); setForm({ name: '', color: DEFAULT_COLORS[0] }) }}
                      style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontSize: '0.7rem' }}>
                      저장
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: cat.color }} />
                    <span style={{ fontSize: '0.75rem' }}>{cat.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => startEdit(cat)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.75rem' }}>✏️</button>
                    <button onClick={() => { if (confirm(`"${cat.name}" 삭제할까요?`)) onDelete(cat.id) }}
                      style={{ background: 'none', border: 'none', color: 'var(--down)', cursor: 'pointer', fontSize: '0.75rem' }}>🗑️</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginBottom: 8 }}>새 카테고리 추가</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              placeholder="카테고리 이름"
              style={{
                flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: '0.75rem',
              }}
            />
            <button onClick={handleSave} style={{
              background: 'var(--accent)', color: '#fff', border: 'none',
              borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700,
            }}>추가</button>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            {DEFAULT_COLORS.map(c => (
              <div key={c} onClick={() => setForm({ ...form, color: c })} style={{
                width: 18, height: 18, borderRadius: '50%', background: c, cursor: 'pointer',
                outline: form.color === c ? '2px solid white' : 'none', outlineOffset: 2,
              }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
