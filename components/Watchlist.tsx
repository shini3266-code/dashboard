'use client';
import { useState, useEffect } from 'react';

interface WatchItem {
  symbol: string;
  price: number;
  change: number;
  memo: string;
  addedAt: string;
}

export default function Watchlist() {
  const [input, setInput] = useState('');
  const [watchlist, setWatchlist] = useState<WatchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('watchlist');
    if (saved) setWatchlist(JSON.parse(saved));
  }, []);

  async function addTicker() {
    const sym = input.toUpperCase().trim();
    if (!sym) return;
    if (watchlist.find((w) => w.symbol === sym)) {
      setError('이미 추가된 종목이에요');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=5d`;
      const proxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(
        url
      )}`;
      const res = await fetch(proxy);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const meta = data.chart?.result?.[0]?.meta;
      if (!meta) throw new Error();
      const prev = meta.chartPreviousClose ?? meta.previousClose;
      const curr = meta.regularMarketPrice;
      const change = ((curr - prev) / prev) * 100;

      const newItem: WatchItem = {
        symbol: sym,
        price: curr,
        change: change,
        memo: '',
        addedAt: new Date().toISOString(),
      };

      const updated = [...watchlist, newItem];
      setWatchlist(updated);
      localStorage.setItem('watchlist', JSON.stringify(updated));
      setInput('');
    } catch {
      setError('티커를 찾을 수 없어요. 다시 확인해주세요.');
    } finally {
      setLoading(false);
    }
  }

  function updateMemo(symbol: string, memo: string) {
    const updated = watchlist.map((w) =>
      w.symbol === symbol ? { ...w, memo } : w
    );
    setWatchlist(updated);
    localStorage.setItem('watchlist', JSON.stringify(updated));
  }

  function removeTicker(symbol: string) {
    const updated = watchlist.filter((w) => w.symbol !== symbol);
    setWatchlist(updated);
    localStorage.setItem('watchlist', JSON.stringify(updated));
  }

  return (
    <div>
      {/* 입력칸 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTicker()}
          placeholder="티커 입력 (예: AAPL, TSLA, 005930.KS)"
          style={{
            flex: 1,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '10px 14px',
            color: 'var(--text)',
            fontFamily: 'var(--mono)',
            fontSize: 13,
          }}
        />
        <button
          onClick={addTicker}
          disabled={loading}
          style={{
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '10px 18px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 700,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? '...' : '추가'}
        </button>
      </div>

      {error && (
        <div
          style={{
            color: 'var(--down)',
            fontFamily: 'var(--mono)',
            fontSize: 12,
            marginBottom: 12,
          }}
        >
          {error}
        </div>
      )}

      {/* 종목 카드 */}
      {watchlist.map((item) => (
        <div
          key={item.symbol}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
          }}
        >
          {/* 헤더 */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 16,
                  fontWeight: 700,
                }}
              >
                {item.symbol}
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  marginTop: 4,
                  alignItems: 'baseline',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 22,
                    fontWeight: 700,
                  }}
                >
                  ${item.price?.toFixed(2)}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 13,
                    color: item.change >= 0 ? 'var(--up)' : 'var(--down)',
                  }}
                >
                  {item.change >= 0 ? '▲ +' : '▼ '}
                  {item.change?.toFixed(2)}%
                </span>
              </div>
            </div>
            <button
              onClick={() => removeTicker(item.symbol)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--muted)',
                cursor: 'pointer',
                fontSize: 18,
              }}
            >
              ✕
            </button>
          </div>

          {/* TradingView 캔들차트 */}
          <iframe
            src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_${item.symbol}&symbol=${item.symbol}&interval=D&hidesidetoolbar=1&hidetoptoolbar=0&theme=dark&style=1&timezone=Asia%2FSeoul&withdateranges=1&locale=kr`}
            style={{
              width: '100%',
              height: 300,
              border: 'none',
              borderRadius: 8,
              marginBottom: 10,
            }}
          />

          {/* 메모 */}
          <textarea
            value={item.memo}
            onChange={(e) => updateMemo(item.symbol, e.target.value)}
            placeholder="📌 메모 — 임박한 이벤트, 매수 근거, 목표가 등"
            rows={3}
            style={{
              width: '100%',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '10px 12px',
              color: 'var(--text)',
              resize: 'vertical',
              fontFamily: 'var(--mono)',
              fontSize: 12,
              lineHeight: 1.6,
            }}
          />
        </div>
      ))}

      {watchlist.length === 0 && (
        <div
          style={{
            color: 'var(--muted)',
            fontFamily: 'var(--mono)',
            fontSize: 13,
            textAlign: 'center',
            padding: 40,
          }}
        >
          티커를 입력해서 관심종목을 추가하세요
        </div>
      )}
    </div>
  );
}
