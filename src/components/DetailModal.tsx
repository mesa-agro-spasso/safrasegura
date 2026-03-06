import { formatBRL } from "@/lib/formatters";
import { Info, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { PricingResult } from "@/lib/pricing-index";

interface DetailModalProps {
  open: boolean;
  onClose: () => void;
  result: PricingResult;
  onGenerateOrder: () => void;
}

export default function DetailModal({
  open,
  onClose,
  result,
  onGenerateOrder,
}: DetailModalProps) {
  const isSoja = result.commodity === "soybean";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4 text-primary" />
            {isSoja ? "Soja" : "Milho"} — {result.displayName}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">Vencimento: {result.paymentLabel}</p>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Row label="Preço bruto" value={formatBRL(result.grossPriceBrl)} />
            <Row label="Preço líquido" value={formatBRL(result.netPriceBrl)} positive />
            <Row label="Basis alvo" value={formatBRL(result.targetBasisBrl)} />
            <Row label="Basis comprado" value={formatBRL(result.purchasedBasisBrl)} />
            <Row label="Basis breakeven" value={formatBRL(result.breakEvenBasisBrl)} />
          </div>

          <Separator />

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Custos Detalhados
            </p>
            <div className="grid grid-cols-2 gap-1 text-sm">
              <Row label="Armazenagem" value={formatBRL(result.costs.storageBrl)} />
              <Row label="Financeiro" value={formatBRL(result.costs.financialBrl)} />
              <Row label="Corretagem" value={formatBRL(result.costs.brokerageBrl)} />
              <Row label="Desk" value={formatBRL(result.costs.deskCostBrl)} />
            </div>
            <div className="mt-2 flex justify-between rounded bg-muted px-3 py-2 text-sm font-semibold">
              <span>Total custos</span>
              <span className="font-mono text-negative">{formatBRL(result.costs.totalBrl)}</span>
            </div>
          </div>

          <Button onClick={onGenerateOrder} className="w-full gap-2" size="lg">
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
