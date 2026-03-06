// utils.ts

// TypeScript port of utils.py — AgroUtils, SoybeanUtils, CornUtils

// Pure calculation functions, no I/O, no side effects.

// ── Date helpers (inlined from helpers.py) ────────────────────────────────

/** Parse a date string (YYYY-MM-DD) or Date object into a Date. */

export function toDate(value: string | Date): Date {

  if (value instanceof Date) return value;

  const [y, m, d] = value.slice(0, 10).split("-").map(Number);

  return new Date(y, m - 1, d);

}

/** Calendar days between two dates (absolute). */

export function daysBetween(a: string | Date, b: string | Date): number {

  const da = toDate(a);

  const db = toDate(b);

  return Math.abs(Math.round((db.getTime() - da.getTime()) / 86_400_000));

}

/**

 * Next Tuesday after reference date.

 * If reference IS Tuesday, returns following Tuesday (T+7).

 */

export function nextTuesday(referenceDate: string | Date): Date {

  const ref = toDate(referenceDate);

  const TUESDAY = 2; // JS: 0=Sun, 1=Mon, 2=Tue

  const weekday = ref.getDay();

  if (weekday === TUESDAY) {

    return new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() + 7);

  }

  let daysAhead = (TUESDAY - weekday + 7) % 7;

  if (daysAhead === 0) daysAhead = 7;

  return new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() + daysAhead);

}

/** Format Date as YYYY-MM-DD string. */

export function formatDateISO(d: Date): string {

  const y = d.getFullYear();

  const m = String(d.getMonth() + 1).padStart(2, "0");

  const day = String(d.getDate()).padStart(2, "0");

  return `${y}-${m}-${day}`;

}

/** Format Date as DD/MM for display. */

export function formatDateBR(d: Date): string {

  const day = String(d.getDate()).padStart(2, "0");

  const m = String(d.getMonth() + 1).padStart(2, "0");

  return `${day}/${m}`;

}

/** Convert YYYY-MM-DD to DD-MM-YYYY for Brazilian display. */

export function formatDateBRFull(dateStr: string): string {

  if (dateStr.length >= 10 && dateStr[4] === "-") {

    const [y, m, d] = dateStr.slice(0, 10).split("-");

    return `${d}-${m}-${y}`;

  }

  return dateStr;

}

// ── Soybean Constants ─────────────────────────────────────────────────────

export const SoybeanUtils = {

  BUSHELS_PER_SACK: 2.20462,

  CONTRACT_SIZE_BUSHELS: 5000,

  ROUNDING_INCREMENT: 0.50,

  TICKER_ROOT: "ZS",

  CONTRACT_MONTHS: { 1: "F", 3: "H", 5: "K", 7: "N", 8: "Q", 9: "U", 11: "X" } as Record<number, string>,

  /** Convert BRL/sack → USD/bushel. */

  convertBrlSackToUsdBushel(priceBrlSack: number, exchangeRate: number): number {

    return priceBrlSack / (2.20462 * exchangeRate);

  },

  /** Convert USD/bushel → BRL/sack. */

  convertUsdBushelToBrlSack(priceUsdBushel: number, exchangeRate: number): number {

    return priceUsdBushel * 2.20462 * exchangeRate;

  },

  /**

   * Calculate CBOT contracts from physical volume in sacks.

   * Contracts truncated to 0.01 to avoid over-hedging.

   */

  calculateCbotContractsFromSacks(volumeSacks: number): {

    contracts: number;

    volumeBushels: number;

    volumeSacks: number;

  } {

    const volumeBushels = volumeSacks * 2.20462;

    const contractsRaw = volumeBushels / 5000;

    const contracts = floorWithPrecision(contractsRaw, { increment: 0.01 });

    return { contracts, volumeBushels, volumeSacks };

  },

} as const;

// ── Corn Constants ────────────────────────────────────────────────────────

export const CornUtils = {

  BUSHELS_PER_SACK: 2.20462,

  CONTRACT_SIZE_BUSHELS: 5000,

  B3_SACKS_PER_CONTRACT: 450,

  ROUNDING_INCREMENT: 0.25,

  TICKER_ROOT: "ZC",

  B3_TICKER_ROOT: "CCM",

  CONTRACT_MONTHS: { 1: "F", 3: "H", 5: "K", 7: "N", 9: "U", 11: "X" } as Record<number, string>,

  B3_CONTRACT_MONTHS: { 1: "F", 3: "H", 5: "K", 7: "N", 9: "U", 11: "X" } as Record<number, string>,

  /** Convert USD/bushel → BRL/sack (corn). */

  convertUsdBushelToBrlSack(priceUsdBushel: number, exchangeRate: number): number {

    return priceUsdBushel * 2.20462 * exchangeRate;

  },

  /**

   * Calculate B3 contracts from physical volume in sacks.

   * Contracts truncated to 0.01 to avoid over-hedging.

   */

  calculateB3ContractsFromSacks(volumeSacks: number): {

    contracts: number;

    volumeSacks: number;

  } {

    const contractsRaw = volumeSacks / 450;

    const contracts = floorWithPrecision(contractsRaw, { increment: 0.01 });

    return { contracts, volumeSacks };

  },

} as const;

// ── AgroUtils ─────────────────────────────────────────────────────────────

/** Apply a percentage spread to a value. */

export function applyPercentageSpread(value: number, spreadRate: number): number {

  return value * (1 + spreadRate);

}

/**

 * Floor a value to specified precision.

 * Two modes:

 *   - By decimal places (default): floors to N decimal places.

 *   - By increment: floors to the nearest multiple of `increment`.

 * When `increment` is provided, `decimalPlaces` is ignored.

 */

export function floorWithPrecision(

  value: number,

  opts: { decimalPlaces?: number; increment?: number } = {},

): number {

  const { decimalPlaces = 2, increment } = opts;

  const factor = increment != null ? 1.0 / increment : Math.pow(10, decimalPlaces);

  return Math.floor(value * factor) / factor;

}

/** Calculate brokerage cost per unit. */

export function calculateBrokerageCost(

  costPerContract: number,

  unitsPerContract: number,

): number {

  return Math.round((costPerContract / unitsPerContract) * 10000) / 10000;

}

/**

 * Calculate compound interest cost over a time period.

 * ratePeriod: 'monthly' or 'yearly'.

 */

export function calculateFinancialCost(params: {

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

/**

 * Calculate total storage cost including reception and shrinkage.

 */

export function calculateStorageCost(params: {

  storageCost: number;

  storageCostType: "monthly" | "fixed";

  receptionCost?: number;

  startDate?: string | Date;

  endDate?: string | Date;

  shrinkageRateMonthly?: number;

  shrinkageBaseValue?: number;

}): number {

  const {

    storageCost,

    storageCostType,

    receptionCost = 0,

    startDate,

    endDate,

    shrinkageRateMonthly = 0,

    shrinkageBaseValue = 0,

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

/** origination_price = exchange_price + basis - costs */

export function calculateOriginationPrice(

  exchangePrice: number,

  basis: number,

  costs: number = 0,

): number {

  return exchangePrice + basis - costs;

}

/**

 * Calculates the estimated USD forward rate based on StoneX daily carry cost.

 */

export function calculateStonexForwardDolRate(

  spotRate: number,

  targetDate: string,

  baseDate: string,

): number {

  const daysDiff = daysBetween(baseDate, targetDate);

  const dailyFactor = 0.001163;

  const totalDifferential = daysDiff * dailyFactor;

  return Math.round((spotRate + totalDifferential) * 10000) / 10000;

}

// ── Ticker Utils ──────────────────────────────────────────────────────────

const COMMODITY_CONFIG: Record<

  string,

  { tickerRoot: string; contractMonths: Record<number, string> }

> = {

  soybean: {

    tickerRoot: SoybeanUtils.TICKER_ROOT,

    contractMonths: SoybeanUtils.CONTRACT_MONTHS,

  },

  corn: {

    tickerRoot: CornUtils.TICKER_ROOT,

    contractMonths: CornUtils.CONTRACT_MONTHS,

  },

};

/**

 * Generate a list of upcoming futures tickers for a commodity.

 * cutoffDay: day of month after which current month is skipped.

 */

export function generateFuturesTickers(

  commodity: string,

  quantity: number,

  referenceDate?: Date,

  cutoffDay: number = 1,

): string[] {

  const cfg = COMMODITY_CONFIG[commodity];

  if (!cfg) throw new Error(`Unsupported commodity '${commodity}'`);

  const dt = referenceDate ?? new Date();

  let year = dt.getFullYear();

  let month = dt.getMonth() + 1; // 1-indexed

  const tickers: string[] = [];

  while (tickers.length < quantity) {

    const code = cfg.contractMonths[month];

    if (code != null) {

      const isCurrentMonth = year === dt.getFullYear() && month === dt.getMonth() + 1;

      if (!(isCurrentMonth && dt.getDate() > cutoffDay)) {

        const yearSuffix = String(year).slice(-2);

        tickers.push(`${cfg.tickerRoot}${code}${yearSuffix}`);

      }

    }

    month++;

    if (month > 12) {

      month = 1;

      year++;

    }

  }

  return tickers;

}

/** Parse a CBOT futures ticker into components. */

export function parseCbotTicker(

  ticker: string,

  commodity?: string,

): { root: string; year: number; month: number; commodity: string } | null {

  if (ticker.length < 4) return null;

  const monthCode = ticker[ticker.length - 3];

  const yearSuffix = ticker.slice(-2);

  const root = ticker.slice(0, -3);

  if (!/^\d{2}$/.test(yearSuffix)) return null;

  let resolved = commodity ?? null;

  if (!resolved) {

    for (const [comm, cfg] of Object.entries(COMMODITY_CONFIG)) {

      if (cfg.tickerRoot === root) {

        resolved = comm;

        break;

      }

    }

  }

  if (!resolved) return null;

  const monthsMap = COMMODITY_CONFIG[resolved]?.contractMonths;

  if (!monthsMap) return null;

  // Reverse lookup: code → month number

  const monthNumber = Object.entries(monthsMap).find(([, c]) => c === monthCode)?.[0];

  if (monthNumber == null) return null;

  return {

    root,

    year: 2000 + parseInt(yearSuffix, 10),

    month: parseInt(monthNumber, 10),

    commodity: resolved,

  };

}

/**

 * Estimate CBOT futures expiration date.

 * Rule: business day before the 15th calendar day of the contract month.

 * Simplified: if 15th is Mon-Fri → 14th; if 15th is Sat → 13th (Fri);

 * if 15th is Sun → 13th (Fri). No US federal holiday adjustment in TS version.

 */

export function estimateCbotExpiration(ticker: string, commodity?: string): Date | null {

  const parsed = parseCbotTicker(ticker, commodity);

  if (!parsed) return null;

  const day15 = new Date(parsed.year, parsed.month - 1, 15);

  const weekday = day15.getDay(); // 0=Sun, 6=Sat

  // Business day before the 15th

  if (weekday === 0) {

    // 15th is Sunday → Friday the 12th

    return new Date(parsed.year, parsed.month - 1, 12);

  }

  if (weekday === 6) {

    // 15th is Saturday → Friday the 14th

    return new Date(parsed.year, parsed.month - 1, 14);

  }

  if (weekday === 1) {

    // 15th is Monday → Friday the 12th

    return new Date(parsed.year, parsed.month - 1, 12);

  }

  // Tue-Fri → previous calendar day

  return new Date(parsed.year, parsed.month - 1, 14);

}
