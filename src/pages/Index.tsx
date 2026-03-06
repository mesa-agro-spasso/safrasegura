import { useState } from "react";
import { BarChart3 } from "lucide-react";
import MarketData from "@/components/MarketData";
import type { MarketDataValues } from "@/components/MarketData";
import PriceTable from "@/components/PriceTable";
import DetailModal from "@/components/DetailModal";
import OrderGenerator from "@/components/OrderGenerator";
import {
  runPricingTable,
  estimateCbotExpiration,
  formatDateISO,
  type PricingResult,
  type WarehouseConfig,
  type SharedCosts,
} from "@/lib/pricing-index";

const warehouses: Record<string, WarehouseConfig> = {
  confresa: {
    displayName: "Confresa",
    soybean: { basisConfig: { mode: "fixed", value: -29.0 } },
    corn: {
      basisConfig: { mode: "fixed", value: -25.0 },
      costOverrides: { brokeragePerContract: 12.0, shrinkageRateMonthly: 0.003 },
    },
  },
  matupa: {
    displayName: "Matupá",
    soybean: { basisConfig: { mode: "fixed", value: -30.0 } },
    corn: {
      basisConfig: { mode: "fixed", value: -30.0 },
      costOverrides: { brokeragePerContract: 12.0, shrinkageRateMonthly: 0.003 },
    },
  },
  alta_floresta: {
    displayName: "Alta Floresta",
    soybean: {
      basisConfig: { mode: "reference_delta", referenceWarehouseId: "matupa", deltaBrl: -1.0 },
    },
    corn: {
      basisConfig: { mode: "reference_delta", referenceWarehouseId: "matupa", deltaBrl: -1.5 },
      costOverrides: { brokeragePerContract: 12.0, shrinkageRateMonthly: 0.003 },
    },
  },
};

const sharedCosts: SharedCosts = {
  interestRate: 1.4,
  interestRatePeriod: "am",
  storageCost: 3.5,
  storageCostType: "fixed",
  receptionCost: 0.0,
  brokeragePerContract: 15.0,
  deskCostPct: 0.003,
  shrinkageRateMonthly: 0.0,
};

const Index = () => {
  const [marketValues, setMarketValues] = useState<MarketDataValues | null>(null);
  const [results, setResults] = useState<PricingResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<PricingResult | null>(null);
  const [showOrder, setShowOrder] = useState(false);

  const handleGenerate = (values: MarketDataValues) => {
    setMarketValues(values);
    const today = formatDateISO(new Date());

    const expDateSoja = estimateCbotExpiration(values.contratoSoja);

    const pricingResults = runPricingTable({
      warehouses,
      sharedCosts,
      market: {
        soybean: {
          cbotFuturesUsd: values.cbotSoja,
          ticker: values.contratoSoja,
          expDate: expDateSoja ? formatDateISO(expDateSoja) : values.dataVendaSoja,
          exchangeRate: values.dolarStonex, // forward, NOT spot
          saleDate: values.dataVendaSoja,
        },
        corn: {
          b3FuturesBrl: values.b3Milho,
          ticker: values.contratoMilho,
          expDate: values.dataVendaMilho,
          saleDate: values.dataVendaMilho,
        },
      },
      tradeDate: today,
      paymentDates: {
        soybean: ["2026-03-30", "2026-04-30"],
        corn: ["2026-08-30", "2026-09-30"],
      },
    });

    setResults(pricingResults);
  };

  const handleCellClick = (result: PricingResult) => {
    setSelectedResult(result);
  };

  const handleGenerateOrder = () => {
    setShowOrder(true);
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur-sm">
        <div className="container flex items-center gap-2 py-3">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h1 className="text-sm font-bold tracking-tight">
            Mesa de Originação
          </h1>
          <span className="ml-auto rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-primary">
            Grãos
          </span>
        </div>
      </header>

      <main className="container space-y-4 pt-4">
        <MarketData onGenerate={handleGenerate} />

        {results.length > 0 && marketValues && (
          <PriceTable
            results={results}
            contratoSoja={marketValues.contratoSoja}
            cbotSoja={marketValues.cbotSoja}
            dolarStonex={marketValues.dolarStonex}
            contratoMilho={marketValues.contratoMilho}
            b3Milho={marketValues.b3Milho}
            onCellClick={handleCellClick}
          />
        )}
      </main>

      {/* Detail Modal */}
      {selectedResult && !showOrder && (
        <DetailModal
          open={true}
          onClose={() => setSelectedResult(null)}
          result={selectedResult}
          onGenerateOrder={handleGenerateOrder}
        />
      )}

      {/* Order Generator */}
      {selectedResult && showOrder && (
        <OrderGenerator
          open={true}
          onClose={() => { setShowOrder(false); setSelectedResult(null); }}
          result={selectedResult}
        />
      )}
    </div>
  );
};

export default Index;
