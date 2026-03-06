import { useState } from "react";
import { BarChart3 } from "lucide-react";
import MarketData from "@/components/MarketData";
import PriceTable from "@/components/PriceTable";
import DetailModal from "@/components/DetailModal";
import OrderGenerator from "@/components/OrderGenerator";

interface CellSelection {
  commodity: "soja" | "milho";
  city: string;
  column: string;
  value: number;
}

const Index = () => {
  const [marketData, setMarketData] = useState({
    cbotSoja: 10.50,
    contratoSoja: "ZSN26",
    dolarStonex: "5.9143",
    contratoMilho: "CCMU26",
    b3Milho: 75.00,
  });
  const [showTable, setShowTable] = useState(false);
  const [selectedCell, setSelectedCell] = useState<CellSelection | null>(null);
  const [showOrder, setShowOrder] = useState(false);

  const handleGenerate = (values: any) => {
    setMarketData({
      cbotSoja: values.cbotSoja,
      contratoSoja: values.contratoSoja,
      dolarStonex: values.dolarStonex,
      contratoMilho: values.contratoMilho,
      b3Milho: values.b3Milho,
    });
    setShowTable(true);
  };

  const handleCellClick = (commodity: "soja" | "milho", city: string, column: string, value: number) => {
    setSelectedCell({ commodity, city, column, value });
  };

  const handleGenerateOrder = () => {
    setShowOrder(true);
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur-sm">
        <div className="container flex items-center gap-2 py-3">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h1 className="text-sm font-bold tracking-tight">
            Mesa de Originação
          </h1>
          <span className="ml-auto rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-primary">
            Grãos
          </span>
        </div>
      </header>

      <main className="container space-y-4 pt-4">
        <MarketData onGenerate={handleGenerate} />

        {showTable && (
          <PriceTable
            contratoSoja={marketData.contratoSoja}
            cbotSoja={marketData.cbotSoja}
            dolarStonex={marketData.dolarStonex}
            contratoMilho={marketData.contratoMilho}
            b3Milho={marketData.b3Milho}
            onCellClick={handleCellClick}
          />
        )}
      </main>

      {/* Detail Modal */}
      {selectedCell && (
        <DetailModal
          open={!!selectedCell && !showOrder}
          onClose={() => setSelectedCell(null)}
          commodity={selectedCell.commodity}
          city={selectedCell.city}
          column={selectedCell.column}
          value={selectedCell.value}
          onGenerateOrder={handleGenerateOrder}
        />
      )}

      {/* Order Generator */}
      {selectedCell && (
        <OrderGenerator
          open={showOrder}
          onClose={() => { setShowOrder(false); setSelectedCell(null); }}
          commodity={selectedCell.commodity}
          city={selectedCell.city}
          column={selectedCell.column}
          value={selectedCell.value}
        />
      )}
    </div>
  );
};

export default Index;
