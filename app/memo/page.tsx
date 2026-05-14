'use client'
import { useState, useEffect } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'
import { supabase } from '@/lib/supabase'
import { Memo, Category } from './types'
import CategoryModal from './components/CategoryModal'
import MemoSidebar from './components/MemoSidebar'
import MemoViewer from './components/MemoViewer'
import MemoEditor from './components/MemoEditor'

export default function MemoPage() {
  const isMobile = useIsMobile()
  const [memos, setMemos] = useState<Memo[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState('전체')
  const [selected, setSelected] = useState<Memo | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', category: '' })
  const [loading, setLoading] = useState(true)
  const [showCatModal, setShowCatModal] = useState(false)
  const [showTrash, setShowTrash] = useState(false)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const [{ data: memoData }, { data: catData }] = await Promise.all([
      supabase.from('memos').select('*').order('updated_at', { ascending: false }),
      supabase.from('memo_categories').select('*').order('created_at', { ascending: true }),
    ])
    if (memoData) setMemos(memoData)
    if (catData) setCategories(catData)
    setLoading(false)
  }

  async function saveCategory(data: Omit<Category, 'id'>, editId?: string) {
    if (editId) {
      const { data: updated } = await supabase.from('memo_categories').update({ name: data.name, color: data.color }).eq('id', editId).select().single()
      if (updated) setCategories(prev => prev.map(c => c.id === editId ? (updated as Category) : c))
    } else {
      const { data: inserted } = await supabase.from('memo_categories').insert({ name: data.name, color: data.color }).select().single()
      if (inserted) setCategories(prev => [...prev, inserted as Category])
    }
  }

  async function deleteCategory(id: string) {
    await supabase.from('memo_categories').delete().eq('id', id)
    setCategories(prev => prev.filter(c => c.id !== id))
  }

  async function togglePin(id: string, pinned: boolean) {
    await supabase.from('memos').update({ pinned: !pinned }).eq('id', id)
    setMemos(prev => prev.map(m => m.id === id ? { ...m, pinned: !pinned } : m))
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, pinned: !pinned } : null)
  }

  async function saveMemo() {
    if (!form.title.trim()) return
    const category = form.category || categories[0]?.name || '기타'
    const now = new Date().toISOString()  // UTC, 인자 없이
  
    if (selected && isEditing) {
      const { data } = await supabase
        .from('memos')
        .update({ ...form, category, updated_at: now })
        .eq('id', selected.id).select().single()
      if (data) { setMemos(prev => prev.map(m => m.id === data.id ? data : m)); setSelected(data) }
    } else {
      const { data } = await supabase
        .from('memos')
        .insert({ ...form, category, created_at: now, updated_at: now })
        .select().single()
      if (data) { setMemos(prev => [data, ...prev]); setSelected(data) }
    }
    setIsEditing(false)
  }

  async function deleteMemo(id: string) {
    if (!confirm('메모를 삭제할까요?')) return
    const now = new Date().toISOString()
    await supabase.from('memos').update({ deleted_at: now }).eq('id', id)
    setMemos(prev => prev.map(m => m.id === id ? { ...m, deleted_at: now } : m))
    setSelected(null)
  }

  async function restoreMemo(id: string) {
    await supabase.from('memos').update({ deleted_at: null }).eq('id', id)
    setMemos(prev => prev.map(m => m.id === id ? { ...m, deleted_at: null } : m))
  }

  async function permanentDelete(id: string) {
    if (!confirm('영구 삭제할까요? 복원할 수 없습니다.')) return
    await supabase.from('memos').delete().eq('id', id)
    setMemos(prev => prev.filter(m => m.id !== id))
    setSelected(null)
  }

  const filtered = (selectedCategory === '전체' ? memos.filter(m => !m.deleted_at) : memos.filter(m => m.category === selectedCategory && !m.deleted_at))
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })
  
  const trashed = memos.filter(m => m.deleted_at)

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>

      {showCatModal && (
        <CategoryModal
          categories={categories}
          onClose={() => setShowCatModal(false)}
          onSave={saveCategory}
          onDelete={deleteCategory}
        />
      )}

      {/* 사이드바 */}
      {(!isMobile || (!isEditing && !selected)) && (
        <div style={{ width: isMobile ? '100%' : 260, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <MemoSidebar
            memos={memos}
            categories={categories}
            filtered={filtered}
            selected={selected}
            selectedCategory={selectedCategory}
            loading={loading}
            onSelect={(memo) => { setSelected(memo); setIsEditing(false) }}
            onNew={() => { setSelected(null); setIsEditing(true); setForm({ title: '', content: '', category: categories[0]?.name ?? '기타' }) }}
            onCategoryChange={setSelectedCategory}
            onShowCatModal={() => setShowCatModal(true)}
            onShowTrash={() => setShowTrash(true)}
            trashedCount={trashed.length}
          />
        </div>
      )}

      {/* 메인 */}
      {(!isMobile || isEditing || selected) && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {isEditing ? (
            <MemoEditor
              form={form}
              setForm={setForm}
              categories={categories}
              selected={selected}
              isMobile={isMobile}
              onSave={saveMemo}
              onCancel={() => { setIsEditing(false); setSelected(null) }}
            />
          ) : showTrash ? (
            <TrashViewer
              memos={trashed}
              onRestore={restoreMemo}
              onPermanentDelete={permanentDelete}
              onClose={() => setShowTrash(false)}
            />
          ) : selected ? (
            <MemoViewer
              selected={selected}
              categories={categories}
              isMobile={isMobile}
              onBack={() => setSelected(null)}
              onEdit={() => { setIsEditing(true); setForm({ title: selected.title, content: selected.content, category: selected.category }) }}
              onDelete={() => deleteMemo(selected.id)}
              onTogglePin={() => togglePin(selected.id, selected.pinned)}
            />
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
