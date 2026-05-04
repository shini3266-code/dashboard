'use client'
import { useEffect, useState } from 'react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts'

interface FGData {
  score: number
  rating: string
  history?: { date: string; value: number }[]
}

export default function FearGreedGauge() {
  const [data, setData] = useState<FGData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/feargreed')
      .then(r => r.json())
      .then(d => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const score = data?.score ?? null

  const color = score === null ? '#64748b'
    : score < 25 ? '#ef4444'
    : score < 45 ? '#f97316'
    : score < 55 ? '#f59e0b'
    : score < 75 ? '#84cc16'
    : '#22c55e'

  const label = score === null ? '--'
    : score < 25 ? '극단적 공포'
    : score < 45 ? '공포'
    : score < 55 ? '중립'
    : score < 75 ? '탐욕'
    : '극단적 탐욕'

  // 게이지 SVG 계산
  const radius = 80
  const cx = 110
  const cy = 100
  const startAngle = 180
  const endAngle = 0
  const angleRange = startAngle - endAngle
  const needleAngle = score !== null
    ? startAngle - (score / 100) * angleRange
    : 90

  function polarToCartesian(angle: number, r: number) {
    const rad = (angle * Math.PI) / 180
    return {
      x: cx + r * Math.cos(rad),
      y: cy - r * Math.sin(rad),
    }
  }

  function arcPath(startDeg: number, endDeg: number, r: number) {
    const s = polarToCartesian(startDeg, r)
    const e = polarToCartesian(endDeg, r)
    const large = startDeg - endDeg > 180 ? 1 : 0
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`
  }

  const needle = polarToCartesian(needleAngle, radius - 10)
  const needleBase1 = polarToCartesian(needleAngle + 90, 8)
  const needleBase2 = polarToCartesian(needleAngle - 90, 8)

  const CustomTooltip = ({ active, payload, label: l }: any) => {
    if (active && payload?.length) {
      const v = payload[0].value
      const c = v < 25 ? '#ef4444' : v < 45 ? '#f97316' : v < 55 ? '#f59e0b' : v < 75 ? '#84cc16' : '#22c55e'
      return (
        <div style={{
          background: 'var(--surface2)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '8px 12px', fontFamily: 'var(--mono)', fontSize: 12,
        }}>
          <div style={{ color: 'var(--muted)', marginBottom: 2 }}>{l}</div>
          <div style={{ color: c, fontWeight: 700 }}>{Math.round(v)}</div>
        </div>
      )
    }
    return null
  }

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '16px', marginBottom: 8,
    }}>
      <div style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--muted)', marginBottom: 16, letterSpacing: '0.1em' }}>
        CNN 공포·탐욕 지수
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24, alignItems: 'center' }}>
        {/* 게이지 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {loading ? (
            <div style={{ color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 13 }}>로딩 중...</div>
          ) : (
            <>
              <svg width="220" height="120" viewBox="0 0 220 120">
                {/* 배경 아크 */}
                <path d={arcPath(180, 0, radius)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="20" strokeLinecap="round" />

                {/* 색상 구간 */}
                <path d={arcPath(180, 144, radius)} fill="none" stroke="#ef4444" strokeWidth="20" strokeOpacity="0.8" />
                <path d={arcPath(144, 108, radius)} fill="none" stroke="#f97316" strokeWidth="20" strokeOpacity="0.8" />
                <path d={arcPath(108, 72, radius)} fill="none" stroke="#f59e0b" strokeWidth="20" strokeOpacity="0.8" />
                <path d={arcPath(72, 36, radius)} fill="none" stroke="#84cc16" strokeWidth="20" strokeOpacity="0.8" />
                <path d={arcPath(36, 0, radius)} fill="none" stroke="#22c55e" strokeWidth="20" strokeOpacity="0.8" />

                {/* 바늘 */}
                {score !== null && (
                  <>
                    <polygon
                      points={`${needle.x},${needle.y} ${needleBase1.x},${needleBase1.y} ${needleBase2.x},${needleBase2.y}`}
                      fill="white"
                      opacity="0.9"
                    />
                    <circle cx={cx} cy={cy} r="6" fill="white" opacity="0.9" />
                  </>
                )}

                {/* 레이블 */}
                <text x="18" y="112" fill="#ef4444" fontSize="9" fontFamily="monospace">극단공포</text>
                <text x="180" y="112" fill="#22c55e" fontSize="9" fontFamily="monospace">극단탐욕</text>
              </svg>

              {/* 숫자 */}
              <div style={{ textAlign: 'center', marginTop: -8 }}>
                <div style={{ fontSize: 48, fontWeight: 700, fontFamily: 'var(--mono)', color, lineHeight: 1 }}>
                  {score ?? '--'}
                </div>
                <div style={{ fontSize: 13, fontFamily: 'var(--mono)', color, marginTop: 6 }}>
                  {label}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 차트 */}
        <div>
          <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)', marginBottom: 8 }}>
            공포탐욕 추이 · 최근 1년
          </div>
          <FearGreedChart />
        </div>
      </div>
    </div>
  )
}

function FearGreedChart() {
  const [data, setData] = useState<{ date: string; value: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/feargreed?history=true')
      .then(r => r.json())
      .then(d => {
        if (d.history) setData(d.history)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 12 }}>
      로딩 중...
    </div>
  )

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      const v = payload[0].value
      const c = v < 25 ? '#ef4444' : v < 45 ? '#f97316' : v < 55 ? '#f59e0b' : v < 75 ? '#84cc16' : '#22c55e'
      return (
        <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontFamily: 'var(--mono)', fontSize: 12 }}>
          <div style={{ color: 'var(--muted)', marginBottom: 2 }}>{label}</div>
          <div style={{ color: c, fontWeight: 700 }}>{Math.round(v)}</div>
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="fg-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'var(--mono)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
        <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'var(--mono)' }} axisLine={false} tickLine={false} width={28} />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={25} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.4} />
        <ReferenceLine y={75} stroke="#22c55e" strokeDasharray="3 3" strokeOpacity={0.4} />
        <Area type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={1.5} fill="url(#fg-grad)" dot={false} activeDot={{ r: 4, fill: '#f59e0b' }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}