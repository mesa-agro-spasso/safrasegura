// pricingTableRunner.ts

// Batch runner: pricing engines across warehouses × payment dates.

// Pure computation — no I/O, no database, no side effects.

import {

  SoybeanUtils as su,

  CornUtils as cu,

  nextTuesday,

  toDate,

  formatDateISO,

  formatDateBR,

} from "./pricing-utils";

import {

  calculateOriginationPriceSoybeanCbot,

  type SoybeanOperationInputs,

  type SoybeanMarketData,

  type SoybeanEngineResult,

} from "./soybeanCbotPricing";

import {

  calculateOriginationPriceCornB3,

  type CornOperationInputs,

  type CornMarketData,

  type CornEngineResult,

} from "./cornB3Pricing";

export interface BasisConfig {

  mode: "fixed" | "reference_delta";

  value?: number;

  referenceWarehouseId?: string;

  deltaBrl?: number;

}

export interface CommodityConfig {

  basisConfig: BasisConfig;

  costOverrides?: Record<string, number>;

  paymentDateOverrides?: string[];

}

export interface WarehouseConfig {

  displayName: string;

  soybean?: CommodityConfig;

  corn?: CommodityConfig;

}

export interface SharedCosts {

  interestRate: number;

  interestRatePeriod: string;

  storageCost: number;

  storageCostType: string;

  receptionCost: number;

  brokeragePerContract: number;

  deskCostPct: number;

  shrinkageRateMonthly: number;

}

export interface SoybeanMarketSnapshot {

  cbotFuturesUsd: number;

  ticker: string;

  expDate: string;

  exchangeRate: number;

  saleDate?: string;

}

export interface CornMarketSnapshot {

  b3FuturesBrl: number;

  ticker: string;

  expDate: string;

  exchangeRate?: number;

  saleDate?: string;

}

export interface MarketSnapshots {

  soybean?: SoybeanMarketSnapshot;

  corn?: CornMarketSnapshot;

}

export interface PricingResult {

  warehouseId: string;

  displayName: string;

  commodity: string;

  paymentLabel: string;

  paymentDate: string;

  saleDate: string;

  targetBasisBrl: number;

  grossPriceBrl: number;

  netPriceBrl: number;

  purchasedBasisBrl: number;

  breakEvenBasisBrl: number;

  costs: {

    storageBrl: number;

    financialBrl: number;

    brokerageBrl: number;

    deskCostBrl: number;

    totalBrl: number;

  };

  engineResult: SoybeanEngineResult | CornEngineResult;

}

function resolveBasis(

  basisConfig: BasisConfig,

  warehouses: Record<string, WarehouseConfig>,

  commodity: "soybean" | "corn",

): number {

  if (basisConfig.mode === "fixed") {

    return basisConfig.value!;

  }

  if (basisConfig.mode === "reference_delta") {

    const refId = basisConfig.referenceWarehouseId!;

    const delta = basisConfig.deltaBrl!;

    const refWh = warehouses[refId];

    if (!refWh) throw new Error(`Reference warehouse '${refId}' not found.`);

    const refCommodity = refWh[commodity];

    if (!refCommodity) {

      throw new Error(`Reference warehouse '${refId}' has no config for '${commodity}'.`);

    }

    const refBasis = resolveBasis(refCommodity.basisConfig, warehouses, commodity);

    return refBasis + delta;

  }

  throw new Error(`Unknown basis_config mode: '${basisConfig.mode}'.`);

}

interface PaymentSlot {

  label: string;

  date: string;

}

function buildPaymentSchedule(

  tradeDate: string,

  extraDates?: string[],

): PaymentSlot[] {

  const spotDate = nextTuesday(tradeDate);

  const schedule: PaymentSlot[] = [

    { label: "À vista", date: formatDateISO(spotDate) },

  ];

  if (extraDates) {

    for (const d of extraDates) {

      const dt = toDate(d);

      schedule.push({ label: formatDateBR(dt), date: formatDateISO(dt) });

    }

  }

  return schedule;

}

export function runPricingTable(params: {

  warehouses: Record<string, WarehouseConfig>;

  sharedCosts: SharedCosts;

  market: MarketSnapshots;

  tradeDate: string;

  paymentDates?: Record<string, string[]>;

}): PricingResult[] {

  const { warehouses, sharedCosts, market, tradeDate, paymentDates = {} } = params;

  const results: PricingResult[] = [];

  for (const [whId, whCfg] of Object.entries(warehouses)) {

    const displayName = whCfg.displayName;

    for (const commodity of ["soybean", "corn"] as const) {

      const commodityCfg = whCfg[commodity];

      if (!commodityCfg) continue;

      const marketSnapshot = market[commodity];

      if (!marketSnapshot) continue;

      const targetBasis = resolveBasis(commodityCfg.basisConfig, warehouses, commodity);

      const extra =

        commodityCfg.paymentDateOverrides ?? paymentDates[commodity] ?? [];

      const schedule = buildPaymentSchedule(tradeDate, extra);

      const mergedCosts = { ...sharedCosts, ...commodityCfg.costOverrides };

      const saleDate =

        (marketSnapshot as any).saleDate ?? (marketSnapshot as any).expDate ?? "";

      for (const paySlot of schedule) {

        const grainReceptionDate = paySlot.date;

        if (commodity === "soybean") {

          const mkt = marketSnapshot as SoybeanMarketSnapshot;

          const roundingInc =

            (mergedCosts as any).roundingIncrement ?? su.ROUNDING_INCREMENT;

          const opInputs: SoybeanOperationInputs = {

            paymentDate: paySlot.date,

            saleDate,

            grainReceptionDate,

            interestRate: mergedCosts.interestRate,

            interestRatePeriod: mergedCosts.interestRatePeriod,

            storageCost: mergedCosts.storageCost,

            storageCostType: mergedCosts.storageCostType,

            receptionCost: mergedCosts.receptionCost,

            brokeragePerContract: mergedCosts.brokeragePerContract,

            targetBasis,

            deskCostPct: mergedCosts.deskCostPct,

            shrinkageRateMonthly: mergedCosts.shrinkageRateMonthly,

            roundingIncrement: roundingInc,

          };

          const mktData: SoybeanMarketData = {

            cbotFuturesUsd: mkt.cbotFuturesUsd,

            ticker: mkt.ticker,

            expDate: mkt.expDate,

            exchangeRate: mkt.exchangeRate,

          };

          const engineResult = calculateOriginationPriceSoybeanCbot(opInputs, mktData);

          results.push({

            warehouseId: whId,

            displayName,

            commodity,

            paymentLabel: paySlot.label,

            paymentDate: paySlot.date,

            saleDate,

            targetBasisBrl: targetBasis,

            grossPriceBrl: engineResult.originationPriceGrossBrl,

            netPriceBrl: engineResult.originationPriceNetBrl,

            purchasedBasisBrl: engineResult.purchasedBasisBrl,

            breakEvenBasisBrl: engineResult.breakEvenBasisBrl,

            costs: engineResult.costs,

            engineResult,

          });

        } else {

          const mkt = marketSnapshot as CornMarketSnapshot;

          const roundingInc =

            (mergedCosts as any).roundingIncrement ?? cu.ROUNDING_INCREMENT;

          const opInputs: CornOperationInputs = {

            paymentDate: paySlot.date,

            saleDate,

            grainReceptionDate,

            interestRate: mergedCosts.interestRate,

            interestRatePeriod: mergedCosts.interestRatePeriod,

            storageCost: mergedCosts.storageCost,

            storageCostType: mergedCosts.storageCostType,

            receptionCost: mergedCosts.receptionCost,

            brokeragePerContract: mergedCosts.brokeragePerContract,

            targetBasis,

            deskCostPct: mergedCosts.deskCostPct,

            shrinkageRateMonthly: mergedCosts.shrinkageRateMonthly,

            roundingIncrement: roundingInc,

          };

          const mktData: CornMarketData = {

            b3FuturesBrl: mkt.b3FuturesBrl,

            ticker: mkt.ticker,

            expDate: mkt.expDate,

          };

          const engineResult = calculateOriginationPriceCornB3(opInputs, mktData);

          results.push({

            warehouseId: whId,

            displayName,

            commodity,

            paymentLabel: paySlot.label,

            paymentDate: paySlot.date,

            saleDate,

            targetBasisBrl: targetBasis,

            grossPriceBrl: engineResult.originationPriceGrossBrl,

            netPriceBrl: engineResult.originationPriceNetBrl,

            purchasedBasisBrl: engineResult.purchasedBasisBrl,

            breakEvenBasisBrl: engineResult.breakEvenBasisBrl,

            costs: engineResult.costs,

            engineResult,

          });

        }

      }

    }

  }

  return results;

}
