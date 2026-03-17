import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Loader2 } from "lucide-react";
import { FuturesTable } from "./FuturesTable";
import {
  fetchMarketData,
  processMarketData,
  calculateNdfForwardRate,
  generateDefaultB3Tickers,
  type FuturesRow,
  type MarketData,
} from "@/lib/market-service";
import { formatDateISO } from "@/lib/pricing-utils";
import { useToast } from "@/hooks/use-toast";

interface MarketSectionProps {
  marketData: MarketData;
  onMarketDataChange: (data: MarketData) => void;
}

export function MarketSection({ marketData, onMarketDataChange }: MarketSectionProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleFetchMarket = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await fetchMarketData();
      const today = formatDateISO(new Date());
      // Default target for NDF: 30 days ahead
      const target = new Date();
      target.setDate(target.getDate() + 30);
      const targetStr = formatDateISO(target);

      const usdSpot = raw.usd_spot;
      const usdForward = usdSpot != null ? calculateNdfForwardRate(usdSpot, targetStr, today) : null;

      const processed = processMarketData(raw, usdForward);

      onMarketDataChange({
        usd_spot: usdSpot,
        usd_forward: usdForward,
        usd_spot_manual: false,
        usd_forward_manual: false,
        soybean: processed.soybean,
        corn_cbot: processed.corn_cbot,
        corn_b3: marketData.corn_b3.length > 0 ? marketData.corn_b3 : generateDefaultB3Tickers(),
        fetched_at: raw.fetched_at,
      });

      toast({ title: "Mercado atualizado", description: "Dados carregados com sucesso." });
    } catch (err: any) {
      toast({ title: "Erro ao carregar mercado", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [marketData.corn_b3, onMarketDataChange, toast]);

  const updateField = (field: keyof MarketData, value: any) => {
    onMarketDataChange({ ...marketData, [field]: value });
  };

  const handleUsdSpotChange = (val: string) => {
    const num = val === "" ? null : Number(val);
    const today = formatDateISO(new Date());
    const target = new Date();
    target.setDate(target.getDate() + 30);
    const targetStr = formatDateISO(target);
    const forward = num != null && !marketData.usd_forward_manual
      ? calculateNdfForwardRate(num, targetStr, today)
      : marketData.usd_forward;

    onMarketDataChange({
      ...marketData,
      usd_spot: num,
      usd_spot_manual: true,
      usd_forward: forward,
    });
  };

  const handleUsdForwardChange = (val: string) => {
    onMarketDataChange({
      ...marketData,
      usd_forward: val === "" ? null : Number(val),
      usd_forward_manual: true,
    });
  };

  const handleFuturesRowChange = (
    commodity: "soybean" | "corn_cbot" | "corn_b3",
    index: number,
    field: keyof FuturesRow,
    value: any,
  ) => {
    const rows = [...marketData[commodity]];
    rows[index] = { ...rows[index], [field]: value, ...(field === "price" ? { isManual: true } : {}) };

    // Recalculate BRL/sc if price changed (for CBOT tables)
    if (field === "price" && commodity !== "corn_b3" && marketData.usd_forward != null) {
      const price = rows[index].price;
      if (price != null) {
        const rate = marketData.usd_forward;
        if (commodity === "soybean") {
          rows[index].price_brl_sack = (price / 100) * 2.20462 * rate;
        } else {
          rows[index].price_brl_sack = (price / 100) * 2.20462 * rate;
        }
      }
    }

    onMarketDataChange({ ...marketData, [commodity]: rows });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Mercado</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleFetchMarket}
          disabled={loading}
          className="gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Atualizar
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* USD/BRL */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Label className="text-xs">USD/BRL Spot</Label>
              <Badge variant={marketData.usd_spot_manual ? "outline" : "secondary"} className="text-[10px]">
                {marketData.usd_spot_manual ? "Manual" : "Auto"}
              </Badge>
            </div>
            <Input
              type="number"
              step="0.0001"
              value={marketData.usd_spot ?? ""}
              onChange={(e) => handleUsdSpotChange(e.target.value)}
              className="h-8 font-mono text-sm"
              placeholder="5.4500"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Label className="text-xs">USD Forward (NDF)</Label>
              <Badge variant={marketData.usd_forward_manual ? "outline" : "secondary"} className="text-[10px]">
                {marketData.usd_forward_manual ? "Manual" : "Auto"}
              </Badge>
            </div>
            <Input
              type="number"
              step="0.0001"
              value={marketData.usd_forward ?? ""}
              onChange={(e) => handleUsdForwardChange(e.target.value)}
              className="h-8 font-mono text-sm"
              placeholder="5.4849"
            />
          </div>
        </div>

        {marketData.fetched_at && (
          <p className="text-[10px] text-muted-foreground">
            Atualizado: {new Date(marketData.fetched_at).toLocaleString("pt-BR")}
          </p>
        )}

        {/* Futures Tables */}
        <FuturesTable
          title="Soja CBOT"
          rows={marketData.soybean}
          onRowChange={(i, f, v) => handleFuturesRowChange("soybean", i, f, v)}
          showBrlColumn
          currencyLabel="USD ¢/bu"
        />

        <FuturesTable
          title="Milho CBOT"
          rows={marketData.corn_cbot}
          onRowChange={(i, f, v) => handleFuturesRowChange("corn_cbot", i, f, v)}
          showBrlColumn
          currencyLabel="USD ¢/bu"
        />

        <FuturesTable
          title="Milho B3"
          rows={marketData.corn_b3}
          onRowChange={(i, f, v) => handleFuturesRowChange("corn_b3", i, f, v)}
          currencyLabel="BRL/sc"
        />
      </CardContent>
    </Card>
  );
}
