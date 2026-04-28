export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')

  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`,
    {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 60 }
    }
  )
  const data = await res.json()
  const meta = data.chart.result[0].meta
  const prev = meta.chartPreviousClose
  const curr = meta.regularMarketPrice
  const change = ((curr - prev) / prev) * 100

  return Response.json({ symbol, price: curr, change, prev })
}