import { useMemo } from "react";
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
import { usePersistentState } from "@/hooks/use-persistent-state";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";

const TEN_HOURS_MS = 10 * 60 * 60 * 1000;

export default function Pricing() {
  const [config, setConfig] = usePersistentState<ConfigState>("pricing_config", getDefaultConfig);
  const [marketValues, setMarketValues] = usePersistentState<MarketDataValues | null>("pricing_market", null);
  const [results, setResults] = usePersistentState<PricingResult[]>("pricing_results", []);
  const [generatedAt, setGeneratedAt] = usePersistentState<string | null>("pricing_generated_at", null);

  const [selectedResult, setSelectedResult] = useState<PricingResult | null>(null);
  const [showOrder, setShowOrder] = useState(false);

  const isExpired = useMemo(() => {
    if (!generatedAt) return false;
    return Date.now() - new Date(generatedAt).getTime() > TEN_HOURS_MS;
  }, [generatedAt]);

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
    setGeneratedAt(new Date().toISOString());
  };

  const handleMarketChange = (values: MarketDataValues) => {
    setMarketValues(values);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Precificação</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Insira os dados de mercado e gere a tabela de preços por praça e vencimento.
        </p>
      </div>

      <MarketData
        onGenerate={handleGenerate}
        initialValues={marketValues ?? undefined}
        onChange={handleMarketChange}
      />
      <ConfigPanel config={config} onChange={setConfig} />

      {results.length > 0 && marketValues && (
        isExpired ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center space-y-2">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
            <p className="text-sm font-semibold text-destructive">Tabela expirada</p>
            <p className="text-xs text-muted-foreground">
              Gerada em{" "}
              {new Date(generatedAt!).toLocaleDateString("pt-BR")} às{" "}
              {new Date(generatedAt!).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              . Gere uma nova tabela com dados atualizados.
            </p>
          </div>
        ) : (
          <PriceTable
            results={results}
            contratoSoja={marketValues.contratoSoja}
            cbotSoja={marketValues.cbotSoja}
            dolarStonex={marketValues.dolarStonex}
            contratoMilho={marketValues.contratoMilho}
            b3Milho={marketValues.b3Milho}
            onCellClick={(r) => setSelectedResult(r)}
            generatedAt={generatedAt}
          />
        )
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
