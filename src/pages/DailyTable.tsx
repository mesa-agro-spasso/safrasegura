import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ArrowLeft, Loader2 } from "lucide-react";
import { loadSavedParams } from "@/lib/params-storage";

function fmt(v: number | null | undefined, decimals = 2): string {
  if (v == null) return "–";
  return v.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function commodityLabel(c: string) {
  return c === "soybean" ? "Soja" : c === "corn" ? "Milho" : c;
}

export default function DailyTable() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const saved = await loadSavedParams();
        if (saved) {
          setSavedAt(saved.saved_at);
          setGeneratedAt(saved.generated_at);
          setResults(saved.results ?? []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const isStale = savedAt && generatedAt && new Date(savedAt) > new Date(generatedAt);
  const neverGenerated = !generatedAt;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Tabela de Preços</h1>
          <p className="text-sm text-muted-foreground">
            Tabela de precificação gerada a partir dos parâmetros configurados.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/parametros")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Parâmetros
        </Button>
      </div>

      {(isStale || neverGenerated) && (
        <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {neverGenerated ? "Tabela não gerada" : "Tabela defasada"}
          </AlertTitle>
          <AlertDescription>
            {neverGenerated
              ? "Nenhuma tabela foi gerada ainda. Vá em Parâmetros e clique em 'Gerar Tabela'."
              : "Os parâmetros foram alterados desde a última geração. Vá em Parâmetros e clique em 'Gerar Tabela' para atualizar."}
          </AlertDescription>
        </Alert>
      )}

      {!neverGenerated && generatedAt && (
        <p className="text-xs text-muted-foreground">
          Última geração: {new Date(generatedAt).toLocaleString("pt-BR")}
        </p>
      )}

      {results.length === 0 && !neverGenerated && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground text-sm">
            Nenhum resultado encontrado na última geração.
          </CardContent>
        </Card>
      )}

      {results.length > 0 && (
        <Tabs defaultValue="price" className="w-full">
          <TabsList>
            <TabsTrigger value="price">Preço</TabsTrigger>
            <TabsTrigger value="insurance">Seguro</TabsTrigger>
          </TabsList>

          <TabsContent value="price">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tabela de Preços</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Praça</TableHead>
                      <TableHead>Commodity</TableHead>
                      <TableHead>Ticker</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead className="text-right">Futuro (R$)</TableHead>
                      <TableHead className="text-right">Preço Bruto</TableHead>
                      <TableHead className="text-right">Preço Líq.</TableHead>
                      <TableHead className="text-right">Basis Comprado</TableHead>
                      <TableHead className="text-right">Basis BE</TableHead>
                      <TableHead className="text-right">Custos Total</TableHead>
                      <TableHead className="text-right">Desconto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{r.display_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {commodityLabel(r.commodity)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{r.ticker}</TableCell>
                        <TableCell className="text-xs">
                          {r.payment_date ? new Date(r.payment_date + "T12:00:00").toLocaleDateString("pt-BR") : "–"}
                        </TableCell>
                        <TableCell className="text-right font-mono">{fmt(r.futures_price_brl)}</TableCell>
                        <TableCell className="text-right font-mono">{fmt(r.gross_price_brl)}</TableCell>
                        <TableCell className="text-right font-mono font-semibold">{fmt(r.origination_price_brl)}</TableCell>
                        <TableCell className={`text-right font-mono ${(r.purchased_basis_brl ?? 0) < 0 ? "text-destructive" : "text-green-500"}`}>
                          {fmt(r.purchased_basis_brl)}
                        </TableCell>
                        <TableCell className={`text-right font-mono ${(r.breakeven_basis_brl ?? 0) < 0 ? "text-destructive" : "text-green-500"}`}>
                          {fmt(r.breakeven_basis_brl)}
                        </TableCell>
                        <TableCell className="text-right font-mono">{fmt(r.costs?.total_brl)}</TableCell>
                        <TableCell className="text-right font-mono">{fmt(r.additional_discount_brl)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insurance">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tabela de Seguro</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Praça</TableHead>
                      <TableHead>Commodity</TableHead>
                      <TableHead>Ticker</TableHead>
                      <TableHead className="text-center border-l" colSpan={3}>ATM</TableHead>
                      <TableHead className="text-center border-l" colSpan={3}>OTM 5%</TableHead>
                      <TableHead className="text-center border-l" colSpan={3}>OTM 10%</TableHead>
                    </TableRow>
                    <TableRow>
                      <TableHead />
                      <TableHead />
                      <TableHead />
                      {["ATM", "OTM 5%", "OTM 10%"].map((label) => (
                        <>
                          <TableHead key={`${label}-strike`} className="text-right border-l text-xs">Strike</TableHead>
                          <TableHead key={`${label}-premium`} className="text-right text-xs">Prêmio</TableHead>
                          <TableHead key={`${label}-total`} className="text-right text-xs">Custo Total</TableHead>
                        </>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((r, i) => {
                      const ins = r.insurance ?? {};
                      const atm = ins.atm ?? {};
                      const otm5 = ins.otm_5 ?? {};
                      const otm10 = ins.otm_10 ?? {};
                      return (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{r.display_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {commodityLabel(r.commodity)}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{r.ticker}</TableCell>
                          {/* ATM */}
                          <TableCell className="text-right font-mono border-l">{fmt(atm.strike_brl)}</TableCell>
                          <TableCell className="text-right font-mono">{fmt(atm.premium_brl)}</TableCell>
                          <TableCell className="text-right font-mono">{fmt(atm.total_cost_brl)}</TableCell>
                          {/* OTM 5% */}
                          <TableCell className="text-right font-mono border-l">{fmt(otm5.strike_brl)}</TableCell>
                          <TableCell className="text-right font-mono">{fmt(otm5.premium_brl)}</TableCell>
                          <TableCell className="text-right font-mono">{fmt(otm5.total_cost_brl)}</TableCell>
                          {/* OTM 10% */}
                          <TableCell className="text-right font-mono border-l">{fmt(otm10.strike_brl)}</TableCell>
                          <TableCell className="text-right font-mono">{fmt(otm10.premium_brl)}</TableCell>
                          <TableCell className="text-right font-mono">{fmt(otm10.total_cost_brl)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {neverGenerated && results.length === 0 && (
        <Card>
          <CardContent className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
            <p className="font-medium">Resultados da precificação</p>
            <p className="text-xs mt-1">
              Clique em 'Gerar Tabela' na aba de Parâmetros para gerar os resultados.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
