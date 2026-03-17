import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { GlobalParams, SharedParams, CommodityParams } from "@/lib/combination-builder";

interface GlobalParamsSectionProps {
  params: GlobalParams;
  onChange: (params: GlobalParams) => void;
}

function ParamInput({
  label,
  value,
  onChange,
  step = "0.01",
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: string;
  suffix?: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-1">
        <Input
          type="number"
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-7 text-xs font-mono"
        />
        {suffix && <span className="text-[10px] text-muted-foreground whitespace-nowrap">{suffix}</span>}
      </div>
    </div>
  );
}

function CollapsibleGroup({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium bg-muted/50 hover:bg-muted transition-colors">
        {title}
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3 pb-1 px-1">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function GlobalParamsSection({ params, onChange }: GlobalParamsSectionProps) {
  const updateShared = (field: keyof SharedParams, value: any) => {
    onChange({ ...params, shared: { ...params.shared, [field]: value } });
  };

  const updateCommodity = (commodity: "soybean" | "corn", field: keyof CommodityParams, value: any) => {
    onChange({ ...params, [commodity]: { ...params[commodity], [field]: value } });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Parâmetros Globais</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Shared Parameters */}
        <CollapsibleGroup title="Compartilhados" defaultOpen>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <ParamInput
              label="Taxa de Juros"
              value={params.shared.interest_rate}
              onChange={(v) => updateShared("interest_rate", v)}
              step="0.1"
              suffix="%"
            />
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Período Juros</Label>
              <Select
                value={params.shared.interest_rate_period}
                onValueChange={(v) => updateShared("interest_rate_period", v)}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <ParamInput
              label="Armazenagem"
              value={params.shared.storage_cost}
              onChange={(v) => updateShared("storage_cost", v)}
              suffix="R$/sc"
            />
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Tipo Armazenagem</Label>
              <Select
                value={params.shared.storage_cost_type}
                onValueChange={(v) => updateShared("storage_cost_type", v)}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixo</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <ParamInput
              label="Custo Recepção"
              value={params.shared.reception_cost}
              onChange={(v) => updateShared("reception_cost", v)}
              suffix="R$/sc"
            />
            <ParamInput
              label="Custo Mesa"
              value={params.shared.desk_cost_pct}
              onChange={(v) => updateShared("desk_cost_pct", v)}
              step="0.001"
              suffix="%"
            />
          </div>
        </CollapsibleGroup>

        {/* Soybean Parameters */}
        <CollapsibleGroup title="Soja">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <ParamInput
              label="Corretagem"
              value={params.soybean.brokerage_per_contract}
              onChange={(v) => updateCommodity("soybean", "brokerage_per_contract", v)}
              suffix="USD/ct"
            />
            <ParamInput
              label="Quebra Mensal"
              value={params.soybean.shrinkage_rate_monthly}
              onChange={(v) => updateCommodity("soybean", "shrinkage_rate_monthly", v)}
              step="0.001"
            />
            <ParamInput
              label="Arredondamento"
              value={params.soybean.rounding_increment}
              onChange={(v) => updateCommodity("soybean", "rounding_increment", v)}
              step="0.25"
              suffix="R$"
            />
            <ParamInput
              label="Taxa Livre Risco"
              value={params.soybean.risk_free_rate}
              onChange={(v) => updateCommodity("soybean", "risk_free_rate", v)}
              step="0.001"
            />
            <ParamInput
              label="Sigma (Vol)"
              value={params.soybean.sigma}
              onChange={(v) => updateCommodity("soybean", "sigma", v)}
              step="0.01"
            />
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Tipo Opção</Label>
              <Select
                value={params.soybean.option_type}
                onValueChange={(v) => updateCommodity("soybean", "option_type", v)}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="put">Put</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CollapsibleGroup>

        {/* Corn Parameters */}
        <CollapsibleGroup title="Milho">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <ParamInput
              label="Corretagem"
              value={params.corn.brokerage_per_contract}
              onChange={(v) => updateCommodity("corn", "brokerage_per_contract", v)}
              suffix="USD/ct"
            />
            <ParamInput
              label="Quebra Mensal"
              value={params.corn.shrinkage_rate_monthly}
              onChange={(v) => updateCommodity("corn", "shrinkage_rate_monthly", v)}
              step="0.001"
            />
            <ParamInput
              label="Arredondamento"
              value={params.corn.rounding_increment}
              onChange={(v) => updateCommodity("corn", "rounding_increment", v)}
              step="0.25"
              suffix="R$"
            />
            <ParamInput
              label="Taxa Livre Risco"
              value={params.corn.risk_free_rate}
              onChange={(v) => updateCommodity("corn", "risk_free_rate", v)}
              step="0.001"
            />
            <ParamInput
              label="Sigma (Vol)"
              value={params.corn.sigma}
              onChange={(v) => updateCommodity("corn", "sigma", v)}
              step="0.01"
            />
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Tipo Opção</Label>
              <Select
                value={params.corn.option_type}
                onValueChange={(v) => updateCommodity("corn", "option_type", v)}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="put">Put</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CollapsibleGroup>
      </CardContent>
    </Card>
  );
}
