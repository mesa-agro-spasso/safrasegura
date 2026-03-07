import { useState } from "react";
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

export default function Pricing() {
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

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Precificação</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Insira os dados de mercado e gere a tabela de preços por praça e vencimento.
        </p>
      </div>

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
          onCellClick={(r) => setSelectedResult(r)}
        />
      )}

      {selectedResult && !showOrder && (
        <DetailModal
          open={true}
          onClose={() => setSelectedResult(null)}
          result={selectedResult}
          onGenerateOrder={(adjusted) => {
            setSelectedResult(adjusted);
            setShowOrder(true);
          }}
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
}
