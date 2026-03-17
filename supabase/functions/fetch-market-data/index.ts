// fetch-market-data Edge Function
// Proxy for Yahoo Finance: fetches USD/BRL spot + soybean/corn CBOT futures.
// Returns structured data with ticker, price, and exp_date per commodity.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── CBOT ticker → Yahoo Finance symbol mapping ───────────────────────────

const MONTH_CODES: Record<string, string> = {
  F: "F", H: "H", K: "K", N: "N", Q: "Q", U: "U", X: "X",
};

const SOYBEAN_CONTRACT_MONTHS: Record<number, string> = { 1: "F", 3: "H", 5: "K", 7: "N", 8: "Q", 9: "U", 11: "X" };
const CORN_CONTRACT_MONTHS: Record<number, string> = { 1: "F", 3: "H", 5: "K", 7: "N", 9: "U", 11: "X" };

/** Convert internal ticker (e.g. ZSN25) to Yahoo Finance symbol (e.g. ZSN25.CBT) */
function toYahooSymbol(ticker: string): string {
  return `${ticker}.CBT`;
}

/** Generate upcoming futures tickers for a commodity */
function generateFuturesTickers(
  root: string,
  contractMonths: Record<number, string>,
  quantity: number,
  referenceDate: Date,
  cutoffDay = 1,
): string[] {
  let year = referenceDate.getFullYear();
  let month = referenceDate.getMonth() + 1;
  const tickers: string[] = [];

  while (tickers.length < quantity) {
    const code = contractMonths[month];
    if (code != null) {
      const isCurrentMonth = year === referenceDate.getFullYear() && month === referenceDate.getMonth() + 1;
      if (!(isCurrentMonth && referenceDate.getDate() > cutoffDay)) {
        const yearSuffix = String(year).slice(-2);
        tickers.push(`${root}${code}${yearSuffix}`);
      }
    }
    month++;
    if (month > 12) { month = 1; year++; }
  }
  return tickers;
}

/** Estimate CBOT expiration date from ticker */
function estimateCbotExpiration(ticker: string, root: string, contractMonths: Record<number, string>): string | null {
  if (ticker.length < 4) return null;
  const monthCode = ticker[ticker.length - 3];
  const yearSuffix = ticker.slice(-2);
  if (!/^\d{2}$/.test(yearSuffix)) return null;

  const monthNumber = Object.entries(contractMonths).find(([, c]) => c === monthCode)?.[0];
  if (!monthNumber) return null;

  const year = 2000 + parseInt(yearSuffix, 10);
  const month = parseInt(monthNumber, 10);

  const day15 = new Date(year, month - 1, 15);
  const weekday = day15.getDay();

  let expDay: number;
  if (weekday === 0) expDay = 12;
  else if (weekday === 6) expDay = 14;
  else if (weekday === 1) expDay = 12;
  else expDay = 14;

  const d = new Date(year, month - 1, expDay);
  const y2 = d.getFullYear();
  const m2 = String(d.getMonth() + 1).padStart(2, "0");
  const d2 = String(d.getDate()).padStart(2, "0");
  return `${y2}-${m2}-${d2}`;
}

// ── Yahoo Finance fetcher ────────────────────────────────────────────────

interface YahooQuote {
  symbol: string;
  regularMarketPrice?: number;
  shortName?: string;
}

async function fetchYahooQuotes(symbols: string[]): Promise<YahooQuote[]> {
  const symbolStr = symbols.join(",");
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbolStr)}&fields=regularMarketPrice,shortName`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Yahoo Finance API error ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  return data?.quoteResponse?.result ?? [];
}

// ── Handler ──────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const now = new Date();
    const soybeanTickers = generateFuturesTickers("ZS", SOYBEAN_CONTRACT_MONTHS, 6, now);
    const cornTickers = generateFuturesTickers("ZC", CORN_CONTRACT_MONTHS, 6, now);

    const allYahooSymbols = [
      "USDBRL=X",
      ...soybeanTickers.map(toYahooSymbol),
      ...cornTickers.map(toYahooSymbol),
    ];

    const quotes = await fetchYahooQuotes(allYahooSymbols);

    // Parse USD/BRL
    const usdQuote = quotes.find((q) => q.symbol === "USDBRL=X");
    const usdSpot = usdQuote?.regularMarketPrice ?? null;

    // Parse soybean futures
    const soybean = soybeanTickers.map((ticker) => {
      const yahooSym = toYahooSymbol(ticker);
      const quote = quotes.find((q) => q.symbol === yahooSym);
      return {
        ticker,
        price: quote?.regularMarketPrice ?? null,
        exp_date: estimateCbotExpiration(ticker, "ZS", SOYBEAN_CONTRACT_MONTHS),
      };
    });

    // Parse corn futures
    const corn_cbot = cornTickers.map((ticker) => {
      const yahooSym = toYahooSymbol(ticker);
      const quote = quotes.find((q) => q.symbol === yahooSym);
      return {
        ticker,
        price: quote?.regularMarketPrice ?? null,
        exp_date: estimateCbotExpiration(ticker, "ZC", CORN_CONTRACT_MONTHS),
      };
    });

    const response = {
      usd_brl: { spot: usdSpot },
      soybean,
      corn_cbot,
      fetched_at: now.toISOString(),
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("fetch-market-data error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
