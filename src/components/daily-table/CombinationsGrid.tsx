import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import type { MarketData, FuturesRow } from "@/lib/market-service";
import type { GlobalParams } from "@/lib/combination-builder";

export interface CombinationGridRow {
  id: string;
  commodity: "soybean" | "corn";
  display_name: string;
  warehouse_id: string;
  ticker: string;
  futures_price: number;
  exp_date: string;
  exchange_rate: number | null;
  payment_date: string;
  grain_reception_date: string;
  sale_date: string;
  target_basis: number;
  additional_discount_brl: number;
  overrides: Record<string, any>;
}

interface CombinationsGridProps {
  combinations: CombinationGridRow[];
  onChange: (rows: CombinationGridRow[]) => void;
  marketData: MarketData;
  globalParams: GlobalParams;
}

function generateId(): string {
  return crypto.randomUUID();
}

function getAvailableTickers(commodity: "soybean" | "corn", market: MarketData): FuturesRow[] {
  if (commodity === "soybean") return market.soybean;
  return [...market.corn_cbot, ...market.corn_b3];
}

const EMPTY_ROW: Omit<CombinationGridRow, "id"> = {
  commodity: "soybean",
  display_name: "",
  warehouse_id: "",
  ticker: "",
  futures_price: 0,
  exp_date: "",
  exchange_rate: null,
  payment_date: "",
  grain_reception_date: "",
  sale_date: "",
  target_basis: 0,
  additional_discount_brl: 0,
  overrides: {},
};

export function CombinationsGrid({ combinations, onChange, marketData, globalParams }: CombinationsGridProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const addRow = () => {
    onChange([...combinations, { id: generateId(), ...EMPTY_ROW }]);
  };

  const removeRow = (id: string) => {
    onChange(combinations.filter((r) => r.id !== id));
  };

  const updateRow = (id: string, field: keyof CombinationGridRow, value: any) => {
    onChange(
      combinations.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: value };

        // Auto-fill from market when ticker changes
        if (field === "ticker" && value) {
          const tickers = getAvailableTickers(r.commodity, marketData);
          const match = tickers.find((t) => t.ticker === value);
          if (match) {
            updated.futures_price = match.price ?? 0;
            updated.exp_date = match.exp_date ?? "";
          }
        }

        // Reset ticker when commodity changes
        if (field === "commodity") {
          updated.ticker = "";
          updated.futures_price = 0;
          updated.exp_date = "";
        }

        return updated;
      }),
    );
  };

  const updateOverride = (id: string, key: string, value: any) => {
    onChange(
      combinations.map((r) => {
        if (r.id !== id) return r;
        const overrides = { ...r.overrides };
        if (value === "" || value === undefined) {
          delete overrides[key];
        } else {
          overrides[key] = Number(value);
        }
        return { ...r, overrides };
      }),
    );
  };

  const getResolvedValue = (row: CombinationGridRow, key: string): number => {
    if (row.overrides[key] !== undefined) return row.overrides[key];
    const commodity = row.commodity === "soybean" ? globalParams.soybean : globalParams.corn;
    if (key in globalParams.shared) return (globalParams.shared as any)[key];
    if (key in commodity) return (commodity as any)[key];
    return 0;
  };

  const OVERRIDE_FIELDS = [
    { key: "interest_rate", label: "Taxa Juros", suffix: "%" },
    { key: "storage_cost", label: "Armazenagem", suffix: "R$/sc" },
    { key: "reception_cost", label: "Recepção", suffix: "R$/sc" },
    { key: "desk_cost_pct", label: "Mesa", suffix: "%" },
    { key: "brokerage_per_contract", label: "Corretagem", suffix: "USD/ct" },
    { key: "shrinkage_rate_monthly", label: "Quebra", suffix: "" },
    { key: "rounding_increment", label: "Arred.", suffix: "R$" },
    { key: "risk_free_rate", label: "Risk-free", suffix: "" },
    { key: "sigma", label: "Sigma", suffix: "" },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Combinações</CardTitle>
        <Button variant="outline" size="sm" onClick={addRow} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Adicionar
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-8" />
                <TableHead className="w-24">Commodity</TableHead>
                <TableHead className="w-32">Praça</TableHead>
                <TableHead className="w-28">Ticker</TableHead>
                <TableHead className="w-24">Preço Fut.</TableHead>
                <TableHead className="w-28">Vencimento</TableHead>
                <TableHead className="w-28">Pagamento</TableHead>
                <TableHead className="w-28">Venda</TableHead>
                <TableHead className="w-20">Basis</TableHead>
                <TableHead className="w-20">Desc.</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {combinations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                    Nenhuma combinação. Clique em "Adicionar" para começar.
                  </TableCell>
                </TableRow>
              )}
              {combinations.map((row) => {
                const isExpanded = expandedRow === row.id;
                const tickers = getAvailableTickers(row.commodity, marketData);
                const hasOverrides = Object.keys(row.overrides).length > 0;

                return (
                  <TableRow key={row.id} className="group">
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setExpandedRow(isExpanded ? null : row.id)}
                      >
                        {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Select value={row.commodity} onValueChange={(v) => updateRow(row.id, "commodity", v)}>
                        <SelectTrigger className="h-7 text-xs w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="soybean">Soja</SelectItem>
                          <SelectItem value="corn">Milho</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={row.display_name}
                        onChange={(e) => {
                          updateRow(row.id, "display_name", e.target.value);
                          updateRow(row.id, "warehouse_id", e.target.value.toLowerCase().replace(/\s+/g, "_"));
                        }}
                        className="h-7 text-xs w-28"
                        placeholder="Ex: Confresa"
                      />
                    </TableCell>
                    <TableCell>
                      <Select value={row.ticker} onValueChange={(v) => updateRow(row.id, "ticker", v)}>
                        <SelectTrigger className="h-7 text-xs w-24">
                          <SelectValue placeholder="Ticker" />
                        </SelectTrigger>
                        <SelectContent>
                          {tickers.map((t) => (
                            <SelectItem key={t.ticker} value={t.ticker}>
                              {t.ticker}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={row.futures_price || ""}
                        onChange={(e) => updateRow(row.id, "futures_price", Number(e.target.value))}
                        className="h-7 text-xs font-mono w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        value={row.exp_date}
                        onChange={(e) => updateRow(row.id, "exp_date", e.target.value)}
                        className="h-7 text-xs w-28"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        value={row.payment_date}
                        onChange={(e) => updateRow(row.id, "payment_date", e.target.value)}
                        className="h-7 text-xs w-28"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        value={row.sale_date}
                        onChange={(e) => updateRow(row.id, "sale_date", e.target.value)}
                        className="h-7 text-xs w-28"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={row.target_basis || ""}
                        onChange={(e) => updateRow(row.id, "target_basis", Number(e.target.value))}
                        className="h-7 text-xs font-mono w-16"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={row.additional_discount_brl || ""}
                        onChange={(e) => updateRow(row.id, "additional_discount_brl", Number(e.target.value))}
                        className="h-7 text-xs font-mono w-16"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {hasOverrides && (
                          <Badge variant="outline" className="text-[9px] px-1">OVR</Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive"
                          onClick={() => removeRow(row.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Expanded overrides panel */}
        {expandedRow && combinations.find((r) => r.id === expandedRow) && (
          <div className="mt-3 rounded-lg border border-dashed border-border p-4 bg-muted/30">
            <p className="text-xs font-medium text-muted-foreground mb-3">
              Overrides para: {combinations.find((r) => r.id === expandedRow)?.display_name || "—"}
              <span className="ml-2 text-[10px]">(vazio = herda global)</span>
            </p>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {OVERRIDE_FIELDS.map((field) => {
                const row = combinations.find((r) => r.id === expandedRow)!;
                const hasOverride = row.overrides[field.key] !== undefined;
                const resolved = getResolvedValue(row, field.key);

                return (
                  <div key={field.key} className="space-y-1">
                    <label className="text-[10px] text-muted-foreground flex items-center gap-1">
                      {field.label}
                      {!hasOverride && <span className="text-[9px] text-muted-foreground/60">(={resolved})</span>}
                    </label>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        step="0.001"
                        value={row.overrides[field.key] ?? ""}
                        onChange={(e) => updateOverride(expandedRow, field.key, e.target.value)}
                        placeholder={String(resolved)}
                        className={`h-7 text-xs font-mono ${hasOverride ? "border-primary/50" : ""}`}
                      />
                      {field.suffix && (
                        <span className="text-[9px] text-muted-foreground whitespace-nowrap">{field.suffix}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
