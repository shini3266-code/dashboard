export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')
  const high52w = meta.fiftyTwoWeekHigh
  const drawdown = high52w ? ((curr - high52w) / high52w) * 100 : null

  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://finance.yahoo.com',
          'Accept': 'application/json',
        },
        next: { revalidate: 60 }, // 60초 캐시
      }
    )
    if (!res.ok) return Response.json(null)
    const data = await res.json()
    const meta = data.chart?.result?.[0]?.meta
    if (!meta) return Response.json(null)
    const prev = meta.chartPreviousClose ?? meta.previousClose
    const curr = meta.regularMarketPrice
    const change = ((curr - prev) / prev) * 100
    return Response.json({ symbol, price: curr, change, prev, high52w, drawdown })
  } catch {
    return Response.json(null)
  }
}