import { Wheat, Leaf } from "lucide-react";
import { formatBRL } from "@/lib/formatters";

const CITIES = ["Confresa", "Matupá", "Alta Floresta"];

const SOJA_COLUMNS = ["À vista", "30/03", "30/04"];
const MILHO_COLUMNS = ["30/08", "30/09"];

// Placeholder data
const SOJA_DATA: Record<string, number[]> = {
  "Confresa": [106.50, 108.20, 109.80],
  "Matupá": [105.30, 107.00, 108.50],
  "Alta Floresta": [104.10, 105.80, 107.30],
};

const MILHO_DATA: Record<string, number[]> = {
  "Confresa": [46.50, 48.20],
  "Matupá": [45.30, 47.00],
  "Alta Floresta": [44.10, 45.80],
};

interface PriceTableProps {
  contratoSoja: string;
  cbotSoja: number;
  dolarStonex: string;
  contratoMilho: string;
  b3Milho: number;
  onCellClick: (commodity: "soja" | "milho", city: string, column: string, value: number) => void;
}

export default function PriceTable({
  contratoSoja,
  cbotSoja,
  dolarStonex,
  contratoMilho,
  b3Milho,
  onCellClick,
}: PriceTableProps) {
  return (
    <section className="space-y-4">
      {/* SOJA */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="flex items-center gap-2 border-b px-4 py-2.5">
          <Leaf className="h-4 w-4 text-positive" />
          <span className="text-sm font-semibold text-positive">SOJA</span>
          <span className="ml-auto text-xs text-muted-foreground">
            {contratoSoja} · CBOT {cbotSoja.toFixed(2)} · USD {dolarStonex}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Praça</th>
                {SOJA_COLUMNS.map((col) => (
                  <th key={col} className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CITIES.map((city) => (
                <tr key={city} className="border-b last:border-0 hover:bg-accent/50 transition-colors">
                  <td className="px-3 py-2.5 text-xs font-medium">{city}</td>
                  {SOJA_DATA[city].map((val, i) => (
                    <td
                      key={i}
                      className="px-3 py-2.5 text-right font-mono text-sm cursor-pointer hover:text-primary transition-colors"
                      onClick={() => onCellClick("soja", city, SOJA_COLUMNS[i], val)}
                    >
                      {formatBRL(val)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MILHO */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="flex items-center gap-2 border-b px-4 py-2.5">
          <Wheat className="h-4 w-4 text-grain" />
          <span className="text-sm font-semibold text-grain">MILHO</span>
          <span className="ml-auto text-xs text-muted-foreground">
            {contratoMilho} · B3 {formatBRL(b3Milho)}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Praça</th>
                {MILHO_COLUMNS.map((col) => (
                  <th key={col} className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CITIES.map((city) => (
                <tr key={city} className="border-b last:border-0 hover:bg-accent/50 transition-colors">
                  <td className="px-3 py-2.5 text-xs font-medium">{city}</td>
                  {MILHO_DATA[city].map((val, i) => (
                    <td
                      key={i}
                      className="px-3 py-2.5 text-right font-mono text-sm cursor-pointer hover:text-primary transition-colors"
                      onClick={() => onCellClick("milho", city, MILHO_COLUMNS[i], val)}
                    >
                      {formatBRL(val)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
