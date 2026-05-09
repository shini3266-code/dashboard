export function getOilLevel(val: number) {
    if (val >= 90) return { keyword: '고유가', level: 'bad' as const }
    if (val >= 70) return { keyword: '중립', level: 'neutral' as const }
    return { keyword: '저유가', level: 'warn' as const }
  }
  
  export function getKrwLevel(val: number) {
    if (val >= 1400) return { keyword: '원화약세', level: 'bad' as const }
    if (val >= 1300) return { keyword: '주의', level: 'warn' as const }
    return { keyword: '원화강세', level: 'good' as const }
  }
  
  export function getDxyLevel(val: number) {
    if (val >= 105) return { keyword: '강달러', level: 'bad' as const }
    if (val >= 100) return { keyword: '달러강세', level: 'warn' as const }
    if (val >= 95) return { keyword: '중립', level: 'neutral' as const }
    return { keyword: '달러약세', level: 'good' as const }
  }
  
  export function getDrawdownComment(current: number | null, high: number | null) {
    if (!current || !high) return null
    const drawdown = ((current - high) / high) * 100
    const status = drawdown >= -2 ? '강세장'
      : drawdown >= -10 ? '조정초입'
      : drawdown >= -20 ? '조정장'
      : drawdown >= -30 ? '약세장'
      : '급락장'
    const level = drawdown >= -2 ? 'good' as const
      : drawdown >= -10 ? 'warn' as const
      : 'bad' as const
    return { drawdown, status, level }
  }
  
  export function getYieldComment(val: number | null) {
    if (val === null) return null
    if (val < 0) return { keyword: '역전', text: '경기침체 선행신호예요.' }
    if (val < 0.5) return { keyword: '회복초입', text: '실제 침체는 역전 해소 후 올 수 있어요.' }
    return { keyword: '정상', text: '장기금리가 단기금리보다 높아요.' }
  }
  
  export function getBondComment(val: number | null) {
    if (val === null) return null
    if (val >= 5) return { keyword: '고금리', text: '주식 밸류에이션 압박이 커요.' }
    if (val >= 4) return { keyword: '제한적', text: '성장주에 부담이에요.' }
    if (val >= 3) return { keyword: '중립', text: '시장 영향은 제한적이에요.' }
    return { keyword: '저금리', text: '성장주에 유리해요.' }
  }
  
  export function getDxyComment(val: number | null) {
    if (val === null) return null
    const { keyword } = getDxyLevel(val)
    if (val >= 105) return { keyword, text: '신흥국·원자재에 부담이에요.' }
    if (val >= 100) return { keyword, text: '글로벌 유동성 위축 압력이 있어요.' }
    if (val >= 95) return { keyword, text: '달러 방향성이 중립이에요.' }
    return { keyword, text: '위험자산·신흥국에 우호적이에요.' }
  }
  
  export function getOilComment(val: number | null) {
    if (val === null) return null
    const { keyword } = getOilLevel(val)
    if (val >= 90) return { keyword, text: '인플레이션 압력이 커요.' }
    if (val >= 70) return { keyword, text: '경기 회복 수요를 반영해요.' }
    return { keyword, text: '경기 둔화 우려가 있어요.' }
  }
  
  export function getKrwComment(val: number | null) {
    if (val === null) return null
    const { keyword } = getKrwLevel(val)
    if (val >= 1400) return { keyword, text: '외국인 자금유출 압력이 있어요.' }
    if (val >= 1300) return { keyword, text: '환율 변동성에 주의하세요.' }
    return { keyword, text: '외국인 자금유입에 우호적이에요.' }
  }
  
  export function getFedAssetComment(val: number | null) {
    if (val === null) return null
    const t = val / 1000000
    if (t >= 8) return { keyword: 'QT진행중', text: '대규모 자산 보유 중이에요.' }
    if (t >= 7) return { keyword: 'QT중반', text: '코로나 고점 대비 많이 줄었어요.' }
    if (t >= 6) return { keyword: 'QT후반', text: '코로나 이전 수준에 근접하고 있어요.' }
    return { keyword: '정상화', text: '코로나 이전 수준으로 복귀했어요.' }
  }
  
  export function getReservesComment(val: number | null) {
    if (val === null) return null
    if (val > 3000000) return { keyword: '충분', text: '은행 시스템이 안정적이에요.' }
    if (val > 2500000) return { keyword: '양호', text: '아직 안전 수준이에요.' }
    if (val > 2000000) return { keyword: '주의', text: '감소 추세예요.' }
    return { keyword: '위험', text: 'QT 중단 가능성이 있어요.' }
  }
  
  export function getRrpComment(val: number | null) {
    if (val === null) return null
    if (val < 100) return { keyword: '거의소진', text: '시장 초과유동성이 없어요.' }
    if (val < 500) return { keyword: '대폭감소', text: '시장으로 유동성이 유입됐어요.' }
    return { keyword: '잔존', text: '아직 초과유동성이 남아있어요.' }
  }
  
  export function getTgaComment(val: number | null) {
    if (val === null) return null
    if (val > 800) return { keyword: '잔고풍부', text: '지출 시 유동성 공급 가능성이 있어요.' }
    if (val > 500) return { keyword: '정상', text: '정상 수준이에요.' }
    if (val > 200) return { keyword: '감소중', text: '지출이 늘거나 세수가 줄고 있어요.' }
    return { keyword: '부채한도주의', text: '잔고가 매우 낮아요.' }
  }
  