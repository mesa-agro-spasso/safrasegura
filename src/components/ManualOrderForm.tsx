import { useState } from "react";
import { PlusCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import type { OrderRecord } from "@/lib/orderRecord";
import { saveOrder, getNextSequentialNumber } from "@/lib/orderStorage";

interface ManualOrderFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const WAREHOUSES = [
  { id: "confresa", name: "Confresa" },
  { id: "matupa", name: "Matupá" },
  { id: "alta_floresta", name: "Alta Floresta" },
  { id: "guarantã", name: "Guarantã do Norte" },
  { id: "novo_mundo", name: "Novo Mundo" },
];

export default function ManualOrderForm({ open, onClose, onSaved }: ManualOrderFormProps) {
  const [commodity, setCommodity] = useState<"soybean" | "corn">("soybean");
  const [warehouseId, setWarehouseId] = useState("confresa");
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
  const [status, setStatus] = useState<OrderRecord["status"]>("BROKER_CONFIRMED");

  const isSoja = commodity === "soybean";
  const exchange = isSoja ? "cbot" : "b3";

  const parseNum = (v: string) => {
    const n = parseFloat(v.replace(",", "."));
    return isNaN(n) ? 0 : n;
  };

  const isValid = () => {
    return volumeSacks && netPrice && ticker && paymentDate && saleDate;
  };

  const handleSave = () => {
    if (!isValid()) return;

    const vol = parseNum(volumeSacks);
    const tons = Math.round((vol * 60) / 1000 * 100) / 100;
    const storage = parseNum(storageCost);
    const financial = parseNum(financialCost);
    const brokerage = parseNum(brokerageCost);
    const desk = parseNum(deskCost);
    const totalCosts = storage + financial + brokerage + desk;

    const wh = WAREHOUSES.find((w) => w.id === warehouseId);
    const seqNum = getNextSequentialNumber();

    const contractsNum = parseNum(contracts);

    const record: OrderRecord = {
      id: crypto.randomUUID(),
      sequentialNumber: seqNum,
      operationId: null,
      commodity,
      exchange,
      warehouseId,
      warehouseDisplayName: wh?.name ?? warehouseId,
      volumeSacks: vol,
      volumeTons: tons,
      volumeBushels: isSoja ? Math.round(vol * 60 / 27.2155 * 100) / 100 : null,
      originationPriceNetBrl: parseNum(netPrice),
      originationPriceGrossBrl: parseNum(grossPrice) || parseNum(netPrice) + totalCosts,
      futuresPrice: parseNum(futuresPrice),
      futuresPriceCurrency: isSoja ? "USD" : "BRL",
      exchangeRate: isSoja ? parseNum(exchangeRate) || null : null,
      targetBasisBrl: parseNum(targetBasis),
      purchasedBasisBrl: parseNum(purchasedBasis),
      breakEvenBasisBrl: parseNum(breakEvenBasis),
      costs: {
        storageBrl: storage,
        financialBrl: financial,
        brokerageBrl: brokerage,
        deskCostBrl: desk,
        totalBrl: totalCosts,
      },
      ticker,
      expDate: saleDate,
      legs: contractsNum > 0
        ? [{
            legType: "futures",
            direction: "sell",
            ticker,
            contracts: contractsNum,
          }]
        : [],
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
      generatedAt: new Date().toISOString(),
      generatedByUserId: null,
      notes: "Cadastro manual",
    };

    saveOrder(record);
    toast({ title: `Ordem #${seqNum} cadastrada`, description: `${wh?.name ?? warehouseId} — ${vol} sacas` });
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <PlusCircle className="h-4 w-4 text-primary" />
            Cadastrar Ordem Manual
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Commodity + Warehouse */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Commodity</Label>
              <Select value={commodity} onValueChange={(v) => setCommodity(v as "soybean" | "corn")}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="soybean">Soja</SelectItem>
                  <SelectItem value="corn">Milho</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Praça</Label>
              <Select value={warehouseId} onValueChange={setWarehouseId}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WAREHOUSES.map((w) => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Volume + Ticker */}
          <div className="grid grid-cols-2 gap-2">
            <Field label="Volume (sacas) *" value={volumeSacks} onChange={setVolumeSacks} placeholder="5000" />
            <Field label="Ticker *" value={ticker} onChange={setTicker} placeholder={isSoja ? "ZSN26" : "CCMU26"} />
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-2">
            <Field label="Preço líquido (R$) *" value={netPrice} onChange={setNetPrice} placeholder="115,00" />
            <Field label="Preço bruto (R$)" value={grossPrice} onChange={setGrossPrice} placeholder="125,00" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Field label={`Futuro (${isSoja ? "USD" : "BRL"})`} value={futuresPrice} onChange={setFuturesPrice} placeholder={isSoja ? "1050.00" : "72.00"} />
            {isSoja && (
              <Field label="Câmbio (R$/USD)" value={exchangeRate} onChange={setExchangeRate} placeholder="5.7500" />
            )}
            {!isSoja && (
              <Field label="Contratos" value={contracts} onChange={setContracts} placeholder="10" />
            )}
          </div>

          {isSoja && (
            <div className="grid grid-cols-2 gap-2">
              <Field label="Contratos" value={contracts} onChange={setContracts} placeholder="18.37" />
              <div />
            </div>
          )}

          <Separator />

          {/* Basis */}
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Basis</p>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Alvo" value={targetBasis} onChange={setTargetBasis} placeholder="-29,00" />
            <Field label="Comprado" value={purchasedBasis} onChange={setPurchasedBasis} placeholder="-30,50" />
            <Field label="Breakeven" value={breakEvenBasis} onChange={setBreakEvenBasis} placeholder="-25,00" />
          </div>

          <Separator />

          {/* Costs */}
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Custos (R$/sc)</p>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Armazenagem" value={storageCost} onChange={setStorageCost} placeholder="2,50" />
            <Field label="Financeiro" value={financialCost} onChange={setFinancialCost} placeholder="3,00" />
            <Field label="Corretagem" value={brokerageCost} onChange={setBrokerageCost} placeholder="0,50" />
            <Field label="Desk" value={deskCost} onChange={setDeskCost} placeholder="0,30" />
          </div>

          <Separator />

          {/* Broker + Dates */}
          <div className="grid grid-cols-2 gap-2">
            <Field label="Broker" value={broker} onChange={setBroker} placeholder="stonex" />
            <Field label="Conta" value={brokerAccount} onChange={setBrokerAccount} placeholder="17130" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Corretagem/contrato" value={brokeragePerContract} onChange={setBrokeragePerContract} placeholder="15.00" />
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as OrderRecord["status"])}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GENERATED">Gerada</SelectItem>
                  <SelectItem value="SENT">Enviada</SelectItem>
                  <SelectItem value="BROKER_CONFIRMED">Confirmada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Pagamento (DD/MM/YYYY) *" value={paymentDate} onChange={setPaymentDate} placeholder="15/04/2026" />
            <Field label="Venda (DD/MM/YYYY) *" value={saleDate} onChange={setSaleDate} placeholder="01/05/2026" />
          </div>

          <Button onClick={handleSave} className="w-full gap-2" size="lg" disabled={!isValid()}>
            <PlusCircle className="h-4 w-4" />
            Salvar Ordem
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 font-mono text-sm"
      />
    </div>
  );
}
