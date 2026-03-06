import { useState } from "react";
import { Copy, Check, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { buildHedgeOrder, type PricingResult } from "@/lib/pricing-index";
import { saveOrder, getNextSequentialNumber } from "@/lib/orderStorage";
import type { OrderRecord } from "@/lib/orderRecord";
import { toast } from "@/hooks/use-toast";

interface OrderGeneratorProps {
  open: boolean;
  onClose: () => void;
  result: PricingResult;
  onOrderSaved?: () => void;
}

export default function OrderGenerator({
  open,
  onClose,
  result,
  onOrderSaved,
}: OrderGeneratorProps) {
  const isSoja = result.commodity === "soybean";
  const [volume, setVolume] = useState("");
  const [contaBroker, setContaBroker] = useState("17130");
  const [generated, setGenerated] = useState(false);
  const [orderText, setOrderText] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [copiedOrder, setCopiedOrder] = useState(false);
  const [copiedConfirm, setCopiedConfirm] = useState(false);

  const handleCopy = async (text: string, type: "order" | "confirm") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "order") {
        setCopiedOrder(true);
        setTimeout(() => setCopiedOrder(false), 2000);
      } else {
        setCopiedConfirm(true);
        setTimeout(() => setCopiedConfirm(false), 2000);
      }
    } catch {}
  };

  const handleGenerate = () => {
    const volumeSacks = parseFloat(volume);
    if (!volumeSacks || volumeSacks <= 0) return;

    const order = buildHedgeOrder({
      engineResult: result.engineResult,
      volumeSacks,
      commodity: result.commodity as "soybean" | "corn",
      exchange: isSoja ? "cbot" : "b3",
      brokeragePerContract: isSoja ? 15.0 : 12.0,
      broker: "stonex",
      brokerAccount: contaBroker,
      paymentDate: result.paymentDate,
      saleDate: result.saleDate,
      ndfTableVersionId: new Date().toISOString(),
      ndfMaturity: isSoja ? result.saleDate : undefined,
    });

    // Build and save OrderRecord
    const seqNum = getNextSequentialNumber();
    const engineResult = result.engineResult;
    const record: OrderRecord = {
      id: crypto.randomUUID(),
      sequentialNumber: seqNum,
      operationId: null,
      commodity: result.commodity as "soybean" | "corn",
      exchange: isSoja ? "cbot" : "b3",
      warehouseId: result.warehouseId,
      warehouseDisplayName: result.displayName,
      volumeSacks: order.volumeSacks,
      volumeTons: order.volumeTons,
      volumeBushels: order.volumeBushels,
      originationPriceNetBrl: result.netPriceBrl,
      originationPriceGrossBrl: result.grossPriceBrl,
      futuresPrice: order.futuresPrice,
      futuresPriceCurrency: order.futuresPriceCurrency as "USD" | "BRL",
      exchangeRate: order.exchangeRate,
      targetBasisBrl: result.targetBasisBrl,
      purchasedBasisBrl: result.purchasedBasisBrl,
      breakEvenBasisBrl: result.breakEvenBasisBrl,
      costs: { ...result.costs },
      ticker: "ticker" in engineResult ? (engineResult as any).ticker : "",
      expDate: result.saleDate,
      legs: order.legs.map((l) => ({
        legType: l.legType,
        direction: l.direction,
        ticker: l.ticker,
        contracts: l.contracts,
        volumeUnits: l.volumeUnits,
        unitLabel: l.unitLabel,
        notionalUsd: l.notionalUsd,
        ndfRate: l.ndfRate,
        ndfMaturity: l.ndfMaturity,
      })),
      broker: order.broker,
      brokerAccount: order.brokerAccount,
      brokeragePerContract: order.brokeragePerContract,
      brokerageCurrency: order.brokerageCurrency as "USD" | "BRL",
      paymentDate: order.paymentDate,
      saleDate: order.saleDate,
      orderMessage: order.orderMessage,
      confirmationMessage: order.confirmationMessage,
      status: "GENERATED",
      stonexConfirmationText: null,
      stonexConfirmedAt: null,
      generatedAt: new Date().toISOString(),
      generatedByUserId: null,
      notes: null,
    };

    saveOrder(record);

    toast({
      title: `Ordem #${seqNum} registrada`,
      description: `${result.displayName} — ${volumeSacks} sacas`,
    });

    setOrderText(order.orderMessage);
    setConfirmText(order.confirmationMessage);
    setGenerated(true);
    onOrderSaved?.();
  };

  const handleClose = () => {
    onClose();
    setGenerated(false);
    setVolume("");
    setOrderText("");
    setConfirmText("");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Send className="h-4 w-4 text-primary" />
            Gerador de Ordens
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Volume (sacas) *</Label>
            <Input
              type="number"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              placeholder="Ex: 5000"
              className="h-9 font-mono text-sm"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Conta broker</Label>
            <Input
              type="text"
              value={contaBroker}
              onChange={(e) => setContaBroker(e.target.value)}
              className="h-9 font-mono text-sm"
            />
          </div>

          {!generated ? (
            <Button onClick={handleGenerate} className="w-full gap-2" size="lg" disabled={!volume || parseFloat(volume) <= 0}>
              <Send className="h-4 w-4" />
              Gerar Ordem
            </Button>
          ) : (
            <div className="space-y-3">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Ordem</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 text-xs"
                    onClick={() => handleCopy(orderText, "order")}
                  >
                    {copiedOrder ? <Check className="h-3.5 w-3.5 text-positive" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedOrder ? "Copiado!" : "Copiar"}
                  </Button>
                </div>
                <Textarea
                  readOnly
                  value={orderText}
                  className="h-44 resize-none font-mono text-xs leading-relaxed"
                />
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Confirmação</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 text-xs"
                    onClick={() => handleCopy(confirmText, "confirm")}
                  >
                    {copiedConfirm ? <Check className="h-3.5 w-3.5 text-positive" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedConfirm ? "Copiado!" : "Copiar"}
                  </Button>
                </div>
                <Textarea
                  readOnly
                  value={confirmText}
                  className="h-32 resize-none font-mono text-xs leading-relaxed"
                />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
