'use client'
import { useState, useEffect } from 'react'

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

// 이번달 기본 FOMC 일정 (하드코딩 — 나중에 수동 추가 가능)
const DEFAULT_EVENTS: CalEvent[] = [
  { id: '1', date: '2025-05-07', title: 'FOMC 회의', category: 'FOMC', memo: '금리 동결 예상' },
  { id: '2', date: '2025-05-13', title: 'CPI 발표', category: '경제지표', memo: '' },
  { id: '3', date: '2025-05-15', title: 'PPI 발표', category: '경제지표', memo: '' },
  { id: '4', date: '2025-06-11', title: 'FOMC 회의', category: 'FOMC', memo: '' },
]

export default function EventCalendar() {
  const [events, setEvents] = useState<CalEvent[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ date: '', title: '', category: 'FOMC' as CalEvent['category'], memo: '' })
  const [currentMonth, setCurrentMonth] = useState(new Date())

  useEffect(() => {
    const saved = localStorage.getItem('cal_events')
    if (saved) {
      setEvents(JSON.parse(saved))
    } else {
      setEvents(DEFAULT_EVENTS)
      localStorage.setItem('cal_events', JSON.stringify(DEFAULT_EVENTS))
    }
  }, [])

  function save(updated: CalEvent[]) {
    setEvents(updated)
    localStorage.setItem('cal_events', JSON.stringify(updated))
  }

  function addEvent() {
    if (!form.date || !form.title) return
    const newEvent: CalEvent = {
      id: crypto.randomUUID(),
      ...form,
    }
    save([...events, newEvent])
    setForm({ date: '', title: '', category: 'FOMC', memo: '' })
    setShowForm(false)
  }

  function deleteEvent(id: string) {
    save(events.filter(e => e.id !== id))
  }

  // 달력 계산
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

  // 이번달 이후 이벤트 정렬
  const upcomingEvents = events
    .filter(e => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8)

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '16px', marginBottom: 8,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)', letterSpacing: '0.08em' }}>
          📅 이벤트 캘린더
        </div>
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
          {/* 월 네비게이션 */}
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

          {/* 요일 헤더 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
            {['일', '월', '화', '수', '목', '금', '토'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)', padding: '4px 0' }}>
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
                <div key={i} style={{
                  minHeight: 52,
                  background: isToday ? 'rgba(59,130,246,0.15)' : 'var(--surface2)',
                  border: isToday ? '1px solid var(--accent)' : '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '4px 5px',
                }}>
                  <div style={{
                    fontSize: 11, fontFamily: 'var(--mono)',
                    color: isToday ? 'var(--accent)' : 'var(--muted)',
                    fontWeight: isToday ? 700 : 400,
                    marginBottom: 2,
                  }}>
                    {day}
                  </div>
                  {dayEvents.map(ev => (
                    <div
                      key={ev.id}
                      title={`${ev.title}${ev.memo ? '\n' + ev.memo : ''}`}
                      style={{
                        fontSize: 9,
                        fontFamily: 'var(--mono)',
                        background: CATEGORY_COLORS[ev.category],
                        color: '#fff',
                        borderRadius: 3,
                        padding: '1px 4px',
                        marginBottom: 2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
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
          {upcomingEvents.length === 0 ? (
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
                  borderRadius: 6,
                  padding: '8px 10px',
                  marginBottom: 6,
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
                  {ev.memo && (
                    <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)', marginTop: 4, lineHeight: 1.5 }}>
                      {ev.memo}
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