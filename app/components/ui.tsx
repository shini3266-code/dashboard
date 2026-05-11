'use client'
import React from 'react'

export function RangeTabs<T extends string>({ ranges, selected, onChange, color = 'var(--accent)' }: {
  ranges: readonly T[]
  selected: T
  onChange: (r: T) => void
  color?: string
}) {
  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
      {ranges.map(r => (
        <button key={r} onClick={() => onChange(r)} style={{
          fontSize: '1.0rem', padding: '2px 7px', borderRadius: 4,
          border: `1px solid ${selected === r ? color : 'var(--border)'}`,
          background: selected === r ? color : 'transparent',
          color: selected === r ? '#fff' : 'var(--muted)',
          cursor: 'pointer', fontWeight: selected === r ? 700 : 400,
        }}>
          {r.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

export function CommentBox({ keyword, text, level = 'neutral' }: {
  keyword?: string
  text: string | null
  level?: 'good' | 'warn' | 'bad' | 'neutral'
}) {
  if (!text) return null
  const color = level === 'good' ? '#22c55e' : level === 'warn' ? '#f59e0b' : level === 'bad' ? '#ef4444' : '#64748b'
  return (
    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      {keyword && (
        <span style={{ fontSize: '1.0rem', fontWeight: 700, color, border: `1px solid ${color}`, borderRadius: 6, padding: '2px 8px', whiteSpace: 'nowrap' }}>
          {keyword}
        </span>
      )}
      <span style={{ fontSize: '1.0rem', color: 'var(--muted)', lineHeight: 1.6 }}>{text}</span>
    </div>
  )
}

export function DrawdownBadge({ dd }: {
  dd: { drawdown: number; status: string; level: 'good' | 'warn' | 'bad' } | null
}) {
  if (!dd) return null
  return (
    <div style={{ marginTop: 4 }}>
      <span style={{ fontSize: '1.0rem', color: 'var(--muted)' }}>
        ATH 대비 {dd.drawdown.toFixed(1)}% 낙폭
      </span>
    </div>
  )
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: '1.0rem', color: 'var(--text)',
      letterSpacing: '0.12em', textTransform: 'uppercase',
      marginBottom: 10, marginTop: 28,
    }}>
      {children}
    </div>
  )
}
