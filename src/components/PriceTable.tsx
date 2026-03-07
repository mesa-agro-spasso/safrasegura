import { Wheat, Leaf } from "lucide-react";
import { formatBRL } from "@/lib/formatters";
import type { PricingResult } from "@/lib/pricing-index";

interface PriceTableProps {
  results: PricingResult[];
  contratoSoja: string;
  cbotSoja: number;
  dolarStonex: number;
  contratoMilho: string;
  b3Milho: number;
  onCellClick: (result: PricingResult) => void;
}

function pivotResults(
  results: PricingResult[],
  commodity: string,
): { cities: string[]; columns: string[]; grid: Record<string, Record<string, PricingResult>> } {
  let filtered = results.filter((r) => r.commodity === commodity);
  if (commodity === "corn") filtered = filtered.filter((r) => r.paymentLabel !== "À vista");

  const citiesSet = new Set<string>();
  const columnsSet = new Set<string>();
  const grid: Record<string, Record<string, PricingResult>> = {};

  for (const r of filtered) {
    citiesSet.add(r.displayName);
    columnsSet.add(r.paymentLabel);
    if (!grid[r.displayName]) grid[r.displayName] = {};
    grid[r.displayName][r.paymentLabel] = r;
  }

  return { cities: Array.from(citiesSet), columns: Array.from(columnsSet), grid };
}

export default function PriceTable({
  results, contratoSoja, cbotSoja, dolarStonex, contratoMilho, b3Milho, onCellClick,
}: PriceTableProps) {
  const soja = pivotResults(results, "soybean");
  const milho = pivotResults(results, "corn");

  return (
    <section className="space-y-4">
      {soja.cities.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="flex items-center gap-2 border-b px-5 py-3 bg-primary/5">
            <Leaf className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">SOJA</span>
            <span className="ml-auto text-xs text-muted-foreground font-mono">
              {contratoSoja} · CBOT {cbotSoja.toFixed(2)} · USD {dolarStonex.toFixed(4)}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Praça</th>
                  {soja.columns.map((col) => (
                    <th key={col} className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {soja.cities.map((city, i) => (
                  <tr key={city} className={`border-b last:border-0 transition-colors hover:bg-accent/50 ${i % 2 === 1 ? "bg-muted/20" : ""}`}>
                    <td className="px-4 py-3 text-sm font-medium">{city}</td>
                    {soja.columns.map((col) => {
                      const r = soja.grid[city]?.[col];
                      return (
                        <td key={col} className="px-4 py-3 text-right font-mono text-sm cursor-pointer hover:text-primary transition-colors" onClick={() => r && onCellClick(r)}>
                          {r ? formatBRL(r.netPriceBrl) : "—"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {milho.cities.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="flex items-center gap-2 border-b px-5 py-3 bg-grain/5">
            <Wheat className="h-4 w-4 text-grain" />
            <span className="text-sm font-semibold text-grain">MILHO</span>
            <span className="ml-auto text-xs text-muted-foreground font-mono">
              {contratoMilho} · B3 {formatBRL(b3Milho)}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Praça</th>
                  {milho.columns.map((col) => (
                    <th key={col} className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {milho.cities.map((city, i) => (
                  <tr key={city} className={`border-b last:border-0 transition-colors hover:bg-accent/50 ${i % 2 === 1 ? "bg-muted/20" : ""}`}>
                    <td className="px-4 py-3 text-sm font-medium">{city}</td>
                    {milho.columns.map((col) => {
                      const r = milho.grid[city]?.[col];
                      return (
                        <td key={col} className="px-4 py-3 text-right font-mono text-sm cursor-pointer hover:text-primary transition-colors" onClick={() => r && onCellClick(r)}>
                          {r ? formatBRL(r.netPriceBrl) : "—"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
