import { useState, useCallback, useMemo } from "react";
import { ClipboardList, Download, Copy, Check, ChevronDown, X, PlusCircle, Trash2, Filter } from "lucide-react";
import ManualOrderForm from "@/components/ManualOrderForm";
import { formatBRL } from "@/lib/formatters";
import { toast } from "@/hooks/use-toast";
import type { OrderRecord } from "@/lib/orderRecord";
import {
  getAllOrders,
  updateOrderStatus,
  updateStonexConfirmation,
  deleteOrder,
  exportOrdersToJson,
  updateOrderNotes,
  permanentlyDeleteOrder,
} from "@/lib/orderStorage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const STATUS_MAP: Record<OrderRecord["status"], { label: string; className: string }> = {
  GENERATED: { label: "Gerada", className: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30" },
  SENT: { label: "Enviada", className: "bg-blue-500/15 text-blue-700 border-blue-500/30" },
  BROKER_CONFIRMED: { label: "Confirmada", className: "bg-green-500/15 text-green-700 border-green-500/30" },
  LINKED: { label: "Vinculada", className: "bg-purple-500/15 text-purple-700 border-purple-500/30" },
  CANCELLED: { label: "Cancelada", className: "bg-red-500/15 text-red-700 border-red-500/30" },
};

function formatDateTimeBR(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrderHistory({ refreshKey }: { refreshKey: number }) {
  const [orders, setOrders] = useState<OrderRecord[]>(() => getAllOrders());
  const [selected, setSelected] = useState<OrderRecord | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [copiedOrder, setCopiedOrder] = useState(false);
  const [copiedConfirm, setCopiedConfirm] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [editNotes, setEditNotes] = useState("");

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterCommodity, setFilterCommodity] = useState<string>("ALL");
  const [filterWarehouse, setFilterWarehouse] = useState<string>("ALL");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const refresh = useCallback(() => {
    setOrders(getAllOrders());
  }, []);

  // refresh when parent signals new order
  useState(() => { refresh(); });
  const [lastKey, setLastKey] = useState(refreshKey);
  if (refreshKey !== lastKey) {
    setLastKey(refreshKey);
    setOrders(getAllOrders());
  }

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (filterStatus !== "ALL" && o.status !== filterStatus) return false;
      if (filterCommodity !== "ALL" && o.commodity !== filterCommodity) return false;
      if (filterWarehouse !== "ALL" && o.warehouseDisplayName !== filterWarehouse) return false;
      if (filterDateFrom) {
        const from = new Date(filterDateFrom);
        if (new Date(o.generatedAt) < from) return false;
      }
      if (filterDateTo) {
        const to = new Date(filterDateTo);
        to.setHours(23, 59, 59, 999);
        if (new Date(o.generatedAt) > to) return false;
      }
      return true;
    });
  }, [orders, filterStatus, filterCommodity, filterWarehouse, filterDateFrom, filterDateTo]);

  const hasActiveFilters = filterStatus !== "ALL" || filterCommodity !== "ALL" || filterWarehouse !== "ALL" || filterDateFrom || filterDateTo;

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

  const handleMarkSent = (id: string) => {
    updateOrderStatus(id, "SENT");
    refresh();
    setSelected(orders.find((o) => o.id === id) ?? null);
  };

  const handleConfirmStonex = (id: string) => {
    if (!confirmText.trim()) return;
    updateStonexConfirmation(id, confirmText.trim());
    setConfirmText("");
    refresh();
    setSelected(orders.find((o) => o.id === id) ?? null);
  };

  const handleCancel = (id: string) => {
    deleteOrder(id);
    refresh();
    setSelected(orders.find((o) => o.id === id) ?? null);
  };

  const handlePermanentDelete = (id: string) => {
    permanentlyDeleteOrder(id);
    setSelected(null);
    refresh();
    toast({ title: "Ordem apagada permanentemente" });
  };

  const handleExport = () => {
    const json = exportOrdersToJson();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ordens_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setFilterStatus("ALL");
    setFilterCommodity("ALL");
    setFilterWarehouse("ALL");
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  const commodityPt = (c: string) => (c === "soybean" ? "Soja" : "Milho");

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between rounded-t-lg border bg-card px-4 py-2">
          <CollapsibleTrigger className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
            <ClipboardList className="h-4 w-4" />
            Histórico de Ordens
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            {orders.length > 0 && (
              <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                {orders.filter((o) => o.status !== "CANCELLED").length}
              </span>
            )}
          </CollapsibleTrigger>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => setShowManualForm(true)}>
              <PlusCircle className="h-3.5 w-3.5" />
              Cadastrar
            </Button>
            {orders.length > 0 && (
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={handleExport}>
                <Download className="h-3.5 w-3.5" />
                Exportar
              </Button>
            )}
          </div>
        </div>
        <CollapsibleContent>
          <div className="rounded-b-lg border border-t-0 bg-card p-3 space-y-3">
            {/* Filter bar */}
            {orders.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Filter className="h-3.5 w-3.5" />
                  <span className="font-semibold uppercase tracking-wider">Filtros</span>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px]" onClick={clearFilters}>
                      Limpar
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todos status</SelectItem>
                      <SelectItem value="GENERATED">Gerada</SelectItem>
                      <SelectItem value="SENT">Enviada</SelectItem>
                      <SelectItem value="BROKER_CONFIRMED">Confirmada</SelectItem>
                      <SelectItem value="LINKED">Vinculada</SelectItem>
                      <SelectItem value="CANCELLED">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterCommodity} onValueChange={setFilterCommodity}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Commodity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todas</SelectItem>
                      <SelectItem value="soybean">Soja</SelectItem>
                      <SelectItem value="corn">Milho</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterWarehouse} onValueChange={setFilterWarehouse}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Praça" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todas praças</SelectItem>
                      <SelectItem value="Confresa">Confresa</SelectItem>
                      <SelectItem value="Matupá">Matupá</SelectItem>
                      <SelectItem value="Alta Floresta">Alta Floresta</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    placeholder="De"
                    className="h-8 text-xs"
                  />
                  <Input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    placeholder="Até"
                    className="h-8 text-xs"
                  />
                </div>
                {hasActiveFilters && (
                  <p className="text-[10px] text-muted-foreground">
                    {filteredOrders.length} de {orders.length} ordens
                  </p>
                )}
              </div>
            )}

            {filteredOrders.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {hasActiveFilters ? "Nenhuma ordem encontrada com esses filtros." : "Nenhuma ordem registrada ainda."}
              </p>
            ) : (
              <div className="space-y-2">
                {filteredOrders.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => { setSelected(o); setCopiedOrder(false); setCopiedConfirm(false); setConfirmText(""); setEditNotes(o.notes ?? ""); }}
                    className="w-full rounded-lg border bg-background p-3 text-left transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-sm font-semibold truncate">
                          #{o.sequentialNumber} — {o.warehouseDisplayName} — {commodityPt(o.commodity)}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {o.volumeSacks.toLocaleString("pt-BR")} sc / {o.volumeTons.toLocaleString("pt-BR")} ton — {formatBRL(o.originationPriceNetBrl)} — {o.ticker}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Pagamento: {o.paymentDate} — Venda: {o.saleDate}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatDateTimeBR(o.generatedAt)}
                        </p>
                      </div>
                      <Badge variant="outline" className={STATUS_MAP[o.status].className}>
                        {STATUS_MAP[o.status].label}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Detail modal */}
      {selected && (
        <Dialog open onOpenChange={(o) => { if (!o) setSelected(null); }}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <ClipboardList className="h-4 w-4 text-primary" />
                Ordem #{selected.sequentialNumber}
                <Badge variant="outline" className={`ml-auto ${STATUS_MAP[selected.status].className}`}>
                  {STATUS_MAP[selected.status].label}
                </Badge>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-1">
                <span className="text-muted-foreground">Praça</span>
                <span className="font-medium">{selected.warehouseDisplayName}</span>
                <span className="text-muted-foreground">Commodity</span>
                <span className="font-medium">{commodityPt(selected.commodity)}</span>
                <span className="text-muted-foreground">Volume</span>
                <span className="font-mono">{selected.volumeSacks.toLocaleString("pt-BR")} sc / {selected.volumeTons} ton</span>
                <span className="text-muted-foreground">Preço líquido</span>
                <span className="font-mono">{formatBRL(selected.originationPriceNetBrl)}</span>
                <span className="text-muted-foreground">Preço bruto</span>
                <span className="font-mono">{formatBRL(selected.originationPriceGrossBrl)}</span>
                <span className="text-muted-foreground">Ticker</span>
                <span className="font-mono">{selected.ticker}</span>
                <span className="text-muted-foreground">Futuro</span>
                <span className="font-mono">{selected.futuresPrice.toFixed(2)} {selected.futuresPriceCurrency}</span>
                {selected.exchangeRate && (
                  <>
                    <span className="text-muted-foreground">Câmbio</span>
                    <span className="font-mono">{selected.exchangeRate.toFixed(4)}</span>
                  </>
                )}
                {(() => {
                  const ndfLeg = selected.legs.find((l) => l.legType === "ndf");
                  return ndfLeg?.notionalUsd ? (
                    <>
                      <span className="text-muted-foreground">Qtd Dólar</span>
                      <span className="font-mono">US$ {ndfLeg.notionalUsd.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                    </>
                  ) : null;
                })()}
                <span className="text-muted-foreground">Basis comprado</span>
                <span className="font-mono">{formatBRL(selected.purchasedBasisBrl)}</span>
                <span className="text-muted-foreground">Basis breakeven</span>
                <span className="font-mono">{formatBRL(selected.breakEvenBasisBrl)}</span>
                <span className="text-muted-foreground">Total custos</span>
                <span className="font-mono text-destructive">{formatBRL(selected.costs.totalBrl)}</span>
                <span className="text-muted-foreground">Pagamento</span>
                <span>{selected.paymentDate}</span>
                <span className="text-muted-foreground">Venda</span>
                <span>{selected.saleDate}</span>
                <span className="text-muted-foreground">Broker</span>
                <span>{selected.broker} — Conta {selected.brokerAccount}</span>
              </div>

              <Separator />

              {/* Order message */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Ordem</span>
                  <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => handleCopy(selected.orderMessage, "order")}>
                    {copiedOrder ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedOrder ? "Copiado!" : "Copiar"}
                  </Button>
                </div>
                <Textarea readOnly value={selected.orderMessage} className="h-36 resize-none font-mono text-xs leading-relaxed" />
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Confirmação</span>
                  <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => handleCopy(selected.confirmationMessage, "confirm")}>
                    {copiedConfirm ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedConfirm ? "Copiado!" : "Copiar"}
                  </Button>
                </div>
                <Textarea readOnly value={selected.confirmationMessage} className="h-24 resize-none font-mono text-xs leading-relaxed" />
              </div>

              {selected.stonexConfirmationText && (
                <div>
                  <span className="text-xs font-semibold text-muted-foreground">Confirmação StoneX</span>
                  <Textarea readOnly value={selected.stonexConfirmationText} className="mt-1 h-20 resize-none font-mono text-xs" />
                  {selected.stonexConfirmedAt && (
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Confirmada em {formatDateTimeBR(selected.stonexConfirmedAt)}
                    </p>
                  )}
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground">Observações</span>
                <Textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Sem observações"
                  className="h-16 resize-none text-sm"
                />
                {editNotes !== (selected.notes ?? "") && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => {
                      updateOrderNotes(selected.id, editNotes);
                      refresh();
                      setSelected({ ...selected, notes: editNotes });
                      toast({ title: "Observações salvas" });
                    }}
                  >
                    Salvar observações
                  </Button>
                )}
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {selected.status === "GENERATED" && (
                  <Button size="sm" onClick={() => handleMarkSent(selected.id)} className="gap-1">
                    Marcar como Enviada
                  </Button>
                )}

                {selected.status === "SENT" && (
                  <div className="w-full space-y-2">
                    <Textarea
                      placeholder="Cole aqui a confirmação do broker StoneX..."
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      className="h-20 resize-none font-mono text-xs"
                    />
                    <Button size="sm" onClick={() => handleConfirmStonex(selected.id)} disabled={!confirmText.trim()} className="gap-1">
                      Confirmar StoneX
                    </Button>
                  </div>
                )}

                {selected.status !== "CANCELLED" && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="gap-1">
                        <X className="h-3.5 w-3.5" />
                        Cancelar Ordem
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancelar ordem #{selected.sequentialNumber}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          A ordem será marcada como cancelada.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Voltar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleCancel(selected.id)}>
                          Confirmar cancelamento
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                {/* Hard delete */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1 border-destructive/30 text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-3.5 w-3.5" />
                      Apagar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Apagar ordem #{selected.sequentialNumber} permanentemente?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação é irreversível. A ordem será removida completamente do histórico.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Voltar</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => handlePermanentDelete(selected.id)}
                      >
                        Apagar permanentemente
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <ManualOrderForm
        open={showManualForm}
        onClose={() => setShowManualForm(false)}
        onSaved={refresh}
      />
    </>
  );
}
