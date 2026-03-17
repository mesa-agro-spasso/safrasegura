import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, ArrowLeft, Loader2 } from "lucide-react";
import { loadSavedParams } from "@/lib/params-storage";

export default function DailyTable() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const saved = await loadSavedParams();
        if (saved) {
          setSavedAt(saved.saved_at);
          setGeneratedAt(saved.generated_at);
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
          <h1 className="text-xl font-bold text-foreground">Daily Table</h1>
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

      {/* Placeholder for results - will be implemented in Etapa 2 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resultado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
            <p className="font-medium">Resultados da precificação</p>
            <p className="text-xs mt-1">
              {neverGenerated
                ? "Clique em 'Gerar Tabela' na aba de Parâmetros para gerar os resultados."
                : "Resultados serão exibidos aqui após a integração com o motor de cálculo."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
