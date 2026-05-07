'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function getDeviceId() {
  return 'my-dashboard-user'
}

interface CalEvent {
  id: string
  date: string
  title: string
  category: 'FOMC' | '경제지표' | '실적' | '기타'
  memo: string
}

const CATEGORY_COLORS = {
  'FOMC': '#3b82f6',
  '경제지표': '#f59e0b',
  '실적': '#10b981',
  '기타': '#64748b',
}

// ── 일정 추가/수정 팝업 ────────────────────────────
function EventModal({
  date,
  event,
  onClose,
  onSave,
  onDelete,
}: {
  date: string
  event?: CalEvent
  onClose: () => void
  onSave: (data: Omit<CalEvent, 'id'>) => void
  onDelete?: () => void
}) {
  const [form, setForm] = useState({
    title: event?.title ?? '',
    category: event?.category ?? 'FOMC' as CalEvent['category'],
    memo: event?.memo ?? '',
  })

  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 12, padding: 24, width: '100%', maxWidth: 480,
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700 }}>
              {event ? '일정 수정' : '일정 추가'}
            </div>
            <div style={{ fontSize: '0.6rem', color: 'var(--muted)', marginTop: 2 }}>{date}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 20 }}>✕</button>
        </div>

        {/* 카테고리 */}
        <select
          value={form.category}
          onChange={e => setForm({ ...form, category: e.target.value as CalEvent['category'] })}
          style={{
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: '0.6rem',
          }}
        >
          <option>FOMC</option>
          <option>경제지표</option>
          <option>실적</option>
          <option>기타</option>
        </select>

        {/* 제목 */}
        <input
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          placeholder="이벤트 제목 (예: FOMC 회의, CPI 발표)"
          autoFocus
          style={{
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: '0.6rem',
          }}
        />

        {/* 메모 */}
        <textarea
          value={form.memo}
          onChange={e => setForm({ ...form, memo: e.target.value })}
          placeholder="메모 (선택사항)"
          rows={3}
          spellCheck={false}
          style={{
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '8px 12px', color: 'var(--text)',
            fontSize: '0.6rem', resize: 'none',
          }}
        />

        {/* 버튼 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          {/* 삭제 버튼 (수정 모드일 때만) */}
          <div>
            {onDelete && (
              <button
                onClick={onDelete}
                style={{
                  background: 'none', border: '1px solid var(--down)',
                  borderRadius: 8, padding: '7px 14px',
                  color: 'var(--down)', cursor: 'pointer', fontSize: '0.6rem',
                }}
              >
                삭제
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onClose}
              style={{
                background: 'none', border: '1px solid var(--border)',
                borderRadius: 8, padding: '7px 14px',
                color: 'var(--muted)', cursor: 'pointer', fontSize: '0.6rem',
              }}
            >
              취소
            </button>
            <button
              onClick={() => {
                if (!form.title.trim()) return
                onSave({ date, title: form.title, category: form.category, memo: form.memo })
              }}
              style={{
                background: 'var(--accent)', color: '#fff', border: 'none',
                borderRadius: 8, padding: '7px 18px',
                cursor: 'pointer', fontSize: '0.6rem', fontWeight: 700,
              }}
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── 메인 캘린더 ────────────────────────────────────
export default function EventCalendar() {
  const [events, setEvents] = useState<CalEvent[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [loadingDb, setLoadingDb] = useState(true)

  // 팝업 상태
  const [addModal, setAddModal] = useState<{ date: string } | null>(null)
  const [editModal, setEditModal] = useState<CalEvent | null>(null)

  useEffect(() => {
    async function load() {
      const deviceId = getDeviceId()
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('device_id', deviceId)
        .order('date', { ascending: true })
      if (data) setEvents(data)
      setLoadingDb(false)
    }
    load()
  }, [])

  // 일정 추가
  async function handleAdd(data: Omit<CalEvent, 'id'>) {
    const deviceId = getDeviceId()
    const { data: inserted, error } = await supabase
      .from('events')
      .insert({ device_id: deviceId, ...data })
      .select()
      .single()
    if (error) { alert('저장 실패: ' + error.message); return }
    setEvents(prev => [...prev, inserted].sort((a, b) => a.date.localeCompare(b.date)))
    setAddModal(null)
  }

  // 일정 수정
  async function handleEdit(data: Omit<CalEvent, 'id'>) {
    if (!editModal) return
    const { error } = await supabase
      .from('events')
      .update({ title: data.title, category: data.category, memo: data.memo })
      .eq('id', editModal.id)
    if (error) { alert('수정 실패: ' + error.message); return }
    setEvents(prev => prev.map(e => e.id === editModal.id ? { ...e, ...data } : e))
    setEditModal(null)
  }

  // 일정 삭제
  async function handleDelete(id: string) {
    const ok = confirm('일정을 삭제할까요?')
    if (!ok) return
    await supabase.from('events').delete().eq('id', id)
    setEvents(prev => prev.filter(e => e.id !== id))
    setEditModal(null)
  }

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date().toISOString().slice(0, 10)

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  function dateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  function eventsOnDay(day: number) {
    return events.filter(e => e.date === dateStr(day))
  }

  const upcomingEvents = events
    .filter(e => e.date >= today)
    .slice(0, 10)

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '16px', marginBottom: 8,
    }}>
      {/* 추가 팝업 */}
      {addModal && (
        <EventModal
          date={addModal.date}
          onClose={() => setAddModal(null)}
          onSave={handleAdd}
        />
      )}

      {/* 수정 팝업 */}
      {editModal && (
        <EventModal
          date={editModal.date}
          event={editModal}
          onClose={() => setEditModal(null)}
          onSave={handleEdit}
          onDelete={() => handleDelete(editModal.id)}
        />
      )}

      <div style={{ fontSize: '0.6rem', color: 'var(--muted)', letterSpacing: '0.08em', marginBottom: 16 }}>
        📅 이벤트 캘린더
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 16 }}>
        {/* 달력 */}
        <div>
          {/* 월 네비게이션 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <button
              onClick={() => setCurrentMonth(new Date(year, month - 1))}
              style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.7rem' }}
            >‹</button>
            <div style={{ fontSize: '0.6rem', fontWeight: 700 }}>
              {year}년 {month + 1}월
            </div>
            <button
              onClick={() => setCurrentMonth(new Date(year, month + 1))}
              style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.7rem' }}
            >›</button>
          </div>

          {/* 요일 헤더 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
            {['일', '월', '화', '수', '목', '금', '토'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '0.6rem', color: 'var(--muted)', padding: '4px 0' }}>
                {d}
              </div>
            ))}
          </div>

          {/* 날짜 셀 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {cells.map((day, i) => {
              if (!day) return <div key={i} />
              const ds = dateStr(day)
              const dayEvents = eventsOnDay(day)
              const isToday = ds === today
              return (
                <div
                  key={i}
                  onClick={() => setAddModal({ date: ds })}  // ← 날짜 클릭 시 추가 팝업
                  style={{
                    minHeight: 56,
                    background: isToday ? 'rgba(59,130,246,0.15)' : 'var(--surface2)',
                    border: isToday ? '1px solid var(--accent)' : '1px solid var(--border)',
                    borderRadius: 6, padding: '4px 5px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{
                    fontSize: '0.6rem',
                    color: isToday ? 'var(--accent)' : 'var(--muted)',
                    fontWeight: isToday ? 700 : 400,
                    marginBottom: 2,
                  }}>
                    {day}
                  </div>
                  {dayEvents.map(ev => (
                    <div
                      key={ev.id}
                      title={ev.title}
                      onClick={(e) => {
                        e.stopPropagation()  // ← 날짜 클릭 이벤트 버블링 방지
                        setEditModal(ev)     // ← 일정 클릭 시 수정 팝업
                      }}
                      style={{
                        fontSize: '0.6rem',
                        background: CATEGORY_COLORS[ev.category],
                        color: '#fff', borderRadius: 3,
                        padding: '1px 4px', marginBottom: 2,
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap', cursor: 'pointer',
                      }}
                    >
                      {ev.title}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
          <div style={{ fontSize: '0.6rem', color: 'var(--muted)', marginTop: 6 }}>
            * 날짜 클릭 = 일정 추가 · 일정 클릭 = 수정/삭제
          </div>
        </div>

        {/* 임박한 이벤트 */}
        <div>
          <div style={{ fontSize: '0.6rem', color: 'var(--muted)', marginBottom: 10, letterSpacing: '0.08em' }}>
            임박한 이벤트
          </div>
          {loadingDb ? (
            <div style={{ color: 'var(--muted)', fontSize: '0.6rem', textAlign: 'center', padding: 20 }}>로딩 중...</div>
          ) : upcomingEvents.length === 0 ? (
            <div style={{ color: 'var(--muted)', fontSize: '0.6rem', textAlign: 'center', padding: 20 }}>예정된 이벤트 없음</div>
          ) : (
            upcomingEvents.map(ev => {
              const daysLeft = Math.ceil((new Date(ev.date).getTime() - new Date(today).getTime()) / 86400000)
              return (
                <div
                  key={ev.id}
                  onClick={() => setEditModal(ev)}  // ← 클릭 시 수정 팝업
                  style={{
                    background: 'var(--surface2)',
                    border: `1px solid ${CATEGORY_COLORS[ev.category]}40`,
                    borderLeft: `3px solid ${CATEGORY_COLORS[ev.category]}`,
                    borderRadius: 6, padding: '8px 10px', marginBottom: 6,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 700 }}>{ev.title}</div>
                    <div style={{
                      fontSize: '0.6rem',
                      color: daysLeft === 0 ? 'var(--down)' : daysLeft <= 3 ? 'var(--down)' : daysLeft <= 7 ? 'var(--gold)' : 'var(--muted)',
                      fontWeight: daysLeft <= 7 ? 700 : 400,
                    }}>
                      {daysLeft === 0 ? '오늘' : daysLeft === 1 ? '내일' : `D-${daysLeft}`}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--muted)', marginTop: 2 }}>
                    {ev.date} · {ev.category}
                  </div>
                  {/* 메모 있을 때만 미리보기 */}
                  {ev.memo && (
                    <div style={{
                      fontSize: '0.6rem', color: 'var(--muted)', marginTop: 4,
                      lineHeight: 1.5, borderTop: '1px solid var(--border)', paddingTop: 4,
                    }}>
                      {ev.memo.split('\n')[0]}
                      {ev.memo.includes('\n') && ' ...'}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}