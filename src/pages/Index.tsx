import { useState } from "react";
import { BarChart3 } from "lucide-react";
import MarketData from "@/components/MarketData";
import type { MarketDataValues } from "@/components/MarketData";
import PriceTable from "@/components/PriceTable";
import DetailModal from "@/components/DetailModal";
import OrderGenerator from "@/components/OrderGenerator";
import ConfigPanel, {
  getDefaultConfig,
  buildWarehousesFromState,
  type ConfigState,
} from "@/components/ConfigPanel";
import {
  runPricingTable,
  estimateCbotExpiration,
  formatDateISO,
  type PricingResult,
} from "@/lib/pricing-index";

const Index = () => {
  const [config, setConfig] = useState<ConfigState>(getDefaultConfig);
  const [marketValues, setMarketValues] = useState<MarketDataValues | null>(null);
  const [results, setResults] = useState<PricingResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<PricingResult | null>(null);
  const [showOrder, setShowOrder] = useState(false);

  const handleGenerate = (values: MarketDataValues) => {
    setMarketValues(values);
    const today = formatDateISO(new Date());
    const expDateSoja = estimateCbotExpiration(values.contratoSoja);

    const warehouses = buildWarehousesFromState(config.warehouseStates);

    const pricingResults = runPricingTable({
      warehouses,
      sharedCosts: config.sharedCosts,
      market: {
        soybean: {
          cbotFuturesUsd: values.cbotSoja,
          ticker: values.contratoSoja,
          expDate: expDateSoja ? formatDateISO(expDateSoja) : values.dataVendaSoja,
          exchangeRate: values.dolarStonex,
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
        soybean: config.paymentDatesSoja,
        corn: config.paymentDatesMilho,
      },
    });

    setResults(pricingResults);
  };

  const handleCellClick = (result: PricingResult) => {
    setSelectedResult(result);
  };

  const handleGenerateOrder = (adjusted: PricingResult) => {
    setSelectedResult(adjusted);
    setShowOrder(true);
  };

  return (
    <div className="min-h-screen bg-background pb-8">
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

        <ConfigPanel config={config} onChange={setConfig} />

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

      {selectedResult && !showOrder && (
        <DetailModal
          open={true}
          onClose={() => setSelectedResult(null)}
          result={selectedResult}
          onGenerateOrder={handleGenerateOrder}
        />
      )}

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
