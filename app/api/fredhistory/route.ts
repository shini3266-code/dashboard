export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const series = searchParams.get('series')
    const limit = searchParams.get('limit') || '104'
  
    const FRED_KEY = 'e621e5e8f850e000e50b54b0af978213'
  
    try {
      const res = await fetch(
        `https://api.stlouisfed.org/fred/series/observations` +
        `?series_id=${series}` +
        `&api_key=${FRED_KEY}` +
        `&file_type=json` +
        `&limit=${limit}` +
        `&sort_order=desc`,
        { next: { revalidate: 3600 } }
      )
  
      if (!res.ok) return Response.json([])
  
      const data = await res.json()
  
      const formatted = (data.observations ?? [])
        .filter((o: any) => o.value !== '.')
        .map((o: any) => ({
          date: o.date,
          value: parseFloat(o.value),
        }))
        .reverse()
  
      return Response.json(formatted)
    } catch {
      return Response.json([])
    }
  }