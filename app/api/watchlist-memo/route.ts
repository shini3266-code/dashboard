import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: Request) {
  const { symbol, memo } = await request.json()

  // 1. watchlist_memos 업데이트
  await supabase
    .from('watchlist_memos')
    .upsert({ symbol, memo, updated_at: new Date().toISOString() }, { onConflict: 'symbol' })

  // 2. 연결된 memos 찾기
  const { data: existing } = await supabase
    .from('memos')
    .select('*')
    .eq('linked_symbol', symbol)
    .single()

  if (existing) {
    // 기존 메모 있으면 인라인 박스 부분만 업데이트
    // content = [WATCHLIST_MEMO]...[/WATCHLIST_MEMO] + 추가텍스트
    const content = existing.content ?? ''
    const updated = content.replace(
      /\[WATCHLIST_MEMO\][\s\S]*?\[\/WATCHLIST_MEMO\]/,
      `[WATCHLIST_MEMO]${memo}[/WATCHLIST_MEMO]`
    )
    await supabase
      .from('memos')
      .update({ content: updated, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
  } else {
    // 없으면 새로 생성
    await supabase
      .from('memos')
      .insert({
        title: symbol,
        content: `[WATCHLIST_MEMO]${memo}[/WATCHLIST_MEMO]`,
        category: '종목메모',
        linked_symbol: symbol,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
  }

  return Response.json({ ok: true })
}