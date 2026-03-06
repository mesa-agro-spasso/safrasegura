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

export default function DetailModal({
  open,
  onClose,
  result,
  onGenerateOrder,
}: DetailModalProps) {
  const isSoja = result.commodity === "soybean";
  const [netOverride, setNetOverride] = useState<string>("");

  const adjusted = useMemo(() => {
    const raw = netOverride.replace(",", ".");
    const parsed = parseFloat(raw);
    if (!netOverride || isNaN(parsed)) return null;
    const delta = parsed - result.netPriceBrl;
    if (Math.abs(delta) < 0.001) return null;
    return {
      ...result,
      netPriceBrl: parsed,
      grossPriceBrl: result.grossPriceBrl + delta,
      purchasedBasisBrl: result.purchasedBasisBrl + delta,
    };
  }, [netOverride, result]);

  const r = adjusted ?? result;

  const handleClose = () => {
    setNetOverride("");
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
            <Input
              type="text"
              inputMode="decimal"
              placeholder={result.netPriceBrl.toFixed(2).replace(".", ",")}
              value={netOverride}
              onChange={(e) => setNetOverride(e.target.value)}
              className="h-7 text-right font-mono text-sm text-positive border-primary/30 focus-visible:ring-primary"
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
            <div className="grid grid-cols-2 gap-1 text-sm">
              <Row label="Armazenagem" value={formatBRL(r.costs.storageBrl)} />
              <Row label="Financeiro" value={formatBRL(r.costs.financialBrl)} />
              <Row label="Corretagem" value={formatBRL(r.costs.brokerageBrl)} />
              <Row label="Desk" value={formatBRL(r.costs.deskCostBrl)} />
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
