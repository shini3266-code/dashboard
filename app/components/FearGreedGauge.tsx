const CustomXTick = ({ x, y, payload }: any) => {
  if (!payload?.value) return null
  const d = new Date(payload.value)
  const label = `${d.getMonth() + 1}/${d.getDate()}`
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={10} textAnchor="middle" fill="#64748b" fontSize={9}>
        {label}
      </text>
    </g>
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
    <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '0.6rem' }}>
      로딩 중...
    </div>
  )

  // 값에 따라 색상 반환
  function getColor(v: number) {
    if (v < 25) return '#ef4444'
    if (v < 45) return '#f97316'
    if (v < 55) return '#f59e0b'
    if (v < 75) return '#84cc16'
    return '#22c55e'
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      const v = payload[0].value
      return (
        <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px' }}>
          <div style={{ color: 'var(--muted)', marginBottom: 2, fontSize: 10 }}>{label}</div>
          <div style={{ color: getColor(v), fontWeight: 700, fontSize: 11 }}>{Math.round(v)}</div>
        </div>
      )
    }
    return null
  }

  // 구간별로 데이터 분리해서 각각 다른 색으로 렌더
  const segments: { data: { date: string; value: number }[]; color: string }[] = []
  let currentColor = data.length ? getColor(data[0].value) : '#f59e0b'
  let currentSegment: { date: string; value: number }[] = []

  data.forEach((point, i) => {
    const c = getColor(point.value)
    if (c !== currentColor && currentSegment.length > 0) {
      segments.push({ data: [...currentSegment, point], color: currentColor })
      currentSegment = [point]
      currentColor = c
    } else {
      currentSegment.push(point)
    }
    if (i === data.length - 1) {
      segments.push({ data: currentSegment, color: currentColor })
    }
  })

  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          {segments.map((seg, i) => (
            <linearGradient key={i} id={`fg-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={seg.color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={seg.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={<CustomXTick />}
          axisLine={false} tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: '#808c9e', fontSize: 9 }}
          axisLine={false} tickLine={false}
          width={28}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={25} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.4} />
        <ReferenceLine y={75} stroke="#22c55e" strokeDasharray="3 3" strokeOpacity={0.4} />
        {/* 단일 Area에 linearGradient 대신 stroke를 동적으로 */}
        <Area
          type="monotone"
          dataKey="value"
          stroke="url(#fg-stroke)"
          strokeWidth={1.5}
          fill="none"
          dot={false}
          activeDot={{ r: 4 }}
        />
        {/* 색상별 세그먼트 오버레이 */}
        {segments.map((seg, i) => (
          <Area
            key={i}
            data={seg.data}
            type="monotone"
            dataKey="value"
            stroke={seg.color}
            strokeWidth={1.5}
            fill={`url(#fg-grad-${i})`}
            dot={false}
            activeDot={false}
            legendType="none"
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}