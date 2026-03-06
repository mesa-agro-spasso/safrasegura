// soybeanCbotPricing.ts

// PricingEngineBasis — Soybean CBOT

// Pure calculation, no I/O, no side effects.

import {

  SoybeanUtils as su,

  calculateBrokerageCost,

  calculateStorageCost,

  calculateFinancialCost,

  calculateOriginationPrice,

  applyPercentageSpread,

  floorWithPrecision,

} from "./pricing-utils";

export interface SoybeanOperationInputs {

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

export interface SoybeanMarketData {

  cbotFuturesUsd: number;

  ticker: string;

  expDate: string;

  exchangeRate: number;

}

export interface SoybeanEngineResult {

  originationPriceGrossBrl: number;

  originationPriceNetBrl: number;

  targetBasisBrl: number;

  purchasedBasisBrl: number;

  breakEvenBasisBrl: number;

  breakEvenBasisUsd: number;

  purchasedBasisUsd: number;

  ticker: string;

  expDate: string;

  futuresPriceUsd: number;

  futuresPriceBrl: number;

  exchangeRate: number;

  costs: {

    storageBrl: number;

    financialBrl: number;

    brokerageBrl: number;

    deskCostBrl: number;

    totalBrl: number;

  };

  convergenceIterations: number;

}

export function calculateOriginationPriceSoybeanCbot(

  operationInputs: SoybeanOperationInputs,

  marketData: SoybeanMarketData,

  convergenceTolerance: number = 0.001,

): SoybeanEngineResult {

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

    roundingIncrement: roundingInc = 0.50,

  } = operationInputs;

  const { cbotFuturesUsd, ticker, expDate, exchangeRate: fxRate } = marketData;

  const ratePeriod: "monthly" | "yearly" =

    ["am", "a.m", "a.m."].includes(ratePeriodRaw) ? "monthly" : "yearly";

  const rate = rawRate > 0.5 ? rawRate / 100 : rawRate;

  const storageType: "fixed" | "monthly" =

    ["fixo", "fixed"].includes(storageTypeRaw) ? "fixed" : "monthly";

  const futuresBrl = su.convertUsdBushelToBrlSack(cbotFuturesUsd, fxRate);

  const brokerageUsdBu = calculateBrokerageCost(

    brokeragePerContract,

    su.CONTRACT_SIZE_BUSHELS,

  );

  const brokerageBrl = brokerageUsdBu * su.BUSHELS_PER_SACK * fxRate;

  let priceEstimate = futuresBrl;

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

    grossPrice = calculateOriginationPrice(futuresBrl, targetBasis, totalCosts);

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

  const purchasedBasisBrl = netPrice - futuresBrl;

  const breakEvenBasisBrl = purchasedBasisBrl + totalCosts + deskCost;

  const breakEvenBasisUsd = su.convertBrlSackToUsdBushel(breakEvenBasisBrl, fxRate);

  const purchasedBasisUsd = su.convertBrlSackToUsdBushel(purchasedBasisBrl, fxRate);

  return {

    originationPriceGrossBrl: round4(grossPrice),

    originationPriceNetBrl: round4(netPrice),

    targetBasisBrl: round4(targetBasis),

    breakEvenBasisBrl: round4(breakEvenBasisBrl),

    purchasedBasisBrl: round4(purchasedBasisBrl),

    breakEvenBasisUsd: round6(breakEvenBasisUsd),

    purchasedBasisUsd: round6(purchasedBasisUsd),

    ticker,

    expDate: String(expDate),

    futuresPriceUsd: round6(cbotFuturesUsd),

    futuresPriceBrl: round4(futuresBrl),

    exchangeRate: round5(fxRate),

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

function round5(v: number): number {

  return Math.round(v * 100000) / 100000;

}

function round6(v: number): number {

  return Math.round(v * 1000000) / 1000000;

}
