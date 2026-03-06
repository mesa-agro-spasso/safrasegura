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

interface DetailModalProps {
  open: boolean;
  onClose: () => void;
  commodity: "soja" | "milho";
  city: string;
  column: string;
  value: number;
  onGenerateOrder: () => void;
}

export default function DetailModal({
  open,
  onClose,
  commodity,
  city,
  column,
  value,
  onGenerateOrder,
}: DetailModalProps) {
  // Placeholder detail values
  const details = {
    precoBruto: value + 3.50,
    precoLiquido: value,
    basisAlvo: -1.20,
    basisComprado: -0.85,
    basisBreakeven: -1.05,
    custos: {
      armazenagem: 1.20,
      financeiro: 0.80,
      corretagem: 0.50,
      desk: 1.00,
      total: 3.50,
    },
  };

  const isSoja = commodity === "soja";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4 text-primary" />
            {isSoja ? "Soja" : "Milho"} — {city}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">Vencimento: {column}</p>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Row label="Preço bruto" value={formatBRL(details.precoBruto)} />
            <Row label="Preço líquido" value={formatBRL(details.precoLiquido)} positive />
            <Row label="Basis alvo" value={details.basisAlvo.toFixed(2)} />
            <Row label="Basis comprado" value={details.basisComprado.toFixed(2)} />
            <Row label="Basis breakeven" value={details.basisBreakeven.toFixed(2)} />
          </div>

          <Separator />

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Custos Detalhados
            </p>
            <div className="grid grid-cols-2 gap-1 text-sm">
              <Row label="Armazenagem" value={formatBRL(details.custos.armazenagem)} />
              <Row label="Financeiro" value={formatBRL(details.custos.financeiro)} />
              <Row label="Corretagem" value={formatBRL(details.custos.corretagem)} />
              <Row label="Desk" value={formatBRL(details.custos.desk)} />
            </div>
            <div className="mt-2 flex justify-between rounded bg-muted px-3 py-2 text-sm font-semibold">
              <span>Total custos</span>
              <span className="font-mono text-negative">{formatBRL(details.custos.total)}</span>
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
