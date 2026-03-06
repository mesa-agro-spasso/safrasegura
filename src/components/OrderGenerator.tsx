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

interface OrderGeneratorProps {
  open: boolean;
  onClose: () => void;
  commodity: "soja" | "milho";
  city: string;
  column: string;
  value: number;
}

export default function OrderGenerator({
  open,
  onClose,
  commodity,
  city,
  column,
  value,
}: OrderGeneratorProps) {
  const isSoja = commodity === "soja";
  const [volume, setVolume] = useState("");
  const [corretagem, setCorretagem] = useState("15.00");
  const [contaBroker, setContaBroker] = useState("17130");
  const [dataPagamento, setDataPagamento] = useState("");
  const [dataVenda, setDataVenda] = useState("");
  const [maturidadeNdf, setMaturidadeNdf] = useState("");
  const [generated, setGenerated] = useState(false);
  const [copiedOrder, setCopiedOrder] = useState(false);
  const [copiedConfirm, setCopiedConfirm] = useState(false);

  const orderText = `📋 *ORDEM DE ${commodity.toUpperCase()}*
━━━━━━━━━━━━━━━
📍 Praça: ${city}
📅 Vencimento: ${column}
💰 Preço: R$ ${value.toFixed(2).replace(".", ",")}
📦 Volume: ${volume || "—"} sacas
🏦 Conta: ${contaBroker}
💵 Corretagem: R$ ${corretagem}/contrato
📅 Pagamento: ${dataPagamento || "—"}
📅 Venda: ${dataVenda || "—"}${isSoja ? `\n📅 NDF: ${maturidadeNdf || "—"}` : ""}
━━━━━━━━━━━━━━━`;

  const confirmText = `✅ *CONFIRMAÇÃO*
━━━━━━━━━━━━━━━
${commodity.toUpperCase()} — ${city}
Preço: R$ ${value.toFixed(2).replace(".", ",")}
Volume: ${volume || "—"} sacas
Conta: ${contaBroker}
Status: ✅ Ordem enviada
━━━━━━━━━━━━━━━`;

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
    } catch {
      // fallback silently
    }
  };

  const handleGenerate = () => {
    setGenerated(true);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); setGenerated(false); } }}>
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Corretagem/contrato</Label>
              <Input
                type="number"
                step="0.01"
                value={corretagem}
                onChange={(e) => setCorretagem(e.target.value)}
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Data pagamento</Label>
              <Input
                type="date"
                value={dataPagamento}
                onChange={(e) => setDataPagamento(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Data venda</Label>
              <Input
                type="date"
                value={dataVenda}
                onChange={(e) => setDataVenda(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          {isSoja && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Maturidade NDF</Label>
              <Input
                type="date"
                value={maturidadeNdf}
                onChange={(e) => setMaturidadeNdf(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          )}

          {!generated ? (
            <Button onClick={handleGenerate} className="w-full gap-2" size="lg" disabled={!volume}>
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
