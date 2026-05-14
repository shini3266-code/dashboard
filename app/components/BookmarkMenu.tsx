'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function BookmarkMenu() {
  const [open, setOpen] = useState(false)
  const [bookmarks, setBookmarks] = useState<{ id: string; name: string; url: string }[]>([])
  const [form, setForm] = useState({ name: '', url: '' })
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('bookmarks').select('*').order('created_at', { ascending: true })
    if (data) setBookmarks(data)
  }

  async function addBookmark() {
    if (!form.name.trim() || !form.url.trim()) return
    const url = form.url.startsWith('http') ? form.url : `https://${form.url}`
    const { data } = await supabase.from('bookmarks').insert({ name: form.name, url }).select().single()
    if (data) setBookmarks(prev => [...prev, data])
    setForm({ name: '', url: '' })
    setShowForm(false)
  }

  async function removeBookmark(id: string) {
    await supabase.from('bookmarks').delete().eq('id', id)
    setBookmarks(prev => prev.filter(b => b.id !== id))
  }

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(prev => !prev)} style={{
        display: 'flex', alignItems: 'center', gap: 5,
        background: open ? 'var(--accent)' : 'var(--surface)',
        border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px',
        color: open ? '#fff' : 'var(--text)', cursor: 'pointer', fontSize: '1.3rem',
      }}>
        🔖 북마크
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
          <div style={{
            position: 'absolute', top: '100%', right: 0, marginTop: 6,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 10, padding: 12, zIndex: 100,
            minWidth: 240, maxWidth: 320,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}>
            <div style={{ fontSize: '1.3rem', color: 'var(--muted)', marginBottom: 8 }}>북마크</div>

            {bookmarks.length === 0 ? (
              <div style={{ fontSize: '1.3rem', color: 'var(--muted)', textAlign: 'center', padding: '8px 0' }}>북마크가 없어요</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
                {bookmarks.map(bm => (
                  <div key={bm.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: 'var(--surface2)', borderRadius: 6 }}>
                    <a href={bm.url} target="_blank" rel="noreferrer" onClick={() => setOpen(false)}
                      style={{ fontSize: '1.3rem', color: 'var(--text)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {bm.name}
                    </a>
                    <button onClick={() => removeBookmark(bm.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.3rem', flexShrink: 0 }}>✕</button>
                  </div>
                ))}
              </div>
            )}

            {showForm ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="북마크 이름" autoFocus
                  style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', color: 'var(--text)', fontSize: '1.3rem' }} />
                <input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} onKeyDown={e => e.key === 'Enter' && addBookmark()} placeholder="URL"
                  style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', color: 'var(--text)', fontSize: '1.3rem' }} />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => { setShowForm(false); setForm({ name: '', url: '' }) }}
                    style={{ flex: 1, background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '5px', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.3rem' }}>취소</button>
                  <button onClick={addBookmark}
                    style={{ flex: 1, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6, padding: '5px', cursor: 'pointer', fontSize: '1.3rem', fontWeight: 700 }}>추가</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowForm(true)}
                style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.3rem' }}>
                + 북마크 추가
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
