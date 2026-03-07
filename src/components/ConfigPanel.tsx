import { useState } from "react";
import { Settings, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { SharedCosts, WarehouseConfig } from "@/lib/pricing-index";

export interface WarehouseUIState {
  id: string;
  displayName: string;
  basisSoja: number;
  basisMilho: number;
  brokMilho: number;
  shrinkMilho: number;
  basisSojaManual: boolean;
  basisMilhoManual: boolean;
}

export interface ConfigState {
  sharedCosts: SharedCosts;
  warehouseStates: WarehouseUIState[];
  paymentDatesSoja: string[];
  paymentDatesMilho: string[];
}

const DEFAULT_WAREHOUSES: WarehouseUIState[] = [
  { id: "confresa", displayName: "Confresa", basisSoja: -29.0, basisMilho: -25.0, brokMilho: 12.0, shrinkMilho: 0.003, basisSojaManual: false, basisMilhoManual: false },
  { id: "matupa", displayName: "Matupá", basisSoja: -30.0, basisMilho: -30.0, brokMilho: 12.0, shrinkMilho: 0.003, basisSojaManual: false, basisMilhoManual: false },
  { id: "alta_floresta", displayName: "Alta Floresta", basisSoja: -31.0, basisMilho: -31.5, brokMilho: 12.0, shrinkMilho: 0.003, basisSojaManual: false, basisMilhoManual: false },
];

const DEFAULT_SHARED_COSTS: SharedCosts = {
  interestRate: 1.4,
  interestRatePeriod: "am",
  storageCost: 3.5,
  storageCostType: "fixed",
  receptionCost: 0.0,
  brokeragePerContract: 15.0,
  deskCostPct: 0.003,
  shrinkageRateMonthly: 0.0,
};

export function getDefaultConfig(): ConfigState {
  return {
    sharedCosts: { ...DEFAULT_SHARED_COSTS },
    warehouseStates: DEFAULT_WAREHOUSES.map((w) => ({ ...w })),
    paymentDatesSoja: ["2026-03-30", "2026-04-30"],
    paymentDatesMilho: ["2026-08-30", "2026-09-30"],
  };
}

export function buildWarehousesFromState(states: WarehouseUIState[]): Record<string, WarehouseConfig> {
  const result: Record<string, WarehouseConfig> = {};
  for (const wh of states) {
    result[wh.id] = {
      displayName: wh.displayName,
      soybean: { basisConfig: { mode: "fixed", value: wh.basisSoja } },
      corn: {
        basisConfig: { mode: "fixed", value: wh.basisMilho },
        costOverrides: { brokeragePerContract: wh.brokMilho, shrinkageRateMonthly: wh.shrinkMilho },
      },
    };
  }
  return result;
}

interface ConfigPanelProps {
  config: ConfigState;
  onChange: (config: ConfigState) => void;
}

export default function ConfigPanel({ config, onChange }: ConfigPanelProps) {
  const [open, setOpen] = useState(false);
  const [newDateSoja, setNewDateSoja] = useState("");
  const [newDateMilho, setNewDateMilho] = useState("");

  const updateCost = <K extends keyof SharedCosts>(key: K, val: SharedCosts[K]) => {
    onChange({ ...config, sharedCosts: { ...config.sharedCosts, [key]: val } });
  };

  const updateWarehouse = (idx: number, patch: Partial<WarehouseUIState>) => {
    const updated = config.warehouseStates.map((w, i) => (i !== idx ? w : { ...w, ...patch }));
    const matupaIdx = updated.findIndex((w) => w.id === "matupa");
    const afIdx = updated.findIndex((w) => w.id === "alta_floresta");
    if (idx === matupaIdx && afIdx >= 0) {
      const af = updated[afIdx];
      if (!af.basisSojaManual && patch.basisSoja !== undefined) updated[afIdx] = { ...af, basisSoja: updated[matupaIdx].basisSoja - 1.0 };
      if (!af.basisMilhoManual && patch.basisMilho !== undefined) updated[afIdx] = { ...updated[afIdx], basisMilho: updated[matupaIdx].basisMilho - 1.5 };
    }
    if (idx === afIdx) {
      if (patch.basisSoja !== undefined) updated[idx] = { ...updated[idx], basisSojaManual: true };
      if (patch.basisMilho !== undefined) updated[idx] = { ...updated[idx], basisMilhoManual: true };
    }
    onChange({ ...config, warehouseStates: updated });
  };

  const addDateSoja = () => {
    if (newDateSoja && !config.paymentDatesSoja.includes(newDateSoja)) {
      onChange({ ...config, paymentDatesSoja: [...config.paymentDatesSoja, newDateSoja].sort() });
      setNewDateSoja("");
    }
  };
  const removeDateSoja = (d: string) => onChange({ ...config, paymentDatesSoja: config.paymentDatesSoja.filter((x) => x !== d) });
  const addDateMilho = () => {
    if (newDateMilho && !config.paymentDatesMilho.includes(newDateMilho)) {
      onChange({ ...config, paymentDatesMilho: [...config.paymentDatesMilho, newDateMilho].sort() });
      setNewDateMilho("");
    }
  };
  const removeDateMilho = (d: string) => onChange({ ...config, paymentDatesMilho: config.paymentDatesMilho.filter((x) => x !== d) });

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-xl border bg-card">
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center gap-2 px-5 py-3.5 text-left hover:bg-accent/50 transition-colors rounded-xl">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Configurações
            </span>
            <span className="ml-auto text-xs text-muted-foreground">{open ? "▲" : "▼"}</span>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="space-y-5 border-t px-5 py-5">
            {/* Custos Compartilhados */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Custos Compartilhados</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Taxa de juros (%)</Label>
                  <Input type="number" step="0.01" value={config.sharedCosts.interestRate} onChange={(e) => updateCost("interestRate", parseFloat(e.target.value) || 0)} className="h-9 font-mono text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Período juros</Label>
                  <Select value={config.sharedCosts.interestRatePeriod} onValueChange={(v) => updateCost("interestRatePeriod", v)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="am">am</SelectItem>
                      <SelectItem value="aa">aa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Armazenagem (R$/sc)</Label>
                  <Input type="number" step="0.01" value={config.sharedCosts.storageCost} onChange={(e) => updateCost("storageCost", parseFloat(e.target.value) || 0)} className="h-9 font-mono text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Tipo armazenagem</Label>
                  <Select value={config.sharedCosts.storageCostType} onValueChange={(v) => updateCost("storageCostType", v)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">fixed</SelectItem>
                      <SelectItem value="monthly">monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Recepção (R$/sc)</Label>
                  <Input type="number" step="0.01" value={config.sharedCosts.receptionCost} onChange={(e) => updateCost("receptionCost", parseFloat(e.target.value) || 0)} className="h-9 font-mono text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Corretagem CBOT (USD/ct)</Label>
                  <Input type="number" step="0.01" value={config.sharedCosts.brokeragePerContract} onChange={(e) => updateCost("brokeragePerContract", parseFloat(e.target.value) || 0)} className="h-9 font-mono text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Desk cost (%)</Label>
                  <Input type="number" step="0.001" value={config.sharedCosts.deskCostPct} onChange={(e) => updateCost("deskCostPct", parseFloat(e.target.value) || 0)} className="h-9 font-mono text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Quebra técnica (%/mês)</Label>
                  <Input type="number" step="0.001" value={config.sharedCosts.shrinkageRateMonthly} onChange={(e) => updateCost("shrinkageRateMonthly", parseFloat(e.target.value) || 0)} className="h-9 font-mono text-sm" />
                </div>
              </div>
            </div>

            {/* Praças */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Praças</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                {config.warehouseStates.map((wh, idx) => (
                  <div key={wh.id} className="rounded-lg border p-4 space-y-3 bg-muted/30">
                    <p className="text-sm font-semibold">{wh.displayName}</p>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-muted-foreground">Basis Soja (R$/sc)</Label>
                      <Input type="number" step="0.5" value={wh.basisSoja} onChange={(e) => updateWarehouse(idx, { basisSoja: parseFloat(e.target.value) || 0 })} className="h-8 font-mono text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-muted-foreground">Basis Milho (R$/sc)</Label>
                      <Input type="number" step="0.5" value={wh.basisMilho} onChange={(e) => updateWarehouse(idx, { basisMilho: parseFloat(e.target.value) || 0 })} className="h-8 font-mono text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-muted-foreground">Corretagem B3 (BRL/ct)</Label>
                      <Input type="number" step="0.5" value={wh.brokMilho} onChange={(e) => updateWarehouse(idx, { brokMilho: parseFloat(e.target.value) || 0 })} className="h-8 font-mono text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-muted-foreground">Quebra milho (%)</Label>
                      <Input type="number" step="0.001" value={wh.shrinkMilho} onChange={(e) => updateWarehouse(idx, { shrinkMilho: parseFloat(e.target.value) || 0 })} className="h-8 font-mono text-xs" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Datas de Pagamento */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Datas de Pagamento Extras</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Soja</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {config.paymentDatesSoja.map((d) => (
                      <span key={d} className="inline-flex items-center gap-1 rounded-full border bg-muted px-2.5 py-1 text-xs font-mono">
                        {d}
                        <button onClick={() => removeDateSoja(d)} className="text-muted-foreground hover:text-destructive"><X className="h-3 w-3" /></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input type="date" value={newDateSoja} onChange={(e) => setNewDateSoja(e.target.value)} className="h-8 text-xs flex-1" />
                    <Button size="sm" variant="outline" className="h-8 px-3" onClick={addDateSoja}><Plus className="h-3 w-3" /></Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Milho</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {config.paymentDatesMilho.map((d) => (
                      <span key={d} className="inline-flex items-center gap-1 rounded-full border bg-muted px-2.5 py-1 text-xs font-mono">
                        {d}
                        <button onClick={() => removeDateMilho(d)} className="text-muted-foreground hover:text-destructive"><X className="h-3 w-3" /></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input type="date" value={newDateMilho} onChange={(e) => setNewDateMilho(e.target.value)} className="h-8 text-xs flex-1" />
                    <Button size="sm" variant="outline" className="h-8 px-3" onClick={addDateMilho}><Plus className="h-3 w-3" /></Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
