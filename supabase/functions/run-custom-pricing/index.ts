// run-custom-pricing Edge Function
// Receives an array of pricing combinations and returns calculated results.
// Ports the Python custom_pricing_table_runner logic to TypeScript/Deno.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Date helpers ──────────────────────────────────────────────────────────

function toDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

function daysBetween(a: string | Date, b: string | Date): number {
  const da = toDate(a);
  const db = toDate(b);
  return Math.abs(Math.round((db.getTime() - da.getTime()) / 86_400_000));
}

function formatDateISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ── Constants ─────────────────────────────────────────────────────────────

const SOYBEAN_BUSHELS_PER_SACK = 2.20462;
const SOYBEAN_CONTRACT_SIZE_BUSHELS = 5000;
const SOYBEAN_ROUNDING_INCREMENT = 0.50;

const CORN_B3_SACKS_PER_CONTRACT = 450;
const CORN_ROUNDING_INCREMENT = 0.25;

function convertUsdBushelToBrlSack(priceUsdBushel: number, exchangeRate: number): number {
  return priceUsdBushel * SOYBEAN_BUSHELS_PER_SACK * exchangeRate;
}

// ── Financial Calculations ────────────────────────────────────────────────

function applyPercentageSpread(value: number, spreadRate: number): number {
  return value * (1 + spreadRate);
}

function floorWithPrecision(
  value: number,
  opts: { decimalPlaces?: number; increment?: number } = {},
): number {
  const { decimalPlaces = 2, increment } = opts;
  const factor = increment != null ? 1.0 / increment : Math.pow(10, decimalPlaces);
  return Math.floor(value * factor) / factor;
}

function calculateBrokerageCost(costPerContract: number, unitsPerContract: number): number {
  return Math.round((costPerContract / unitsPerContract) * 10000) / 10000;
}

function calculateFinancialCost(params: {
  startDate: string | Date;
  endDate: string | Date;
  interestRate: number;
  ratePeriod: "monthly" | "yearly";
  baseValue: number;
  daysPerYear?: number;
}): number {
  const { startDate, endDate, interestRate, ratePeriod, baseValue, daysPerYear = 365 } = params;
  const daysElapsed = daysBetween(startDate, endDate);
  let periods: number;
  if (ratePeriod === "monthly") {
    periods = daysElapsed / 30.0;
  } else {
    periods = daysElapsed / daysPerYear;
  }
  return (Math.pow(1 + interestRate, periods) - 1) * baseValue;
}

function calculateStorageCost(params: {
  storageCost: number;
  storageCostType: "monthly" | "fixed";
  receptionCost?: number;
  startDate?: string | Date;
  endDate?: string | Date;
  shrinkageRateMonthly?: number;
  shrinkageBaseValue?: number;
}): number {
  const {
    storageCost, storageCostType, receptionCost = 0,
    startDate, endDate, shrinkageRateMonthly = 0, shrinkageBaseValue = 0,
  } = params;

  let total: number;
  if (storageCostType === "monthly") {
    if (!startDate || !endDate) throw new Error("startDate and endDate required for monthly storage");
    const monthsElapsed = Math.max(daysBetween(startDate, endDate), 0) / 30.0;
    total = storageCost * monthsElapsed + receptionCost;
  } else {
    total = storageCost + receptionCost;
  }
  if (shrinkageRateMonthly > 0 && startDate && endDate) {
    const monthsElapsed = Math.max(daysBetween(startDate, endDate), 0) / 30.0;
    total += shrinkageRateMonthly * monthsElapsed * shrinkageBaseValue;
  }
  return total;
}

function calculateOriginationPrice(exchangePrice: number, basis: number, costs: number = 0): number {
  return exchangePrice + basis - costs;
}

function round4(v: number): number {
  return Math.round(v * 10000) / 10000;
}

function round5(v: number): number {
  return Math.round(v * 100000) / 100000;
}

function round6(v: number): number {
  return Math.round(v * 1000000) / 1000000;
}

// ── Black-76 ──────────────────────────────────────────────────────────────

function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  const a = Math.abs(x);
  const t = 1.0 / (1.0 + 0.3275911 * a);
  const y = 1.0 -
    (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
    t * Math.exp(-a * a);
  return sign * y;
}

function normCdf(x: number): number {
  return 0.5 * (1.0 + erf(x / Math.SQRT2));
}

function calculateBlack76Price(
  F: number, K: number, T: number, r: number, sigma: number,
  optionType: "call" | "put" = "call",
): number {
  if (F <= 0 || T <= 0 || sigma <= 0) return 0;

  const d1 = (Math.log(F / K) + 0.5 * sigma * sigma * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  const discount = Math.exp(-r * T);

  let price: number;
  if (optionType === "call") {
    price = discount * (F * normCdf(d1) - K * normCdf(d2));
  } else {
    price = discount * (K * normCdf(-d2) - F * normCdf(-d1));
  }
  return round4(price);
}

function suggestStrikeFromOtmPct(futuresPrice: number, otmPct: number, optionType: "call" | "put"): number {
  if (optionType === "call") return round4(futuresPrice * (1 + otmPct));
  return round4(futuresPrice * (1 - otmPct));
}

// ── Insurance ─────────────────────────────────────────────────────────────

interface InsuranceLevel {
  strike_brl: number;
  premium_brl: number;
  carry_brl: number;
  total_cost_brl: number;
}

function calculateInsurancePrices(
  fBrl: number,
  tradeDate: string | Date,
  grainReceptionDate: string | Date,
  r: number,
  sigma: number,
  interestRate: number,
  interestRatePeriod: "monthly" | "yearly",
  optionType: "call" | "put" = "call",
): Record<string, InsuranceLevel> {
  const days = daysBetween(tradeDate, grainReceptionDate);
  const T = days / 365.0;

  const levels: Record<string, number> = { atm: 0.0, otm_5: 0.05, otm_10: 0.10 };
  const result: Record<string, InsuranceLevel> = {};

  for (const [label, otmPct] of Object.entries(levels)) {
    const strike = suggestStrikeFromOtmPct(fBrl, otmPct, optionType);
    const premium = calculateBlack76Price(fBrl, strike, T, r, sigma, optionType);
    const carry = calculateFinancialCost({
      startDate: tradeDate,
      endDate: grainReceptionDate,
      interestRate,
      ratePeriod: interestRatePeriod,
      baseValue: premium,
    });
    result[label] = {
      strike_brl: strike,
      premium_brl: premium,
      carry_brl: round4(carry),
      total_cost_brl: round4(premium + carry),
    };
  }
  return result;
}

// ── Soybean Engine ────────────────────────────────────────────────────────

function runSoybeanEngine(operationInputs: Record<string, any>, marketData: Record<string, any>) {
  const {
    payment_date, sale_date, grain_reception_date,
    interest_rate: rawRate, interest_rate_period: ratePeriodRaw,
    storage_cost: storageCostVal, storage_cost_type: storageTypeRaw,
    reception_cost, brokerage_per_contract, target_basis, desk_cost_pct,
    shrinkage_rate_monthly: shrinkageRate = 0.0,
    rounding_increment: roundingInc = SOYBEAN_ROUNDING_INCREMENT,
  } = operationInputs;

  const { cbot_futures_usd, ticker, exp_date, exchange_rate: fxRate } = marketData;

  const ratePeriod: "monthly" | "yearly" =
    ["am", "a.m", "a.m.", "monthly"].includes(ratePeriodRaw) ? "monthly" : "yearly";
  const rate = rawRate > 0.5 ? rawRate / 100 : rawRate;
  const storageType: "fixed" | "monthly" =
    ["fixo", "fixed"].includes(storageTypeRaw) ? "fixed" : "monthly";

  const futuresBrl = convertUsdBushelToBrlSack(cbot_futures_usd, fxRate);
  const brokerageUsdBu = calculateBrokerageCost(brokerage_per_contract, SOYBEAN_CONTRACT_SIZE_BUSHELS);
  const brokerageBrl = brokerageUsdBu * SOYBEAN_BUSHELS_PER_SACK * fxRate;

  let priceEstimate = futuresBrl;
  let iterations = 0;
  const maxIterations = 100;
  let storageTotal = 0, financialCost = 0, totalCosts = 0, grossPrice = 0, netPrice = 0;

  while (true) {
    iterations++;
    storageTotal = calculateStorageCost({
      storageCost: storageCostVal, storageCostType: storageType,
      receptionCost: reception_cost, startDate: grain_reception_date,
      endDate: sale_date, shrinkageRateMonthly: shrinkageRate,
      shrinkageBaseValue: priceEstimate,
    });
    financialCost = calculateFinancialCost({
      startDate: payment_date, endDate: sale_date,
      interestRate: rate, ratePeriod, baseValue: priceEstimate,
    });
    totalCosts = storageTotal + financialCost + brokerageBrl;
    grossPrice = calculateOriginationPrice(futuresBrl, target_basis, totalCosts);
    netPrice = applyPercentageSpread(grossPrice, -desk_cost_pct);

    if (Math.abs(netPrice - priceEstimate) < 0.001) break;
    if (iterations >= maxIterations) {
      throw new Error(`Soybean convergence failed after ${maxIterations} iterations.`);
    }
    priceEstimate = netPrice;
  }

  netPrice = floorWithPrecision(netPrice, { increment: roundingInc });
  const deskCost = grossPrice * desk_cost_pct;
  const purchasedBasisBrl = netPrice - futuresBrl;
  const breakEvenBasisBrl = purchasedBasisBrl + totalCosts + deskCost;

  return {
    origination_price_net_brl: round4(netPrice),
    origination_price_gross_brl: round4(grossPrice),
    purchased_basis_brl: round4(purchasedBasisBrl),
    breakeven_basis_brl: round4(breakEvenBasisBrl),
    futures_price_brl: round4(futuresBrl),
    exchange_rate: round5(fxRate),
    costs: {
      storage_brl: round4(storageTotal),
      financial_brl: round4(financialCost),
      brokerage_brl: round4(brokerageBrl),
      desk_cost_brl: round4(deskCost),
      total_brl: round4(totalCosts + deskCost),
    },
    convergence_iterations: iterations,
  };
}

// ── Corn Engine ───────────────────────────────────────────────────────────

function runCornEngine(operationInputs: Record<string, any>, marketData: Record<string, any>) {
  const {
    payment_date, sale_date, grain_reception_date,
    interest_rate: rawRate, interest_rate_period: ratePeriodRaw,
    storage_cost: storageCostVal, storage_cost_type: storageTypeRaw,
    reception_cost, brokerage_per_contract, target_basis, desk_cost_pct,
    shrinkage_rate_monthly: shrinkageRate = 0.0,
    rounding_increment: roundingInc = CORN_ROUNDING_INCREMENT,
  } = operationInputs;

  const { b3_futures_brl, ticker, exp_date } = marketData;

  const ratePeriod: "monthly" | "yearly" =
    ["am", "a.m", "a.m.", "monthly"].includes(ratePeriodRaw) ? "monthly" : "yearly";
  const rate = rawRate > 0.5 ? rawRate / 100 : rawRate;
  const storageType: "fixed" | "monthly" =
    ["fixo", "fixed"].includes(storageTypeRaw) ? "fixed" : "monthly";

  const brokerageBrl = calculateBrokerageCost(brokerage_per_contract, CORN_B3_SACKS_PER_CONTRACT);

  let priceEstimate = b3_futures_brl;
  let iterations = 0;
  const maxIterations = 100;
  let storageTotal = 0, financialCost = 0, totalCosts = 0, grossPrice = 0, netPrice = 0;

  while (true) {
    iterations++;
    storageTotal = calculateStorageCost({
      storageCost: storageCostVal, storageCostType: storageType,
      receptionCost: reception_cost, startDate: grain_reception_date,
      endDate: sale_date, shrinkageRateMonthly: shrinkageRate,
      shrinkageBaseValue: priceEstimate,
    });
    financialCost = calculateFinancialCost({
      startDate: payment_date, endDate: sale_date,
      interestRate: rate, ratePeriod, baseValue: priceEstimate,
    });
    totalCosts = storageTotal + financialCost + brokerageBrl;
    grossPrice = calculateOriginationPrice(b3_futures_brl, target_basis, totalCosts);
    netPrice = applyPercentageSpread(grossPrice, -desk_cost_pct);

    if (Math.abs(netPrice - priceEstimate) < 0.001) break;
    if (iterations >= maxIterations) {
      throw new Error(`Corn convergence failed after ${maxIterations} iterations.`);
    }
    priceEstimate = netPrice;
  }

  netPrice = floorWithPrecision(netPrice, { increment: roundingInc });
  const deskCost = grossPrice * desk_cost_pct;
  const purchasedBasis = netPrice - b3_futures_brl;
  const breakEvenBasis = purchasedBasis + totalCosts + deskCost;

  return {
    origination_price_net_brl: round4(netPrice),
    origination_price_gross_brl: round4(grossPrice),
    purchased_basis_brl: round4(purchasedBasis),
    breakeven_basis_brl: round4(breakEvenBasis),
    futures_price_brl: round4(b3_futures_brl),
    costs: {
      storage_brl: round4(storageTotal),
      financial_brl: round4(financialCost),
      brokerage_brl: round4(brokerageBrl),
      desk_cost_brl: round4(deskCost),
      total_brl: round4(totalCosts + deskCost),
    },
    convergence_iterations: iterations,
  };
}

// ── Commodity Defaults ────────────────────────────────────────────────────

const COMMODITY_DEFAULTS: Record<string, Record<string, any>> = {
  soybean: {
    interest_rate: 1.4,
    interest_rate_period: "monthly",
    storage_cost: 3.5,
    storage_cost_type: "fixed",
    reception_cost: 0.0,
    brokerage_per_contract: 15.0,
    desk_cost_pct: 0.003,
    shrinkage_rate_monthly: 0.0,
    risk_free_rate: 0.149,
    sigma: 0.35,
    option_type: "call",
    additional_discount_brl: 0.0,
    rounding_increment: SOYBEAN_ROUNDING_INCREMENT,
  },
  corn: {
    interest_rate: 1.4,
    interest_rate_period: "monthly",
    storage_cost: 3.5,
    storage_cost_type: "fixed",
    reception_cost: 0.0,
    brokerage_per_contract: 12.0,
    desk_cost_pct: 0.003,
    shrinkage_rate_monthly: 0.003,
    risk_free_rate: 0.149,
    sigma: 0.35,
    option_type: "call",
    additional_discount_brl: 0.0,
    rounding_increment: CORN_ROUNDING_INCREMENT,
  },
};

// ── Custom Runner ─────────────────────────────────────────────────────────

interface CombinationInput {
  warehouse_id: string;
  display_name: string;
  commodity: "soybean" | "corn";
  payment_date: string;
  grain_reception_date?: string;
  sale_date: string;
  target_basis: number;
  ticker: string;
  exp_date: string;
  futures_price: number;
  exchange_rate?: number;
  // Optional overrides
  trade_date?: string;
  interest_rate?: number;
  interest_rate_period?: string;
  storage_cost?: number;
  storage_cost_type?: string;
  reception_cost?: number;
  brokerage_per_contract?: number;
  desk_cost_pct?: number;
  shrinkage_rate_monthly?: number;
  risk_free_rate?: number;
  sigma?: number;
  option_type?: string;
  additional_discount_brl?: number;
  rounding_increment?: number;
}

function runCustomPricingTable(
  combinations: CombinationInput[],
  globalTradeDate?: string,
): any[] {
  const effectiveGlobalDate = globalTradeDate ?? formatDateISO(new Date());
  const results: any[] = [];

  for (const combo of combinations) {
    const commodity = combo.commodity;
    if (!COMMODITY_DEFAULTS[commodity]) {
      throw new Error(`Unknown commodity: '${commodity}'.`);
    }

    // Merge: defaults ← combination (combination wins)
    const merged = { ...COMMODITY_DEFAULTS[commodity], ...combo };
    const effectiveTradeDate = merged.trade_date ?? effectiveGlobalDate;
    const grainReceptionDate = (merged.grain_reception_date && merged.grain_reception_date !== "")
      ? merged.grain_reception_date
      : merged.payment_date;

    // Build market data
    let marketData: Record<string, any>;
    if (commodity === "soybean") {
      // futures_price arrives in cents/bushel — convert to USD/bushel
      const futuresUsdPerBushel = merged.futures_price / 100;
      marketData = {
        cbot_futures_usd: futuresUsdPerBushel,
        ticker: merged.ticker,
        exp_date: merged.exp_date,
        exchange_rate: merged.exchange_rate,
      };
    } else {
      marketData = {
        b3_futures_brl: merged.futures_price,
        ticker: merged.ticker,
        exp_date: merged.exp_date,
      };
    }

    // Build operation inputs
    const operationInputs = {
      payment_date: merged.payment_date,
      sale_date: merged.sale_date,
      grain_reception_date: grainReceptionDate,
      interest_rate: merged.interest_rate,
      interest_rate_period: merged.interest_rate_period,
      storage_cost: merged.storage_cost,
      storage_cost_type: merged.storage_cost_type,
      reception_cost: merged.reception_cost,
      brokerage_per_contract: merged.brokerage_per_contract,
      target_basis: merged.target_basis,
      desk_cost_pct: merged.desk_cost_pct,
      shrinkage_rate_monthly: merged.shrinkage_rate_monthly,
      rounding_increment: merged.rounding_increment,
    };

    // Run engine
    let engineResult: any;
    if (commodity === "soybean") {
      engineResult = runSoybeanEngine(operationInputs, marketData);
    } else {
      engineResult = runCornEngine(operationInputs, marketData);
    }

    // Futures price in BRL/sack for insurance
    let fBrl: number;
    if (commodity === "soybean") {
      fBrl = convertUsdBushelToBrlSack(merged.futures_price / 100, merged.exchange_rate);
    } else {
      fBrl = merged.futures_price;
    }

    // Insurance
    const interestRateDecimal = merged.interest_rate > 0.5
      ? merged.interest_rate / 100
      : merged.interest_rate;
    const ratePeriod: "monthly" | "yearly" =
      ["am", "a.m", "a.m.", "monthly"].includes(merged.interest_rate_period) ? "monthly" : "yearly";

    const insurance = calculateInsurancePrices(
      fBrl,
      effectiveTradeDate,
      grainReceptionDate,
      merged.risk_free_rate,
      merged.sigma,
      interestRateDecimal,
      ratePeriod,
      merged.option_type as "call" | "put",
    );

    // Apply discount
    const discount = Number(merged.additional_discount_brl) || 0;
    const originationBrl = round4(engineResult.origination_price_net_brl - discount);

    results.push({
      warehouse_id: merged.warehouse_id,
      display_name: merged.display_name,
      commodity,
      payment_date: merged.payment_date,
      grain_reception_date: grainReceptionDate,
      sale_date: merged.sale_date,
      trade_date_used: effectiveTradeDate,
      target_basis_brl: merged.target_basis,
      ticker: merged.ticker,
      exp_date: merged.exp_date,
      origination_price_brl: originationBrl,
      gross_price_brl: engineResult.origination_price_gross_brl,
      purchased_basis_brl: engineResult.purchased_basis_brl,
      breakeven_basis_brl: engineResult.breakeven_basis_brl,
      futures_price_brl: fBrl,
      exchange_rate: commodity === "soybean" ? merged.exchange_rate : null,
      costs: engineResult.costs,
      additional_discount_brl: discount,
      insurance,
    });
  }

  return results;
}

// ── HTTP Handler ──────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { combinations, trade_date } = body;

    if (!combinations || !Array.isArray(combinations)) {
      return new Response(
        JSON.stringify({ error: "Field 'combinations' (array) is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const results = runCustomPricingTable(combinations, trade_date);

    return new Response(
      JSON.stringify({ results, count: results.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("run-custom-pricing error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
