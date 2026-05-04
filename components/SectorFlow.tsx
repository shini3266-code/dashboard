'use client'
import { useEffect, useState } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ReferenceLine, CartesianGrid } from 'recharts'

interface SectorData {
  symbol: string
  name: string
  change: number
  price: number
}

const SECTORS = [
  { symbol: 'XLK', name: 'IT' },
  { symbol: 'XLY', name: '임의소비재' },
  { symbol: 'XLC', name: '커뮤니케이션' },
  { symbol: 'XLF', name: '금융' },
  { symbol: 'XLI', name: '산업재' },
  { symbol: 'XLV', name: '헬스케어' },
  { symbol: 'XLP', name: '필수소비재' },
  { symbol: 'XLRE', name: '부동산' },
  { symbol: 'XLB', name: '소재' },
  { symbol: 'XLU', name: '유틸리티' },
  { symbol: 'XLE', name: '에너지' },
]

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload?.length) {
    const v = payload[0].value
    const isUp = v >= 0
    return (
      <div style={{
        background: 'var(--surface2)', border: '1px solid var(--border)',
        borderRadius: 8, padding: '8px 12px', fontFamily: 'var(--mono)', fontSize: 12,
      }}>
        <div style={{ color: 'var(--muted)', marginBottom: 2 }}>{label}</div>
        <div style={{ color: isUp ? 'var(--up)' : 'var(--down)', fontWeight: 700 }}>
          {isUp ? '+' : ''}{v?.toFixed(2)}%
        </div>
      </div>
    )
  }
  return null
}

export default function SectorFlow() {
  const [data, setData] = useState<SectorData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const results = await Promise.all(
          SECTORS.map(async ({ symbol, name }) => {
            try {
              const res = await fetch(`/api/quote?symbol=${symbol}`)
              if (!res.ok) return { symbol, name, change: 0, price: 0 }
              const json = await res.json()
              if (!json) return { symbol, name, change: 0, price: 0 }
              return { symbol, name, change: json.change, price: json.price }
            } catch {
              return { symbol, name, change: 0, price: 0 }
            }
          })
        )
        // 등락률 순으로 정렬
        results.sort((a, b) => b.change - a.change)
        setData(results)
      } catch {
        // 에러 무시
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const best = data[0]
  const worst = data[data.length - 1]

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '16px', marginBottom: 8,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--muted)', letterSpacing: '0.08em', marginBottom: 4 }}>
            섹터별 자금 흐름 · S&P500 11개 섹터 ETF
          </div>
          <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)' }}>
            전일 대비 등락률 기준
          </div>
        </div>
        {!loading && data.length > 0 && (
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)' }}>최강</div>
              <div style={{ fontSize: 13, fontFamily: 'var(--mono)', color: 'var(--up)', fontWeight: 700 }}>
                {best.name} +{best.change.toFixed(2)}%
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)' }}>최약</div>
              <div style={{ fontSize: 13, fontFamily: 'var(--mono)', color: 'var(--down)', fontWeight: 700 }}>
                {worst.name} {worst.change.toFixed(2)}%
              </div>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 12 }}>
          로딩 중...
        </div>
      ) : (
        <>
          {/* 바 차트 */}
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'var(--mono)' }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'var(--mono)' }}
                axisLine={false} tickLine={false}
                tickFormatter={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`}
                width={48}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
              <Bar dataKey="change" radius={[3, 3, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.change >= 0 ? '#00d084' : '#ff4d6a'}
                    fillOpacity={0.8}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* 카드 그리드 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
            gap: 6,
            marginTop: 12,
          }}>
            {data.map(({ symbol, name, change, price }) => (
              <div key={symbol} style={{
                background: 'var(--surface2)',
                border: `1px solid ${change >= 0 ? 'rgba(0,208,132,0.2)' : 'rgba(255,77,106,0.2)'}`,
                borderRadius: 8,
                padding: '8px 10px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)', marginBottom: 2 }}>
                  {symbol}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>{name}</div>
                <div style={{
                  fontSize: 12, fontFamily: 'var(--mono)', fontWeight: 700,
                  color: change >= 0 ? 'var(--up)' : 'var(--down)',
                }}>
                  {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                </div>
                <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)', marginTop: 2 }}>
                  ${price.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}