export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const wantHistory = searchParams.get('history') === 'true'

  try {
    const res = await fetch(
      'https://production.dataviz.cnn.io/index/fearandgreed/graphdata',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://www.cnn.com/markets/fear-and-greed',
          'Accept': 'application/json',
        },
      }
    )

    if (!res.ok) return Response.json({ score: null, rating: 'unavailable' })

    const data = await res.json()
    const score = Math.round(data.fear_and_greed?.score ?? 0)
    const rating = data.fear_and_greed?.rating ?? 'unknown'

    if (wantHistory) {
      const history = (data.fear_and_greed_historical?.data ?? [])
        .slice(-365)
        .map((d: any) => ({
          date: new Date(d.x).toISOString().slice(0, 10),
          value: parseFloat(d.y.toFixed(1)),
        }))
      return Response.json({ score, rating, history })
    }

    return Response.json({ score, rating })
  } catch {
    return Response.json({ score: null, rating: 'unavailable' })
  }
}