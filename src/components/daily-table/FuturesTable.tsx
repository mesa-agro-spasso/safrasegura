import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { FuturesRow } from "@/lib/market-service";

interface FuturesTableProps {
  title: string;
  rows: FuturesRow[];
  onRowChange: (index: number, field: keyof FuturesRow, value: any) => void;
  showBrlColumn?: boolean;
  currencyLabel?: string;
}

export function FuturesTable({ title, rows, onRowChange, showBrlColumn = false, currencyLabel = "USD ¢/bu" }: FuturesTableProps) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-28">Ticker</TableHead>
              <TableHead className="w-32">Vencimento</TableHead>
              <TableHead className="w-32">{currencyLabel}</TableHead>
              {showBrlColumn && <TableHead className="w-32">BRL/sc</TableHead>}
              <TableHead className="w-20">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={showBrlColumn ? 5 : 4} className="text-center text-muted-foreground py-4">
                  Sem dados
                </TableCell>
              </TableRow>
            )}
            {rows.map((row, i) => (
              <TableRow key={row.ticker + i}>
                <TableCell className="font-mono text-xs">{row.ticker}</TableCell>
                <TableCell>
                  <Input
                    type="date"
                    value={row.exp_date ?? ""}
                    onChange={(e) => onRowChange(i, "exp_date", e.target.value)}
                    className="h-7 text-xs w-full"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    value={row.price ?? ""}
                    onChange={(e) => {
                      onRowChange(i, "price", e.target.value === "" ? null : Number(e.target.value));
                      onRowChange(i, "isManual", true);
                    }}
                    className="h-7 text-xs font-mono w-full"
                  />
                </TableCell>
                {showBrlColumn && (
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {row.price_brl_sack != null ? row.price_brl_sack.toFixed(2) : "—"}
                  </TableCell>
                )}
                <TableCell>
                  <Badge variant={row.isManual ? "outline" : "secondary"} className="text-[10px]">
                    {row.isManual ? "Manual" : "Auto"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
