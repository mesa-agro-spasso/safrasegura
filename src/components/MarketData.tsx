import { useState, useEffect } from "react";
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
import {
  calculateStonexForwardDolRate,
  formatDateISO,
} from "@/lib/pricing-index";

const SOJA_CONTRACTS = ["ZSN26", "ZSQ26", "ZSU26", "ZSX26", "ZSF27", "ZSH27"];
const MILHO_CONTRACTS = ["CCMU26", "CCMX26", "CCMF27", "CCMH27", "CCMK27", "CCMN27"];

export interface MarketDataValues {
  cbotSoja: number;
  contratoSoja: string;
  dataVendaSoja: string;
  dolarSpot: number;
  dolarStonex: number;
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
    dolarStonex: 0,
    b3Milho: 75.00,
    contratoMilho: "CCMU26",
    dataVendaMilho: "2026-09-30",
  });

  useEffect(() => {
    const today = formatDateISO(new Date());
    const dolarStonex = calculateStonexForwardDolRate(values.dolarSpot, values.dataVendaSoja, today);
    setValues((prev) => ({ ...prev, dolarStonex }));
  }, [values.dolarSpot, values.dataVendaSoja]);

  const update = (field: keyof MarketDataValues, val: string | number) => {
    setValues((prev) => ({ ...prev, [field]: val }));
  };

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">
          Dados de Mercado
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">CBOT Soja (USD/bu)</Label>
          <Input type="number" step="0.01" value={values.cbotSoja} onChange={(e) => update("cbotSoja", parseFloat(e.target.value) || 0)} className="h-10 font-mono text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Contrato Soja</Label>
          <Select value={values.contratoSoja} onValueChange={(v) => update("contratoSoja", v)}>
            <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SOJA_CONTRACTS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Data Venda Soja</Label>
          <Input type="date" value={values.dataVendaSoja} onChange={(e) => update("dataVendaSoja", e.target.value)} className="h-10 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Dólar Spot (BRL)</Label>
          <Input type="number" step="0.01" value={values.dolarSpot} onChange={(e) => update("dolarSpot", parseFloat(e.target.value) || 0)} className="h-10 font-mono text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Dólar StoneX</Label>
          <Input type="text" value={values.dolarStonex.toFixed(4)} readOnly className="h-10 font-mono text-sm bg-muted cursor-not-allowed" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">B3 Milho (BRL/sc)</Label>
          <Input type="number" step="0.01" value={values.b3Milho} onChange={(e) => update("b3Milho", parseFloat(e.target.value) || 0)} className="h-10 font-mono text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Contrato Milho</Label>
          <Select value={values.contratoMilho} onValueChange={(v) => update("contratoMilho", v)}>
            <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MILHO_CONTRACTS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Data Venda Milho</Label>
          <Input type="date" value={values.dataVendaMilho} onChange={(e) => update("dataVendaMilho", e.target.value)} className="h-10 text-sm" />
        </div>
      </div>

      <Button onClick={() => onGenerate(values)} className="mt-5 w-full gap-2" size="lg">
        <RefreshCw className="h-4 w-4" />
        Gerar Tabela
      </Button>
    </div>
  );
}
