import { useState } from "react";
import { TrendingUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SOJA_CONTRACTS = ["ZSN26", "ZSQ26", "ZSU26", "ZSX26", "ZSF27", "ZSH27"];
const MILHO_CONTRACTS = ["CCMU26", "CCMX26", "CCMF27", "CCMH27", "CCMK27", "CCMN27"];

interface MarketDataValues {
  cbotSoja: number;
  contratoSoja: string;
  dataVendaSoja: string;
  dolarSpot: number;
  dolarStonex: string;
  b3Milho: number;
  contratoMilho: string;
  dataVendaMilho: string;
}

interface MarketDataProps {
  onGenerate: (values: MarketDataValues) => void;
}

export default function MarketData({ onGenerate }: MarketDataProps) {
  const [values, setValues] = useState<MarketDataValues>({
    cbotSoja: 10.50,
    contratoSoja: "ZSN26",
    dataVendaSoja: "2026-06-30",
    dolarSpot: 5.80,
    dolarStonex: "5.9143",
    b3Milho: 75.00,
    contratoMilho: "CCMU26",
    dataVendaMilho: "2026-09-30",
  });

  const update = (field: keyof MarketDataValues, val: string | number) => {
    setValues((prev) => ({ ...prev, [field]: val }));
  };

  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">
          Market Data
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* CBOT Soja */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">CBOT Soja (USD/bu)</Label>
          <Input
            type="number"
            step="0.01"
            value={values.cbotSoja}
            onChange={(e) => update("cbotSoja", parseFloat(e.target.value) || 0)}
            className="h-9 font-mono text-sm"
          />
        </div>

        {/* Contrato Soja */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Contrato Soja</Label>
          <Select value={values.contratoSoja} onValueChange={(v) => update("contratoSoja", v)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SOJA_CONTRACTS.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Data Venda Soja */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Data Venda Soja</Label>
          <Input
            type="date"
            value={values.dataVendaSoja}
            onChange={(e) => update("dataVendaSoja", e.target.value)}
            className="h-9 text-sm"
          />
        </div>

        {/* Dólar Spot */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Dólar Spot (BRL)</Label>
          <Input
            type="number"
            step="0.01"
            value={values.dolarSpot}
            onChange={(e) => update("dolarSpot", parseFloat(e.target.value) || 0)}
            className="h-9 font-mono text-sm"
          />
        </div>

        {/* Dólar StoneX (readonly) */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Dólar StoneX</Label>
          <Input
            type="text"
            value={values.dolarStonex}
            readOnly
            className="h-9 font-mono text-sm bg-muted cursor-not-allowed"
          />
        </div>

        {/* B3 Milho */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">B3 Milho (BRL/sc)</Label>
          <Input
            type="number"
            step="0.01"
            value={values.b3Milho}
            onChange={(e) => update("b3Milho", parseFloat(e.target.value) || 0)}
            className="h-9 font-mono text-sm"
          />
        </div>

        {/* Contrato Milho */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Contrato Milho</Label>
          <Select value={values.contratoMilho} onValueChange={(v) => update("contratoMilho", v)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MILHO_CONTRACTS.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Data Venda Milho */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Data Venda Milho</Label>
          <Input
            type="date"
            value={values.dataVendaMilho}
            onChange={(e) => update("dataVendaMilho", e.target.value)}
            className="h-9 text-sm"
          />
        </div>
      </div>

      <Button
        onClick={() => onGenerate(values)}
        className="mt-4 w-full gap-2"
        size="lg"
      >
        <RefreshCw className="h-4 w-4" />
        Gerar Tabela
      </Button>
    </section>
  );
}
