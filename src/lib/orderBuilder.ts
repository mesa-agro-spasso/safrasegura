// orderBuilder.ts
// Service — Origination → Structured Hedge Order
// Builds HedgeOrder from engine output, formats WhatsApp messages.

import {
  SoybeanUtils as su,
  CornUtils as cu,
  calculateBrokerageCost,
  floorWithPrecision,
  formatDateBRFull,
} from "./pricing-utils";
import type { SoybeanEngineResult } from "./soybeanCbotPricing";
import type { CornEngineResult } from "./cornB3Pricing";

const SACK_WEIGHT_KG = 60;
const KG_PER_TON = 1000;

type Commodity = "soybean" | "corn";
type Exchange = "cbot" | "b3";
type LegType = "futures" | "ndf" | "option";
type Direction = "buy" | "sell";

export interface OrderLeg {
  legType: LegType;
  direction: Direction;
  ticker?: string;
  contracts?: number;
  volumeUnits?: number;
  unitLabel?: string;
  notionalUsd?: number;
  ndfRate?: number;
  ndfMaturity?: string;
  ndfTableVersionId?: string;
  optionType?: "call" | "put";
  strike?: number;
  premium?: number;
  premiumCurrency?: string;
  expirationDate?: string;
  brokerageCost?: number;
}

export interface HedgeOrder {
  commodity: Commodity;
  exchange: Exchange;
  broker: string;
  brokerAccount: string;
  legs: OrderLeg[];
  volumeSacks: number;
  volumeTons: number;
  volumeBushels: number | null;
  originationPriceBrl: number;
  futuresPrice: number;
  futuresPriceCurrency: string;
  exchangeRate: number | null;
  brokeragePerContract: number;
  brokerageCurrency: string;
  paymentDate: string;
  saleDate: string;
  operationId?: string;
  generatedByUserId?: string;
  generatedAt: string;
  status: string;
  orderMessage: string;
  confirmationMessage: string;
  notes?: string;
}

function sacksToTons(volumeSacks: number): number {
  return Math.round((volumeSacks * SACK_WEIGHT_KG) / KG_PER_TON * 100) / 100;
}

function formatBrokerTicker(ticker: string, broker: string, exchange: string): string {
  if (broker === "stonex" && exchange === "cbot") {
    return ticker.startsWith("Z") ? ticker.slice(1) : ticker;
  }
  return ticker;
}

function formatOrderMessage(params: {
  legs: OrderLeg[];
  brokerTickerMap: Record<string, string>;
  brokerAccount: string;
  brokeragePerContract: number;
  brokerageCurrency: string;
  brokeragePerUnit: number;
}): string {
  const {
    legs,
    brokerTickerMap,
    brokerAccount,
    brokeragePerContract,
    brokerageCurrency,
    brokeragePerUnit,
  } = params;

  const lines: string[] = ["*Ordem*"];

  for (const leg of legs) {
    const directionPt = leg.direction === "sell" ? "vender" : "comprar";

    if (leg.legType === "futures") {
      const tickerDisplay = brokerTickerMap[leg.ticker ?? ""] ?? leg.ticker;
      lines.push(
        `- Futuros: ${directionPt} _*${leg.contracts?.toFixed(2)}*_ ` +
          `DE _*${tickerDisplay}*_ @mkt`,
      );
    } else if (leg.legType === "ndf") {
      const notionalFmt = (leg.notionalUsd ?? 0).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      const maturityStr = leg.ndfMaturity ? ` para _*${leg.ndfMaturity}*_` : "";
      lines.push(
        `- NDF: ${directionPt} _*${notionalFmt}*_ via NDF${maturityStr} @mkt`,
      );
    } else if (leg.legType === "option") {
      const tickerDisplay = brokerTickerMap[leg.ticker ?? ""] ?? leg.ticker;
      const optLabel = (leg.optionType ?? "").toUpperCase();
      lines.push(
        `- Opção: ${directionPt} _*${leg.contracts?.toFixed(2)}*_ ` +
          `_*${tickerDisplay}*_ ${optLabel} ` +
          `strike _*${leg.strike?.toFixed(2)}*_ ` +
          `@ _*${leg.premium?.toFixed(4)}*_ ${leg.premiumCurrency}`,
      );
    }
  }

  lines.push(`Conta ${brokerAccount}`);
  lines.push(
    `*OBS*.: comissao ${brokeragePerUnit} embutida, ` +
      `equivalente a ${brokeragePerContract.toFixed(2)} ${brokerageCurrency}/contrato`,
  );

  return lines.join("\n");
}

function formatConfirmationMessage(order: HedgeOrder): string {
  return [
    `Equivalente a _*${Math.round(order.volumeTons)}*_ ton`,
    `Pagamento em _*${order.paymentDate}*_`,
    `Venda prevista para _*${order.saleDate}*_`,
  ].join("\n");
}

export function buildSoybeanCbotOrder(params: {
  engineResult: SoybeanEngineResult;
  volumeSacks: number;
  brokeragePerContract: number;
  broker?: string;
  brokerAccount?: string;
  paymentDate?: string;
  saleDate?: string;
  operationId?: string;
  generatedByUserId?: string;
  ndfTableVersionId?: string;
  ndfMaturity?: string;
  notes?: string;
}): HedgeOrder {
  const {
    engineResult,
    volumeSacks,
    brokeragePerContract,
    broker = "stonex",
    brokerAccount = "",
    paymentDate = "",
    saleDate = "",
    operationId,
    generatedByUserId,
    ndfTableVersionId,
    ndfMaturity,
    notes,
  } = params;

  if (volumeSacks <= 0) throw new Error(`volumeSacks must be positive, got ${volumeSacks}`);

  const ticker = engineResult.ticker;
  const fxRate = engineResult.exchangeRate;
  const netPrice = engineResult.originationPriceNetBrl;
  const futuresUsd = engineResult.futuresPriceUsd;

  const volumeTons = sacksToTons(volumeSacks);
  const paymentDateBr = formatDateBRFull(paymentDate);
  const saleDateBr = formatDateBRFull(saleDate);
  const ndfMaturityBr = ndfMaturity ? formatDateBRFull(ndfMaturity) : undefined;

  const brokerageUsdBu = calculateBrokerageCost(
    brokeragePerContract,
    su.CONTRACT_SIZE_BUSHELS,
  );
  const brokerageBrlSack = Math.round(
    brokerageUsdBu * su.BUSHELS_PER_SACK * fxRate * 10000,
  ) / 10000;

  const contractCalc = su.calculateCbotContractsFromSacks(volumeSacks);
  const contracts = contractCalc.contracts;
  const volumeBushels = contractCalc.volumeBushels;

  const brokerTicker = formatBrokerTicker(ticker, broker, "cbot");

  const futuresLeg: OrderLeg = {
    legType: "futures",
    direction: "sell",
    ticker,
    contracts,
    volumeUnits: volumeBushels,
    unitLabel: "bushels",
    brokerageCost: brokerageBrlSack,
  };

  const notionalUsd = Math.round((netPrice * volumeSacks) / fxRate * 100) / 100;

  const ndfLeg: OrderLeg = {
    legType: "ndf",
    direction: "sell",
    notionalUsd,
    ndfRate: fxRate,
    ndfMaturity: ndfMaturityBr,
    ndfTableVersionId,
  };

  const legs = [futuresLeg, ndfLeg];
  const brokerTickerMap: Record<string, string> = { [ticker]: brokerTicker };

  const orderMessage = formatOrderMessage({
    legs,
    brokerTickerMap,
    brokerAccount,
    brokeragePerContract,
    brokerageCurrency: "USD",
    brokeragePerUnit: brokerageUsdBu,
  });

  const order: HedgeOrder = {
    commodity: "soybean",
    exchange: "cbot",
    broker,
    brokerAccount,
    legs,
    volumeSacks,
    volumeTons,
    volumeBushels,
    originationPriceBrl: netPrice,
    futuresPrice: futuresUsd,
    futuresPriceCurrency: "USD",
    exchangeRate: fxRate,
    brokeragePerContract,
    brokerageCurrency: "USD",
    paymentDate: paymentDateBr,
    saleDate: saleDateBr,
    operationId,
    generatedByUserId,
    generatedAt: new Date().toISOString(),
    status: "GENERATED",
    orderMessage,
    confirmationMessage: "",
    notes,
  };

  order.confirmationMessage = formatConfirmationMessage(order);

  return order;
}

export function buildCornB3Order(params: {
  engineResult: CornEngineResult;
  volumeSacks: number;
  brokeragePerContract: number;
  broker?: string;
  brokerAccount?: string;
  paymentDate?: string;
  saleDate?: string;
  operationId?: string;
  generatedByUserId?: string;
  notes?: string;
}): HedgeOrder {
  const {
    engineResult,
    volumeSacks,
    brokeragePerContract,
    broker = "stonex",
    brokerAccount = "",
    paymentDate = "",
    saleDate = "",
    operationId,
    generatedByUserId,
    notes,
  } = params;

  if (volumeSacks <= 0) throw new Error(`volumeSacks must be positive, got ${volumeSacks}`);

  const ticker = engineResult.ticker;
  const netPrice = engineResult.originationPriceNetBrl;
  const futuresBrl = engineResult.futuresPriceBrl;

  const volumeTons = sacksToTons(volumeSacks);
  const paymentDateBr = formatDateBRFull(paymentDate);
  const saleDateBr = formatDateBRFull(saleDate);

  const brokerageBrlSack = calculateBrokerageCost(
    brokeragePerContract,
    cu.B3_SACKS_PER_CONTRACT,
  );

  const contractCalc = cu.calculateB3ContractsFromSacks(volumeSacks);
  const contracts = contractCalc.contracts;

  const brokerTicker = formatBrokerTicker(ticker, broker, "b3");

  const futuresLeg: OrderLeg = {
    legType: "futures",
    direction: "sell",
    ticker,
    contracts,
    volumeUnits: volumeSacks,
    unitLabel: "sacks",
    brokerageCost: brokerageBrlSack,
  };

  const legs = [futuresLeg];
  const brokerTickerMap: Record<string, string> = { [ticker]: brokerTicker };

  const orderMessage = formatOrderMessage({
    legs,
    brokerTickerMap,
    brokerAccount,
    brokeragePerContract,
    brokerageCurrency: "BRL",
    brokeragePerUnit: brokerageBrlSack,
  });

  const order: HedgeOrder = {
    commodity: "corn",
    exchange: "b3",
    broker,
    brokerAccount,
    legs,
    volumeSacks,
    volumeTons,
    volumeBushels: null,
    originationPriceBrl: netPrice,
    futuresPrice: futuresBrl,
    futuresPriceCurrency: "BRL",
    exchangeRate: null,
    brokeragePerContract,
    brokerageCurrency: "BRL",
    paymentDate: paymentDateBr,
    saleDate: saleDateBr,
    operationId,
    generatedByUserId,
    generatedAt: new Date().toISOString(),
    status: "GENERATED",
    orderMessage,
    confirmationMessage: "",
    notes,
  };

  order.confirmationMessage = formatConfirmationMessage(order);

  return order;
}

export function buildHedgeOrder(params: {
  engineResult: SoybeanEngineResult | CornEngineResult;
  volumeSacks: number;
  commodity: Commodity;
  exchange: Exchange;
  brokeragePerContract: number;
  broker?: string;
  brokerAccount?: string;
  paymentDate?: string;
  saleDate?: string;
  operationId?: string;
  generatedByUserId?: string;
  ndfTableVersionId?: string;
  ndfMaturity?: string;
  notes?: string;
}): HedgeOrder {
  const { commodity, exchange } = params;

  if (commodity === "soybean" && exchange === "cbot") {
    return buildSoybeanCbotOrder({
      engineResult: params.engineResult as SoybeanEngineResult,
      volumeSacks: params.volumeSacks,
      brokeragePerContract: params.brokeragePerContract,
      broker: params.broker,
      brokerAccount: params.brokerAccount,
      paymentDate: params.paymentDate,
      saleDate: params.saleDate,
      operationId: params.operationId,
      generatedByUserId: params.generatedByUserId,
      ndfTableVersionId: params.ndfTableVersionId,
      ndfMaturity: params.ndfMaturity,
      notes: params.notes,
    });
  }

  if (commodity === "corn" && exchange === "b3") {
    return buildCornB3Order({
      engineResult: params.engineResult as CornEngineResult,
      volumeSacks: params.volumeSacks,
      brokeragePerContract: params.brokeragePerContract,
      broker: params.broker,
      brokerAccount: params.brokerAccount,
      paymentDate: params.paymentDate,
      saleDate: params.saleDate,
      operationId: params.operationId,
      generatedByUserId: params.generatedByUserId,
      notes: params.notes,
    });
  }

  throw new Error(
    `Unsupported commodity + exchange: ${commodity} + ${exchange}. ` +
      `Supported: soybean+cbot, corn+b3.`,
  );
}
