// optionsUtils.ts
// TypeScript port of OptionsUtils — Black-76 pricing, insurance calculations.
// Pure computation, no I/O, no side effects.

import { daysBetween, calculateFinancialCost } from "./pricing-utils";

// ── Black-76 ──────────────────────────────────────────────────────────────

/**
 * Standard normal CDF approximation using the error function identity.
 */
function normCdf(x: number): number {
  return 0.5 * (1.0 + erf(x / Math.SQRT2));
}

/**
 * Error function approximation (Abramowitz & Stegun 7.1.26).
 * Max error ≈ 1.5 × 10⁻⁷.
 */
function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  const a = Math.abs(x);

  const t = 1.0 / (1.0 + 0.3275911 * a);
  const y =
    1.0 -
    (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-a * a);

  return sign * y;
}

/**
 * Black-76 theoretical price for options on futures.
 *
 * All price inputs must be in the same unit (BRL/sack recommended).
 *
 * @param F     Futures price (BRL/sack or any consistent unit).
 * @param K     Strike price (same unit as F).
 * @param T     Time to expiration in years (e.g., 90/365).
 * @param r     Risk-free rate as decimal (e.g., 0.135 for 13.5%).
 * @param sigma Implied volatility as decimal (e.g., 0.25 for 25%).
 * @param optionType 'call' or 'put'.
 * @returns     Theoretical option premium in the same unit as F and K.
 */
export function calculateBlack76Price(
  F: number,
  K: number,
  T: number,
  r: number,
  sigma: number,
  optionType: "call" | "put" = "call",
): number {
  if (F <= 0) throw new Error(`Futures price F must be positive, got ${F}.`);
  if (T <= 0) throw new Error(`Time to expiration T must be positive, got ${T}.`);
  if (sigma <= 0) throw new Error(`Volatility sigma must be positive, got ${sigma}.`);

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

// ── Premium Carry ─────────────────────────────────────────────────────────

/**
 * Calculate the financial carry cost of an option premium.
 * Uses compound interest, consistent with calculateFinancialCost.
 */
export function calculatePremiumCarry(params: {
  premiumBrl: number;
  tradeDate: string | Date;
  endDate: string | Date;
  interestRate: number;
  ratePeriod: "monthly" | "yearly";
}): number {
  const { premiumBrl, tradeDate, endDate, interestRate, ratePeriod } = params;
  return calculateFinancialCost({
    startDate: tradeDate,
    endDate: endDate,
    interestRate,
    ratePeriod,
    baseValue: premiumBrl,
  });
}

/**
 * Total insurance cost = premium + carry of the premium.
 */
export function calculateTotalInsuranceCost(
  premiumBrl: number,
  carryCostBrl: number,
): number {
  return round4(premiumBrl + carryCostBrl);
}

// ── Strike Suggestion ─────────────────────────────────────────────────────

/**
 * Suggest a strike price given a futures price and OTM percentage.
 *
 * For CALL: strike = futures × (1 + otmPct)   [above market]
 * For PUT:  strike = futures × (1 - otmPct)   [below market]
 */
export function suggestStrikeFromOtmPct(
  futuresPrice: number,
  otmPct: number,
  optionType: "call" | "put" = "call",
): number {
  if (optionType === "call") {
    return round4(futuresPrice * (1 + otmPct));
  }
  return round4(futuresPrice * (1 - otmPct));
}

// ── Insurance Price Calculation ───────────────────────────────────────────

export interface InsuranceLevel {
  strikeBrl: number;
  premiumBrl: number;
  carryBrl: number;
  totalCostBrl: number;
}

export interface InsurancePrices {
  atm: InsuranceLevel;
  otm_5: InsuranceLevel;
  otm_10: InsuranceLevel;
}

/**
 * Calculate theoretical insurance prices for ATM, 5% OTM, and 10% OTM.
 *
 * Uses Black-76 for the premium and compound interest carry
 * from tradeDate to grainReceptionDate.
 *
 * @param fBrl                 Futures price in BRL/sack.
 * @param tradeDate            Pricing / operation date (ISO string or Date).
 * @param grainReceptionDate   End date for T and carry (ISO string or Date).
 * @param r                    Risk-free rate as decimal (e.g., 0.149).
 * @param sigma                Implied volatility as decimal (e.g., 0.35).
 * @param interestRate         Carry rate as decimal (e.g., 0.014 for 1.4%/month).
 * @param interestRatePeriod   'monthly' or 'yearly'.
 * @param optionType           'call' or 'put'.
 */
export function calculateInsurancePrices(
  fBrl: number,
  tradeDate: string | Date,
  grainReceptionDate: string | Date,
  r: number,
  sigma: number,
  interestRate: number,
  interestRatePeriod: "monthly" | "yearly",
  optionType: "call" | "put" = "call",
): InsurancePrices {
  const days = daysBetween(tradeDate, grainReceptionDate);
  const T = days / 365.0;

  const levels: Record<string, number> = { atm: 0.0, otm_5: 0.05, otm_10: 0.10 };
  const result: Record<string, InsuranceLevel> = {};

  for (const [label, otmPct] of Object.entries(levels)) {
    const strike = suggestStrikeFromOtmPct(fBrl, otmPct, optionType);
    const premium = calculateBlack76Price(fBrl, strike, T, r, sigma, optionType);
    const carry = calculatePremiumCarry({
      premiumBrl: premium,
      tradeDate,
      endDate: grainReceptionDate,
      interestRate,
      ratePeriod: interestRatePeriod,
    });

    result[label] = {
      strikeBrl: strike,
      premiumBrl: premium,
      carryBrl: round4(carry),
      totalCostBrl: calculateTotalInsuranceCost(premium, carry),
    };
  }

  return result as unknown as InsurancePrices;
}

// ── Max Loss ──────────────────────────────────────────────────────────────

export const MAX_LOSS_UNLIMITED = 99_999_999.0;

/**
 * Calculate maximum loss per sack in a hedged operation.
 *
 * For a CALL (short futures + long call):
 *   max_loss = (strike - entry) + insuranceCost + optionBrokerage
 *
 * For a PUT (long put, no futures):
 *   max_loss = insuranceCost + optionBrokerage
 */
export function calculateMaxLoss(params: {
  entryPriceBrl: number;
  strikeBrl: number;
  insuranceCostBrl: number;
  optionBrokerageBrl?: number;
  optionType: "call" | "put";
  isFullHedge?: boolean;
}): number {
  const {
    entryPriceBrl,
    strikeBrl,
    insuranceCostBrl,
    optionBrokerageBrl = 0,
    optionType,
    isFullHedge = true,
  } = params;

  if (!isFullHedge) return MAX_LOSS_UNLIMITED;

  if (optionType === "call") {
    return round4((strikeBrl - entryPriceBrl) + insuranceCostBrl + optionBrokerageBrl);
  }
  return round4(insuranceCostBrl + optionBrokerageBrl);
}

// ── Option Brokerage ──────────────────────────────────────────────────────

/**
 * Calculate option brokerage cost per sack.
 */
export function calculateOptionBrokeragePerSack(
  brokeragePerContract: number,
  sacksPerContract: number,
  additionalLegs: number = 0,
  brokerageOnExit: boolean = false,
): number {
  let totalLegs = 1 + additionalLegs;
  let cost = (brokeragePerContract * totalLegs) / sacksPerContract;
  if (brokerageOnExit) cost *= 2;
  return round4(cost);
}

// ── Helpers ───────────────────────────────────────────────────────────────

function round4(v: number): number {
  return Math.round(v * 10000) / 10000;
}
