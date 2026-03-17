import { useEffect } from "react";
import { usePersistentState } from "@/hooks/use-persistent-state";
import { MarketSection } from "@/components/daily-table/MarketSection";
import { GlobalParamsSection } from "@/components/daily-table/GlobalParamsSection";
import {
  type GlobalParams,
  DEFAULT_SHARED,
  DEFAULT_SOYBEAN,
  DEFAULT_CORN,
} from "@/lib/combination-builder";
import { generateDefaultB3Tickers, type MarketData } from "@/lib/market-service";

const INITIAL_MARKET: MarketData = {
  usd_spot: null,
  usd_forward: null,
  usd_spot_manual: false,
  usd_forward_manual: false,
  soybean: [],
  corn_cbot: [],
  corn_b3: generateDefaultB3Tickers(),
  fetched_at: null,
};

const INITIAL_GLOBALS: GlobalParams = {
  shared: { ...DEFAULT_SHARED },
  soybean: { ...DEFAULT_SOYBEAN },
  corn: { ...DEFAULT_CORN },
};

export default function DailyTable() {
  const [marketData, setMarketData] = usePersistentState<MarketData>("daily-table-market", INITIAL_MARKET);
  const [globalParams, setGlobalParams] = usePersistentState<GlobalParams>("daily-table-globals", INITIAL_GLOBALS);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-foreground">Daily Table</h1>
        <p className="text-sm text-muted-foreground">
          Tabela diária de precificação — Mercado, Parâmetros, Combinações e Resultado.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <MarketSection marketData={marketData} onMarketDataChange={setMarketData} />
        <GlobalParamsSection params={globalParams} onChange={setGlobalParams} />
      </div>

      {/* Placeholder: Combinações e Resultado (Etapa 2) */}
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
        <p className="font-medium">Combinações & Resultado</p>
        <p className="text-xs mt-1">Seções 3 e 4 serão implementadas na próxima etapa.</p>
      </div>
    </div>
  );
}
