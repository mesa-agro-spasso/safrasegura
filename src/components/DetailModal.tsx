import { useState, useMemo } from "react";
import { formatBRL } from "@/lib/formatters";
import { Info, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { PricingResult } from "@/lib/pricing-index";

interface DetailModalProps {
  open: boolean;
  onClose: () => void;
  result: PricingResult;
  onGenerateOrder: (adjusted: PricingResult) => void;
}

function parseInput(val: string): number | null {
  const raw = val.replace(",", ".");
  const n = parseFloat(raw);
  return isNaN(n) ? null : n;
}

export default function DetailModal({
  open,
  onClose,
  result,
  onGenerateOrder,
}: DetailModalProps) {
  const isSoja = result.commodity === "soybean";
  const [netOverride, setNetOverride] = useState("");
  const [storageOv, setStorageOv] = useState("");
  const [financialOv, setFinancialOv] = useState("");
  const [brokerageOv, setBrokerageOv] = useState("");
  const [deskOv, setDeskOv] = useState("");

  const adjusted = useMemo<PricingResult>(() => {
    const storage = parseInput(storageOv) ?? result.costs.storageBrl;
    const financial = parseInput(financialOv) ?? result.costs.financialBrl;
    const brokerage = parseInput(brokerageOv) ?? result.costs.brokerageBrl;
    const desk = parseInput(deskOv) ?? result.costs.deskCostBrl;
    const totalCosts = storage + financial + brokerage + desk;

    const costsDelta = totalCosts - result.costs.totalBrl;

    const netFromCosts = result.netPriceBrl - costsDelta;
    const netFinal = parseInput(netOverride) ?? netFromCosts;
    const netDelta = netFinal - result.netPriceBrl;
    const totalDelta = netDelta + costsDelta;

    return {
      ...result,
      netPriceBrl: netFinal,
      grossPriceBrl: result.grossPriceBrl + totalDelta,
      purchasedBasisBrl: result.purchasedBasisBrl + totalDelta,
      breakEvenBasisBrl: result.breakEvenBasisBrl + costsDelta,
      costs: {
        storageBrl: storage,
        financialBrl: financial,
        brokerageBrl: brokerage,
        deskCostBrl: desk,
        totalBrl: totalCosts,
      },
    };
  }, [netOverride, storageOv, financialOv, brokerageOv, deskOv, result]);

  const r = adjusted;

  const handleClose = () => {
    setNetOverride("");
    setStorageOv("");
    setFinancialOv("");
    setBrokerageOv("");
    setDeskOv("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4 text-primary" />
            {isSoja ? "Soja" : "Milho"} — {r.displayName}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">Vencimento: {r.paymentLabel}</p>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 items-center gap-2 text-sm">
            <Row label="Preço bruto" value={formatBRL(r.grossPriceBrl)} />
            <span className="text-muted-foreground">Preço líquido</span>
            <EditableCell
              placeholder={result.netPriceBrl}
              value={netOverride}
              onChange={setNetOverride}
              highlight
            />
            <Row label="Basis alvo" value={formatBRL(r.targetBasisBrl)} />
            <Row label="Basis comprado" value={formatBRL(r.purchasedBasisBrl)} />
            <Row label="Basis breakeven" value={formatBRL(r.breakEvenBasisBrl)} />
          </div>

          <Separator />

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Custos Detalhados
            </p>
            <div className="grid grid-cols-2 items-center gap-1 text-sm">
              <span className="text-muted-foreground">Armazenagem</span>
              <EditableCell placeholder={result.costs.storageBrl} value={storageOv} onChange={setStorageOv} />
              <span className="text-muted-foreground">Financeiro</span>
              <EditableCell placeholder={result.costs.financialBrl} value={financialOv} onChange={setFinancialOv} />
              <span className="text-muted-foreground">Corretagem</span>
              <EditableCell placeholder={result.costs.brokerageBrl} value={brokerageOv} onChange={setBrokerageOv} />
              <span className="text-muted-foreground">Desk</span>
              <EditableCell placeholder={result.costs.deskCostBrl} value={deskOv} onChange={setDeskOv} />
            </div>
            <div className="mt-2 flex justify-between rounded bg-muted px-3 py-2 text-sm font-semibold">
              <span>Total custos</span>
              <span className="font-mono text-negative">{formatBRL(r.costs.totalBrl)}</span>
            </div>
          </div>

          <Button onClick={() => onGenerateOrder(r)} className="w-full gap-2" size="lg">
            <FileText className="h-4 w-4" />
            Gerar Ordem
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <>
      <span className="text-muted-foreground">{label}</span>
      <span className={`text-right font-mono ${positive ? "text-positive" : ""}`}>{value}</span>
    </>
  );
}

function EditableCell({
  placeholder,
  value,
  onChange,
  highlight,
}: {
  placeholder: number;
  value: string;
  onChange: (v: string) => void;
  highlight?: boolean;
}) {
  return (
    <Input
      type="text"
      inputMode="decimal"
      placeholder={placeholder.toFixed(2).replace(".", ",")}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`h-7 text-right font-mono text-sm border-primary/30 focus-visible:ring-primary ${highlight ? "text-positive" : ""}`}
    />
  );
}
