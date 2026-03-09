import { useState, useMemo } from "react";
import { PlusCircle, CalendarIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { OrderRecord } from "@/lib/orderRecord";
import { saveOrder, getNextSequentialNumber } from "@/lib/orderStorage";

const WAREHOUSES = [
  { id: "confresa", name: "Confresa" },
  { id: "matupa", name: "Matupá" },
  { id: "alta_floresta", name: "Alta Floresta" },
];

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <Input type="text" inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-10 font-mono text-sm" />
    </div>
  );
}

export default function NewOrder() {
  const navigate = useNavigate();
  const [commodity, setCommodity] = useState<"soybean" | "corn">("soybean");
  const [warehouseId, setWarehouseId] = useState("confresa");
  const [operationDate, setOperationDate] = useState<Date>(new Date());
  const [pendingDate, setPendingDate] = useState<Date | null>(null);
  const [volumeSacks, setVolumeSacks] = useState("");
  const [netPrice, setNetPrice] = useState("");
  const [grossPrice, setGrossPrice] = useState("");
  const [futuresPrice, setFuturesPrice] = useState("");
  const [exchangeRate, setExchangeRate] = useState("");
  const [ticker, setTicker] = useState("");
  const [targetBasis, setTargetBasis] = useState("");
  const [purchasedBasis, setPurchasedBasis] = useState("");
  const [breakEvenBasis, setBreakEvenBasis] = useState("");
  const [storageCost, setStorageCost] = useState("");
  const [financialCost, setFinancialCost] = useState("");
  const [brokerageCost, setBrokerageCost] = useState("");
  const [deskCost, setDeskCost] = useState("");
  const [broker, setBroker] = useState("stonex");
  const [brokerAccount, setBrokerAccount] = useState("17130");
  const [brokeragePerContract, setBrokeragePerContract] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [saleDate, setSaleDate] = useState("");
  const [contracts, setContracts] = useState("");
  const [notionalUsdManual, setNotionalUsdManual] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<OrderRecord["status"]>("BROKER_CONFIRMED");
  const [saving, setSaving] = useState(false);

  const isSoja = commodity === "soybean";
  const parseNum = (v: string) => { const n = parseFloat(v.replace(",", ".")); return isNaN(n) ? 0 : n; };

  const calculatedNotional = useMemo(() => {
    const net = parseNum(netPrice);
    const vol = parseNum(volumeSacks);
    const fx = parseNum(exchangeRate);
    if (net > 0 && vol > 0 && fx > 0) return Math.round((net * vol) / fx * 100) / 100;
    return 0;
  }, [netPrice, volumeSacks, exchangeRate]);

  const isValid = () => volumeSacks && netPrice && ticker && paymentDate && saleDate && operationDate;

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    if (!isToday(date)) {
      setPendingDate(date);
    } else {
      setOperationDate(date);
    }
  };

  const handleSave = async () => {
    if (!isValid() || saving) return;
    setSaving(true);
    try {
      const vol = parseNum(volumeSacks);
      const tons = Math.round((vol * 60) / 1000 * 100) / 100;
      const storage = parseNum(storageCost);
      const financial = parseNum(financialCost);
      const brokerage = parseNum(brokerageCost);
      const desk = parseNum(deskCost);
      const totalCosts = storage + financial + brokerage + desk;
      const wh = WAREHOUSES.find((w) => w.id === warehouseId);
      const seqNum = await getNextSequentialNumber();
      const contractsNum = parseNum(contracts);
      let normalizedFutures = parseNum(futuresPrice);
      if (isSoja && normalizedFutures >= 100) normalizedFutures = normalizedFutures / 100;
      const fx = isSoja ? parseNum(exchangeRate) || null : null;
      const finalNotional = parseNum(notionalUsdManual) || calculatedNotional;

      const legs: OrderRecord["legs"] = [];
      if (contractsNum > 0) legs.push({ legType: "futures", direction: "sell", ticker, contracts: contractsNum });
      if (isSoja && finalNotional > 0 && fx) legs.push({ legType: "ndf", direction: "sell", notionalUsd: finalNotional, ndfRate: fx });

      const record: OrderRecord = {
        id: crypto.randomUUID(),
        sequentialNumber: seqNum,
        operationId: null,
        commodity,
        exchange: isSoja ? "cbot" : "b3",
        warehouseId,
        warehouseDisplayName: wh?.name ?? warehouseId,
        volumeSacks: vol,
        volumeTons: tons,
        volumeBushels: isSoja ? Math.round(vol * 60 / 27.2155 * 100) / 100 : null,
        originationPriceNetBrl: parseNum(netPrice),
        originationPriceGrossBrl: parseNum(grossPrice) || parseNum(netPrice) + totalCosts,
        futuresPrice: normalizedFutures,
        futuresPriceCurrency: isSoja ? "USD" : "BRL",
        exchangeRate: fx,
        targetBasisBrl: parseNum(targetBasis),
        purchasedBasisBrl: parseNum(purchasedBasis),
        breakEvenBasisBrl: parseNum(breakEvenBasis),
        costs: { storageBrl: storage, financialBrl: financial, brokerageBrl: brokerage, deskCostBrl: desk, totalBrl: totalCosts },
        ticker,
        expDate: saleDate,
        legs,
        broker,
        brokerAccount,
        brokeragePerContract: parseNum(brokeragePerContract),
        brokerageCurrency: isSoja ? "USD" : "BRL",
        paymentDate,
        saleDate,
        orderMessage: "",
        confirmationMessage: "",
        status,
        stonexConfirmationText: null,
        stonexConfirmedAt: null,
        operationDate: format(operationDate, "yyyy-MM-dd"),
        generatedAt: new Date().toISOString(),
        generatedByUserId: null,
        notes: notes.trim() || "Cadastro manual",
      };

      await saveOrder(record);
      toast({ title: `Ordem #${seqNum} cadastrada`, description: `${wh?.name ?? warehouseId} — ${vol} sacas` });
      navigate("/ordens");
    } catch (err) {
      console.error("Failed to save order", err);
      toast({ title: "Erro ao salvar ordem", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cadastrar Ordem</h1>
        <p className="text-sm text-muted-foreground mt-1">Registre uma ordem manualmente no sistema.</p>
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-5">
        {/* Operation Date */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Data da Operação *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full h-10 justify-start text-left font-mono text-sm", !operationDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(operationDate, "dd/MM/yyyy", { locale: ptBR })}
                {!isToday(operationDate) && (
                  <span className="ml-auto text-xs text-destructive font-medium">Data alterada</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={operationDate}
                onSelect={handleDateSelect}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Commodity + Warehouse */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Commodity</Label>
            <Select value={commodity} onValueChange={(v) => setCommodity(v as "soybean" | "corn")}>
              <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="soybean">Soja</SelectItem>
                <SelectItem value="corn">Milho</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Praça</Label>
            <Select value={warehouseId} onValueChange={setWarehouseId}>
              <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {WAREHOUSES.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Volume (sacas) *" value={volumeSacks} onChange={setVolumeSacks} placeholder="5.000" />
          <Field label="Ticker *" value={ticker} onChange={setTicker} placeholder={isSoja ? "ZSN26" : "CCMU26"} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Preço líquido (R$/sc) *" value={netPrice} onChange={setNetPrice} placeholder="115,00" />
          <Field label="Preço bruto (R$/sc)" value={grossPrice} onChange={setGrossPrice} placeholder="125,00" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label={isSoja ? "Futuro (¢/bu ou USD/bu)" : "Futuro (R$/sc)"} value={futuresPrice} onChange={setFuturesPrice} placeholder={isSoja ? "1050.00" : "72,00"} />
          {isSoja ? <Field label="Câmbio (R$/USD)" value={exchangeRate} onChange={setExchangeRate} placeholder="5.7500" /> : <Field label="Contratos" value={contracts} onChange={setContracts} placeholder="10" />}
        </div>

        {isSoja && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Contratos" value={contracts} onChange={setContracts} placeholder="18" />
            <Field label="Qtd Dólar (USD)" value={notionalUsdManual} onChange={setNotionalUsdManual} placeholder={calculatedNotional > 0 ? calculatedNotional.toFixed(2) : "auto"} />
          </div>
        )}

        <Separator />

        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Basis (R$/sc)</p>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Alvo" value={targetBasis} onChange={setTargetBasis} placeholder="-29,00" />
          <Field label="Comprado" value={purchasedBasis} onChange={setPurchasedBasis} placeholder="-30,50" />
          <Field label="Breakeven" value={breakEvenBasis} onChange={setBreakEvenBasis} placeholder="-25,00" />
        </div>

        <Separator />

        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Custos</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Armazenagem (R$/sc)" value={storageCost} onChange={setStorageCost} placeholder="2,50" />
          <Field label="Financeiro (R$/sc)" value={financialCost} onChange={setFinancialCost} placeholder="3,00" />
          <Field label="Corretagem (R$/sc)" value={brokerageCost} onChange={setBrokerageCost} placeholder="0,50" />
          <Field label="Desk (R$/sc)" value={deskCost} onChange={setDeskCost} placeholder="0,30" />
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-4">
          <Field label="Broker" value={broker} onChange={setBroker} placeholder="stonex" />
          <Field label="Conta" value={brokerAccount} onChange={setBrokerAccount} placeholder="17130" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Corretagem/contrato" value={brokeragePerContract} onChange={setBrokeragePerContract} placeholder="15.00" />
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as OrderRecord["status"])}>
              <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="GENERATED">Gerada</SelectItem>
                <SelectItem value="SENT">Enviada</SelectItem>
                <SelectItem value="BROKER_CONFIRMED">Confirmada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Pagamento *" value={paymentDate} onChange={setPaymentDate} placeholder="15/04/2026" />
          <Field label="Venda *" value={saleDate} onChange={setSaleDate} placeholder="01/05/2026" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Observações</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Cadastro manual" className="h-20 resize-none text-sm" />
        </div>

        <Button onClick={handleSave} className="w-full gap-2" size="lg" disabled={!isValid() || saving}>
          <PlusCircle className="h-4 w-4" />
          {saving ? "Salvando..." : "Salvar Ordem"}
        </Button>
      </div>

      {/* AlertDialog for date change confirmation */}
      <AlertDialog open={!!pendingDate} onOpenChange={(open) => { if (!open) setPendingDate(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alterar data da operação?</AlertDialogTitle>
            <AlertDialogDescription>
              A data selecionada é diferente de hoje. Deseja registrar esta ordem com a data{" "}
              <strong>{pendingDate ? format(pendingDate, "dd/MM/yyyy") : ""}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (pendingDate) { setOperationDate(pendingDate); setPendingDate(null); } }}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}