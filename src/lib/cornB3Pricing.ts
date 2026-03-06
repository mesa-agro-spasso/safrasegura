// cornB3Pricing.ts

// PricingEngineBasis — Corn B3 (CCM)

// Pure calculation, no I/O, no side effects.

import {

  CornUtils as cu,

  calculateBrokerageCost,

  calculateStorageCost,

  calculateFinancialCost,

  calculateOriginationPrice,

  applyPercentageSpread,

  floorWithPrecision,

} from "./pricing-utils";

export interface CornOperationInputs {

  paymentDate: string;

  saleDate: string;

  grainReceptionDate: string;

  interestRate: number;

  interestRatePeriod: string;

  storageCost: number;

  storageCostType: string;

  receptionCost: number;

  brokeragePerContract: number;

  targetBasis: number;

  deskCostPct: number;

  shrinkageRateMonthly?: number;

  roundingIncrement?: number;

}

export interface CornMarketData {

  b3FuturesBrl: number;

  ticker: string;

  expDate: string;

}

export interface CornEngineResult {

  originationPriceGrossBrl: number;

  originationPriceNetBrl: number;

  targetBasisBrl: number;

  purchasedBasisBrl: number;

  breakEvenBasisBrl: number;

  ticker: string;

  expDate: string;

  futuresPriceBrl: number;

  costs: {

    storageBrl: number;

    financialBrl: number;

    brokerageBrl: number;

    deskCostBrl: number;

    totalBrl: number;

  };

  convergenceIterations: number;

}

export function calculateOriginationPriceCornB3(

  operationInputs: CornOperationInputs,

  marketData: CornMarketData,

  convergenceTolerance: number = 0.001,

): CornEngineResult {

  const {

    paymentDate,

    saleDate,

    grainReceptionDate,

    interestRate: rawRate,

    interestRatePeriod: ratePeriodRaw,

    storageCost: storageCostVal,

    storageCostType: storageTypeRaw,

    receptionCost,

    brokeragePerContract,

    targetBasis,

    deskCostPct,

    shrinkageRateMonthly: shrinkageRate = 0.0,

    roundingIncrement: roundingInc = cu.ROUNDING_INCREMENT,

  } = operationInputs;

  const { b3FuturesBrl, ticker, expDate } = marketData;

  const ratePeriod: "monthly" | "yearly" =

    ["am", "a.m", "a.m."].includes(ratePeriodRaw) ? "monthly" : "yearly";

  const rate = rawRate > 0.5 ? rawRate / 100 : rawRate;

  const storageType: "fixed" | "monthly" =

    ["fixo", "fixed"].includes(storageTypeRaw) ? "fixed" : "monthly";

  const brokerageBrl = calculateBrokerageCost(

    brokeragePerContract,

    cu.B3_SACKS_PER_CONTRACT,

  );

  let priceEstimate = b3FuturesBrl;

  let iterations = 0;

  const maxIterations = 100;

  let storageTotal = 0;

  let financialCost = 0;

  let totalCosts = 0;

  let grossPrice = 0;

  let netPrice = 0;

  while (true) {

    iterations++;

    storageTotal = calculateStorageCost({

      storageCost: storageCostVal,

      storageCostType: storageType,

      receptionCost,

      startDate: grainReceptionDate,

      endDate: saleDate,

      shrinkageRateMonthly: shrinkageRate,

      shrinkageBaseValue: priceEstimate,

    });

    financialCost = calculateFinancialCost({

      startDate: paymentDate,

      endDate: saleDate,

      interestRate: rate,

      ratePeriod,

      baseValue: priceEstimate,

    });

    totalCosts = storageTotal + financialCost + brokerageBrl;

    grossPrice = calculateOriginationPrice(b3FuturesBrl, targetBasis, totalCosts);

    netPrice = applyPercentageSpread(grossPrice, -deskCostPct);

    if (Math.abs(netPrice - priceEstimate) < convergenceTolerance) {

      break;

    }

    if (iterations >= maxIterations) {

      throw new Error(

        `Convergence not reached after ${maxIterations} iterations. ` +

          `Last delta: ${Math.abs(netPrice - priceEstimate).toFixed(6)}`,

      );

    }

    priceEstimate = netPrice;

  }

  netPrice = floorWithPrecision(netPrice, { increment: roundingInc });

  const deskCost = grossPrice * deskCostPct;

  const purchasedBasis = netPrice - b3FuturesBrl;

  const breakEvenBasis = purchasedBasis + totalCosts + deskCost;

  return {

    originationPriceGrossBrl: round4(grossPrice),

    originationPriceNetBrl: round4(netPrice),

    targetBasisBrl: round4(targetBasis),

    breakEvenBasisBrl: round4(breakEvenBasis),

    purchasedBasisBrl: round4(purchasedBasis),

    ticker,

    expDate: String(expDate),

    futuresPriceBrl: round4(b3FuturesBrl),

    costs: {

      storageBrl: round4(storageTotal),

      financialBrl: round4(financialCost),

      brokerageBrl: round4(brokerageBrl),

      deskCostBrl: round4(deskCost),

      totalBrl: round4(totalCosts + deskCost),

    },

    convergenceIterations: iterations,

  };

}

function round4(v: number): number {

  return Math.round(v * 10000) / 10000;

}
