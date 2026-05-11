'use client'
import React from 'react'

export default function MarketSummaryBar({ items }: {
  items: { label: string; keyword: string; level: 'good' | 'warn' | 'bad' | 'neutral' }[]
}) {
  if (items.length === 0) return null

  return (
    <div style={{
      display: 'flex', flexWrap: 'nowrap', overflowX: 'auto',
      gap: 6, padding: '10px 16px',
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, marginBottom: 20,
      msOverflowStyle: 'none', scrollbarWidth: 'none',
    } as React.CSSProperties}>
      {items.map(({ label, keyword, level }, i) => {
        const color = level === 'good' ? '#22c55e' : level === 'warn' ? '#f59e0b' : level === 'bad' ? '#ef4444' : '#e2e8f0'
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            whiteSpace: 'nowrap', paddingRight: 6,
            borderRight: i < items.length - 1 ? '1px solid var(--border)' : 'none',
            marginRight: 6,
          }}>
            <span style={{ fontSize: '1.0rem', color: 'var(--muted)' }}>{label}</span>
            <span style={{ fontSize: '1.0rem', fontWeight: 700, color }}>{keyword}</span>
          </div>
        )
      })}
    </div>
  )
}