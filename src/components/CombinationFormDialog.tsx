import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface CombinationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: Record<string, any>;
  onSave: (values: Record<string, any>) => void;
}

const SOYBEAN_DEFAULTS = {
  interest_rate: 1.4,
  interest_rate_period: "monthly",
  storage_cost: 3.5,
  storage_cost_type: "fixed",
  reception_cost: 0,
  brokerage_per_contract: 15.0,
  desk_cost_pct: 0.003,
  shrinkage_rate_monthly: 0,
  risk_free_rate: 0.149,
  sigma: 0.35,
  option_type: "call",
  additional_discount_brl: 0,
  rounding_increment: 0.5,
};

const CORN_DEFAULTS = {
  ...SOYBEAN_DEFAULTS,
  brokerage_per_contract: 12.0,
  shrinkage_rate_monthly: 0.003,
  rounding_increment: 0.25,
};

export default function CombinationFormDialog({
  open,
  onOpenChange,
  initialValues,
  onSave,
}: CombinationFormDialogProps) {
  const isEditing = !!(initialValues?.id);

  const [form, setForm] = useState<Record<string, any>>({});

  useEffect(() => {
    if (open) {
      if (initialValues?.id) {
        // Editing
        setForm({ ...initialValues });
      } else if (initialValues) {
        // Duplicating (no id)
        const { id, created_at, updated_at, ...rest } = initialValues;
        setForm({ ...rest });
      } else {
        // New
        setForm({
          is_active: true,
          commodity: "soybean",
          warehouse_id: "",
          display_name: "",
          payment_date: "",
          grain_reception_date: "",
          sale_date: "",
          trade_date_override: "",
          target_basis: 0,
          ticker: "",
          exp_date: "",
          futures_price: 0,
          exchange_rate: "",
          ...SOYBEAN_DEFAULTS,
        });
      }
    }
  }, [open, initialValues]);

  const set = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleCommodityChange = (val: string) => {
    const defaults = val === "soybean" ? SOYBEAN_DEFAULTS : CORN_DEFAULTS;
    setForm((prev) => ({
      ...prev,
      commodity: val,
      ...defaults,
      // Keep user-entered values for common fields
      warehouse_id: prev.warehouse_id,
      display_name: prev.display_name,
      payment_date: prev.payment_date,
      sale_date: prev.sale_date,
      ticker: prev.ticker,
      exp_date: prev.exp_date,
      futures_price: prev.futures_price,
      target_basis: prev.target_basis,
      exchange_rate: val === "soybean" ? prev.exchange_rate : "",
    }));
  };

  const handleSubmit = () => {
    const cleaned: Record<string, any> = { ...form };
    // Remove empty optional dates
    if (!cleaned.grain_reception_date) cleaned.grain_reception_date = null;
    if (!cleaned.trade_date_override) cleaned.trade_date_override = null;
    if (!cleaned.exchange_rate && cleaned.exchange_rate !== 0) cleaned.exchange_rate = null;
    // Remove id/timestamps for insert
    if (!isEditing) {
      delete cleaned.id;
      delete cleaned.created_at;
      delete cleaned.updated_at;
    }
    // Coerce numerics
    for (const key of [
      "target_basis", "futures_price", "exchange_rate", "interest_rate",
      "storage_cost", "reception_cost", "brokerage_per_contract", "desk_cost_pct",
      "shrinkage_rate_monthly", "risk_free_rate", "sigma", "additional_discount_brl",
      "rounding_increment",
    ]) {
      if (cleaned[key] !== null && cleaned[key] !== undefined && cleaned[key] !== "") {
        cleaned[key] = Number(cleaned[key]);
      }
    }
    onSave(cleaned);
  };

  const isValid =
    form.commodity &&
    form.warehouse_id &&
    form.display_name &&
    form.payment_date &&
    form.sale_date &&
    form.ticker &&
    form.exp_date &&
    form.futures_price &&
    (form.commodity !== "soybean" || form.exchange_rate);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Combinação" : "Nova Combinação"}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[65vh] pr-4">
          <div className="space-y-6 py-2">
            {/* ── Section: Identificação ── */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Identificação
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Commodity</Label>
                  <Select value={form.commodity || "soybean"} onValueChange={handleCommodityChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="soybean">Soja</SelectItem>
                      <SelectItem value="corn">Milho</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">ID da Praça</Label>
                  <Input value={form.warehouse_id || ""} onChange={(e) => set("warehouse_id", e.target.value)} placeholder="confresa" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs">Nome de Exibição</Label>
                  <Input value={form.display_name || ""} onChange={(e) => set("display_name", e.target.value)} placeholder="Confresa" />
                </div>
              </div>
            </div>

            <Separator />

            {/* ── Section: Datas ── */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Datas
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Data Pagamento *</Label>
                  <Input type="date" value={form.payment_date || ""} onChange={(e) => set("payment_date", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Data Venda *</Label>
                  <Input type="date" value={form.sale_date || ""} onChange={(e) => set("sale_date", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Recebimento Grãos</Label>
                  <Input type="date" value={form.grain_reception_date || ""} onChange={(e) => set("grain_reception_date", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Trade Date Override</Label>
                  <Input type="date" value={form.trade_date_override || ""} onChange={(e) => set("trade_date_override", e.target.value)} />
                </div>
              </div>
            </div>

            <Separator />

            {/* ── Section: Mercado ── */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Mercado
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Contrato (Ticker) *</Label>
                  <Input value={form.ticker || ""} onChange={(e) => set("ticker", e.target.value)} placeholder="ZSQ26" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Data Expiração *</Label>
                  <Input type="date" value={form.exp_date || ""} onChange={(e) => set("exp_date", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    Preço Futuro * {form.commodity === "soybean" ? "(USD/bu)" : "(BRL/sc)"}
                  </Label>
                  <Input type="number" step="0.0001" value={form.futures_price || ""} onChange={(e) => set("futures_price", e.target.value)} />
                </div>
                {form.commodity === "soybean" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Câmbio (BRL/USD) *</Label>
                    <Input type="number" step="0.0001" value={form.exchange_rate || ""} onChange={(e) => set("exchange_rate", e.target.value)} />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-xs">Basis Alvo (BRL/sc)</Label>
                  <Input type="number" step="0.01" value={form.target_basis ?? ""} onChange={(e) => set("target_basis", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Desconto Adicional (BRL/sc)</Label>
                  <Input type="number" step="0.01" value={form.additional_discount_brl ?? ""} onChange={(e) => set("additional_discount_brl", e.target.value)} />
                </div>
              </div>
            </div>

            <Separator />

            {/* ── Section: Custos ── */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Custos & Parâmetros
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Taxa de Juros (%)</Label>
                  <Input type="number" step="0.01" value={form.interest_rate ?? ""} onChange={(e) => set("interest_rate", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Período Juros</Label>
                  <Select value={form.interest_rate_period || "monthly"} onValueChange={(v) => set("interest_rate_period", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="yearly">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Armazenagem (BRL/sc)</Label>
                  <Input type="number" step="0.01" value={form.storage_cost ?? ""} onChange={(e) => set("storage_cost", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tipo Armazenagem</Label>
                  <Select value={form.storage_cost_type || "fixed"} onValueChange={(v) => set("storage_cost_type", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixo</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Recepção (BRL/sc)</Label>
                  <Input type="number" step="0.01" value={form.reception_cost ?? ""} onChange={(e) => set("reception_cost", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Corretagem/contrato</Label>
                  <Input type="number" step="0.01" value={form.brokerage_per_contract ?? ""} onChange={(e) => set("brokerage_per_contract", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Desk Cost (%)</Label>
                  <Input type="number" step="0.001" value={form.desk_cost_pct ?? ""} onChange={(e) => set("desk_cost_pct", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Quebra Técnica (%/mês)</Label>
                  <Input type="number" step="0.001" value={form.shrinkage_rate_monthly ?? ""} onChange={(e) => set("shrinkage_rate_monthly", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Arredondamento</Label>
                  <Input type="number" step="0.01" value={form.rounding_increment ?? ""} onChange={(e) => set("rounding_increment", e.target.value)} />
                </div>
              </div>
            </div>

            <Separator />

            {/* ── Section: Seguro ── */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Parâmetros de Seguro (Black-76)
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Taxa Risk-Free</Label>
                  <Input type="number" step="0.001" value={form.risk_free_rate ?? ""} onChange={(e) => set("risk_free_rate", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Sigma (IV)</Label>
                  <Input type="number" step="0.01" value={form.sigma ?? ""} onChange={(e) => set("sigma", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tipo Opção</Label>
                  <Select value={form.option_type || "call"} onValueChange={(v) => set("option_type", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="call">Call</SelectItem>
                      <SelectItem value="put">Put</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!isValid}>
            {isEditing ? "Salvar" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
