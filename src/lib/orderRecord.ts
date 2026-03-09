export interface OrderRecord {
  id: string;
  sequentialNumber: number;
  operationId: string | null;

  commodity: "soybean" | "corn";
  exchange: "cbot" | "b3";

  warehouseId: string;
  warehouseDisplayName: string;

  volumeSacks: number;
  volumeTons: number;
  volumeBushels: number | null;

  originationPriceNetBrl: number;
  originationPriceGrossBrl: number;
  futuresPrice: number;
  futuresPriceCurrency: "USD" | "BRL";
  exchangeRate: number | null;

  targetBasisBrl: number;
  purchasedBasisBrl: number;
  breakEvenBasisBrl: number;

  costs: {
    storageBrl: number;
    financialBrl: number;
    brokerageBrl: number;
    deskCostBrl: number;
    totalBrl: number;
  };

  ticker: string;
  expDate: string;

  legs: Array<{
    legType: "futures" | "ndf" | "option";
    direction: "buy" | "sell";
    ticker?: string;
    contracts?: number;
    volumeUnits?: number;
    unitLabel?: string;
    notionalUsd?: number;
    ndfRate?: number;
    ndfMaturity?: string;
  }>;

  broker: string;
  brokerAccount: string;
  brokeragePerContract: number;
  brokerageCurrency: "USD" | "BRL";

  paymentDate: string;
  saleDate: string;

  orderMessage: string;
  confirmationMessage: string;

  status: "GENERATED" | "SENT" | "BROKER_CONFIRMED" | "LINKED" | "CANCELLED";

  stonexConfirmationText: string | null;
  stonexConfirmedAt: string | null;

  operationDate: string;
  generatedAt: string;
  generatedByUserId: string | null;
  notes: string | null;
}
