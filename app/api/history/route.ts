export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')
    const range = searchParams.get('range') || '1y'
  
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=${range}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://finance.yahoo.com',
        },
      }
    )
    const data = await res.json()
    const result = data.chart?.result?.[0]
    if (!result) return Response.json([])
  
    const timestamps = result.timestamp
    const closes = result.indicators.quote[0].close
  
    const formatted = timestamps.map((t: number, i: number) => ({
      date: new Date(t * 1000).toISOString().slice(0, 10),
      value: closes[i] ? parseFloat(closes[i].toFixed(2)) : null,
    })).filter((d: any) => d.value !== null)
  
    return Response.json(formatted)
  }