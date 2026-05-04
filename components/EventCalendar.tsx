'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function getDeviceId() {
  let id = localStorage.getItem('device_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('device_id', id)
  }
  return id
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

export default function EventCalendar() {
  const [events, setEvents] = useState<CalEvent[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ date: '', title: '', category: 'FOMC' as CalEvent['category'], memo: '' })
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [loadingDb, setLoadingDb] = useState(true)

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

  async function addEvent() {
    if (!form.date || !form.title) return
    const deviceId = getDeviceId()

    const { data: inserted, error } = await supabase
      .from('events')
      .insert({
        device_id: deviceId,
        date: form.date,
        title: form.title,
        category: form.category,
        memo: form.memo,
      })
      .select()
      .single()

    if (error) {
      alert('저장 실패: ' + error.message)
      return
    }

    setEvents(prev => [...prev, inserted].sort((a, b) => a.date.localeCompare(b.date)))
    setForm({ date: '', title: '', category: 'FOMC', memo: '' })
    setShowForm(false)
  }

  async function deleteEvent(id: string) {
    await supabase.from('events').delete().eq('id', id)
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  async function updateEventMemo(id: string, memo: string) {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, memo } : e))
    await supabase.from('events').update({ memo }).eq('id', id)
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
    .slice(0, 8)

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '16px', marginBottom: 8,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            background: 'var(--accent)', color: '#fff', border: 'none',
            borderRadius: 6, padding: '5px 12px', cursor: 'pointer',
            fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
          }}
        >
          + 이벤트 추가
        </button>
      </div>

      {/* 이벤트 추가 폼 */}
      {showForm && (
        <div style={{
          background: 'var(--surface2)', borderRadius: 8, padding: 14,
          marginBottom: 16, display: 'grid', gap: 8,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
              style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 6, padding: '7px 10px', color: 'var(--text)',
                fontFamily: 'var(--mono)', fontSize: 12,
              }}
            />
            <select
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value as CalEvent['category'] })}
              style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 6, padding: '7px 10px', color: 'var(--text)',
                fontFamily: 'var(--mono)', fontSize: 12,
              }}
            >
              <option>FOMC</option>
              <option>경제지표</option>
              <option>실적</option>
              <option>기타</option>
            </select>
          </div>
          <input
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            placeholder="이벤트 제목 (예: FOMC 회의, CPI 발표)"
            style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 6, padding: '7px 10px', color: 'var(--text)',
              fontFamily: 'var(--mono)', fontSize: 12,
            }}
          />
          <textarea
            value={form.memo}
            onChange={e => setForm({ ...form, memo: e.target.value })}
            placeholder="메모 (예: 금리 동결 예상, 컨센서스 3.2%)"
            rows={2}
            spellCheck={false}
            style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 6, padding: '7px 10px', color: 'var(--text)',
              fontFamily: 'var(--mono)', fontSize: 12, resize: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowForm(false)}
              style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 12px', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 11 }}
            >
              취소
            </button>
            <button
              onClick={addEvent}
              style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700 }}
            >
              저장
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>
        {/* 달력 */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <button
              onClick={() => setCurrentMonth(new Date(year, month - 1))}
              style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 16 }}
            >‹</button>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700 }}>
              {year}년 {month + 1}월
            </div>
            <button
              onClick={() => setCurrentMonth(new Date(year, month + 1))}
              style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 16 }}
            >›</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
            {['일', '월', '화', '수', '목', '금', '토'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)', padding: '4px 0' }}>
                {d}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {cells.map((day, i) => {
              if (!day) return <div key={i} />
              const ds = dateStr(day)
              const dayEvents = eventsOnDay(day)
              const isToday = ds === today
              return (
                <div key={i} style={{
                  minHeight: 65,
                  background: isToday ? 'rgba(59,130,246,0.15)' : 'var(--surface2)',
                  border: isToday ? '1px solid var(--accent)' : '1px solid var(--border)',
                  borderRadius: 6, padding: '4px 5px',
                }}>
                  <div style={{
                    fontSize: 11, fontFamily: 'var(--mono)',
                    color: isToday ? 'var(--accent)' : 'var(--muted)',
                    fontWeight: isToday ? 700 : 400, marginBottom: 2,
                  }}>
                    {day}
                  </div>
                  {dayEvents.map(ev => (
                    <div
                      key={ev.id}
                      title={`${ev.title}${ev.memo ? '\n' + ev.memo : ''}`}
                      style={{
                        fontSize: 11, fontFamily: 'var(--mono)',
                        background: CATEGORY_COLORS[ev.category],
                        color: '#fff', borderRadius: 3,
                        padding: '1px 4px', marginBottom: 2,
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap', cursor: 'pointer',
                      }}
                      onClick={() => deleteEvent(ev.id)}
                    >
                      {ev.title}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
          <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)', marginTop: 6 }}>
            * 이벤트 클릭시 삭제
          </div>
        </div>

        {/* 임박한 이벤트 */}
        <div>
          <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)', marginBottom: 10, letterSpacing: '0.08em' }}>
            임박한 이벤트
          </div>
          {loadingDb ? (
            <div style={{ color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 12, textAlign: 'center', padding: 20 }}>
              로딩 중...
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div style={{ color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 12, textAlign: 'center', padding: 20 }}>
              예정된 이벤트 없음
            </div>
          ) : (
            upcomingEvents.map(ev => {
              const daysLeft = Math.ceil((new Date(ev.date).getTime() - new Date(today).getTime()) / 86400000)
              return (
                <div key={ev.id} style={{
                  background: 'var(--surface2)',
                  border: `1px solid ${CATEGORY_COLORS[ev.category]}40`,
                  borderLeft: `3px solid ${CATEGORY_COLORS[ev.category]}`,
                  borderRadius: 6, padding: '8px 10px', marginBottom: 6,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 11, fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--text)' }}>
                      {ev.title}
                    </div>
                    <div style={{
                      fontSize: 10, fontFamily: 'var(--mono)',
                      color: daysLeft <= 3 ? 'var(--down)' : daysLeft <= 7 ? 'var(--gold)' : 'var(--muted)',
                      fontWeight: daysLeft <= 7 ? 700 : 400,
                    }}>
                      {daysLeft === 0 ? '오늘' : daysLeft === 1 ? '내일' : `D-${daysLeft}`}
                    </div>
                  </div>
                  <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)', marginTop: 2 }}>
                    {ev.date} · {ev.category}
                  </div>
                  {/* 메모 인라인 편집 */}
                  <textarea
                    value={ev.memo}
                    onChange={e => updateEventMemo(ev.id, e.target.value)}
                    placeholder="메모 추가..."
                    rows={2}
                    spellCheck={false}
                    style={{
                      width: '100%', marginTop: 6,
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 4, padding: '4px 8px', color: 'var(--text)',
                      fontFamily: 'var(--mono)', fontSize: 11, resize: 'none',
                    }}
                  />
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}