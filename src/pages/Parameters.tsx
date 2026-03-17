import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MarketSection } from "@/components/daily-table/MarketSection";
import { GlobalParamsSection } from "@/components/daily-table/GlobalParamsSection";
import { CombinationsGrid, type CombinationGridRow } from "@/components/daily-table/CombinationsGrid";
import { Button } from "@/components/ui/button";
import { Save, Loader2, TableProperties } from "lucide-react";
import {
  type GlobalParams,
  type CombinationPayload,
  buildCombinationPayloads,
  DEFAULT_SHARED,
  DEFAULT_SOYBEAN,
  DEFAULT_CORN,
} from "@/lib/combination-builder";
import { generateDefaultB3Tickers, type MarketData } from "@/lib/market-service";
import { loadSavedParams, saveParams, saveResults } from "@/lib/params-storage";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

export default function Parameters() {
  const [marketData, setMarketData] = useState<MarketData>(INITIAL_MARKET);
  const [globalParams, setGlobalParams] = useState<GlobalParams>(INITIAL_GLOBALS);
  const [combinations, setCombinations] = useState<CombinationGridRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Load saved params on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await loadSavedParams();
        if (saved) {
          if (saved.market_data && Object.keys(saved.market_data).length > 0) {
            setMarketData(saved.market_data);
          }
          if (saved.global_params && Object.keys(saved.global_params).length > 0) {
            setGlobalParams(saved.global_params);
          }
          if (saved.combinations && saved.combinations.length > 0) {
            setCombinations(saved.combinations);
          }
        }
      } catch (err) {
        console.error("Failed to load saved params:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleMarketChange = useCallback((data: MarketData) => {
    setMarketData(data);
    setIsDirty(true);
  }, []);

  const handleGlobalsChange = useCallback((params: GlobalParams) => {
    setGlobalParams(params);
    setIsDirty(true);
  }, []);

  const handleCombinationsChange = useCallback((rows: CombinationGridRow[]) => {
    setCombinations(rows);
    setIsDirty(true);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveParams({ market_data: marketData, global_params: globalParams, combinations });
      setIsDirty(false);
      toast({ title: "Salvo!", description: "Parâmetros salvos com sucesso." });
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async () => {
    if (combinations.length === 0) {
      toast({ title: "Sem combinações", description: "Adicione ao menos uma combinação antes de gerar.", variant: "destructive" });
      return;
    }

    setGenerating(true);
    try {
      // Save params first if dirty
      if (isDirty) {
        await saveParams({ market_data: marketData, global_params: globalParams, combinations });
        setIsDirty(false);
      }

      // Build payloads using combination-builder
      const payloads = buildCombinationPayloads(globalParams, combinations.map(c => ({
        ...c,
        exchange_rate: c.commodity === "soybean" ? (c.exchange_rate ?? marketData.usd_forward ?? undefined) : undefined,
      })));

      // Call edge function
      const { data, error } = await supabase.functions.invoke("run-custom-pricing", {
        body: { combinations: payloads },
      });

      if (error) throw new Error(error.message || "Erro ao chamar função de precificação");
      if (data?.error) throw new Error(data.error);

      const results = data?.results ?? [];

      // Save results to DB
      await saveResults(results);

      toast({ title: "Tabela gerada!", description: `${results.length} combinação(ões) processada(s).` });
      navigate("/daily-table");
    } catch (err: any) {
      console.error("Generate error:", err);
      toast({ title: "Erro ao gerar tabela", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Carregando parâmetros salvos…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Parâmetros</h1>
          <p className="text-sm text-muted-foreground">
            Configuração de mercado, parâmetros globais e combinações para precificação diária.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar
          </Button>
          <Button onClick={handleGenerate} disabled={generating} className="gap-2">
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <TableProperties className="h-4 w-4" />}
            {generating ? "Gerando…" : "Gerar Tabela"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <MarketSection marketData={marketData} onMarketDataChange={handleMarketChange} />
        <GlobalParamsSection params={globalParams} onChange={handleGlobalsChange} />
      </div>

      <CombinationsGrid
        combinations={combinations}
        onChange={handleCombinationsChange}
        marketData={marketData}
        globalParams={globalParams}
      />
    </div>
  );
}
