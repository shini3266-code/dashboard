export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const series = searchParams.get('series')

  const res = await fetch(
    `https://api.stlouisfed.org/fred/series/observations` +
    `?series_id=${series}` +
    `&api_key=${process.env.NEXT_PUBLIC_FRED_API_KEY}` +
    `&file_type=json&limit=5&sort_order=desc`,
    { next: { revalidate: 3600 } }
  )
  const data = await res.json()
  return Response.json(data)
}