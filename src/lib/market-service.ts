// market-service.ts
// Client-side service for fetching and processing market data from the
// fetch-market-data Edge Function. Calculates NDF forward rate and BRL/sc conversions.

import { supabase } from "@/integrations/supabase/client";
import { SoybeanUtils, CornUtils, calculateStonexForwardDolRate, formatDateISO } from "./pricing-utils";

// ── Types ─────────────────────────────────────────────────────────────────

export interface FuturesRow {
  ticker: string;
  price: number | null;
  exp_date: string | null;
  price_brl_sack?: number | null;
  isManual?: boolean;
}

export interface MarketData {
  usd_spot: number | null;
  usd_forward: number | null;
  usd_spot_manual: boolean;
  usd_forward_manual: boolean;
  soybean: FuturesRow[];
  corn_cbot: FuturesRow[];
  corn_b3: FuturesRow[];
  fetched_at: string | null;
}

// ── NDF Forward Rate ─────────────────────────────────────────────────────

/**
 * Calculate NDF forward rate.
 * Replicates notebook's calculate_stored_ndf_rate:
 *   forward = spot + days * daily_carry_factor
 * Uses same 0.001163 daily factor as calculateStonexForwardDolRate.
 */
export function calculateNdfForwardRate(
  spotRate: number,
  targetDate: string,
  baseDate: string,
): number {
  return calculateStonexForwardDolRate(spotRate, targetDate, baseDate);
}

// ── BRL/sc Conversions ───────────────────────────────────────────────────

export function convertSoybeanToBrlSack(priceUsdCents: number, exchangeRate: number): number {
  // Yahoo returns soybean in USD cents/bushel
  const priceUsdBushel = priceUsdCents / 100;
  return SoybeanUtils.convertUsdBushelToBrlSack(priceUsdBushel, exchangeRate);
}

export function convertCornCbotToBrlSack(priceUsdCents: number, exchangeRate: number): number {
  // Yahoo returns corn in USD cents/bushel
  const priceUsdBushel = priceUsdCents / 100;
  return CornUtils.convertUsdBushelToBrlSack(priceUsdBushel, exchangeRate);
}

// ── Default B3 Tickers ───────────────────────────────────────────────────

const B3_CONTRACT_MONTHS: Record<number, string> = { 1: "F", 3: "H", 5: "K", 7: "N", 9: "U" };

export function generateDefaultB3Tickers(quantity = 6): FuturesRow[] {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth() + 1;
  const rows: FuturesRow[] = [];

  while (rows.length < quantity) {
    const code = B3_CONTRACT_MONTHS[month];
    if (code != null) {
      const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
      if (!(isCurrentMonth && now.getDate() > 1)) {
        const yearSuffix = String(year).slice(-2);
        rows.push({
          ticker: `CCM${code}${yearSuffix}`,
          price: null,
          exp_date: null,
          isManual: true,
        });
      }
    }
    month++;
    if (month > 12) { month = 1; year++; }
  }
  return rows;
}

// ── Fetch Market Data ────────────────────────────────────────────────────

export async function fetchMarketData(): Promise<{
  usd_spot: number | null;
  soybean: FuturesRow[];
  corn_cbot: FuturesRow[];
  fetched_at: string | null;
}> {
  const { data, error } = await supabase.functions.invoke("fetch-market-data");

  if (error) {
    console.error("fetch-market-data error:", error);
    throw new Error(error.message || "Failed to fetch market data");
  }

  return {
    usd_spot: data?.usd_brl?.spot ?? null,
    soybean: (data?.soybean ?? []).map((row: any) => ({
      ticker: row.ticker,
      price: row.price,
      exp_date: row.exp_date,
      isManual: false,
    })),
    corn_cbot: (data?.corn_cbot ?? []).map((row: any) => ({
      ticker: row.ticker,
      price: row.price,
      exp_date: row.exp_date,
      isManual: false,
    })),
    fetched_at: data?.fetched_at ?? null,
  };
}

// ── Process Market Data (add BRL conversions) ────────────────────────────

export function processMarketData(
  raw: { usd_spot: number | null; soybean: FuturesRow[]; corn_cbot: FuturesRow[] },
  usdForward: number | null,
): { soybean: FuturesRow[]; corn_cbot: FuturesRow[] } {
  const rate = usdForward ?? raw.usd_spot ?? 1;

  const soybean = raw.soybean.map((row) => ({
    ...row,
    price_brl_sack: row.price != null ? convertSoybeanToBrlSack(row.price, rate) : null,
  }));

  const corn_cbot = raw.corn_cbot.map((row) => ({
    ...row,
    price_brl_sack: row.price != null ? convertCornCbotToBrlSack(row.price, rate) : null,
  }));

  return { soybean, corn_cbot };
}
