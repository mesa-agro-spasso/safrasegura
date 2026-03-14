import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Settings2,
  Plus,
  Copy,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Leaf,
  Wheat,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import CombinationFormDialog from "@/components/CombinationFormDialog";
import { formatBRL } from "@/lib/formatters";

interface Combination {
  id: string;
  is_active: boolean;
  commodity: string;
  warehouse_id: string;
  display_name: string;
  payment_date: string;
  grain_reception_date: string | null;
  sale_date: string;
  trade_date_override: string | null;
  target_basis: number;
  ticker: string;
  exp_date: string;
  futures_price: number;
  exchange_rate: number | null;
  interest_rate: number;
  interest_rate_period: string;
  storage_cost: number;
  storage_cost_type: string;
  reception_cost: number;
  brokerage_per_contract: number;
  desk_cost_pct: number;
  shrinkage_rate_monthly: number;
  risk_free_rate: number;
  sigma: number;
  option_type: string;
  additional_discount_brl: number;
  rounding_increment: number;
  created_at: string;
  updated_at: string;
}

const emptyCombo: Omit<Combination, "id" | "created_at" | "updated_at"> = {
  is_active: true,
  commodity: "soybean",
  warehouse_id: "",
  display_name: "",
  payment_date: "",
  grain_reception_date: null,
  sale_date: "",
  trade_date_override: null,
  target_basis: 0,
  ticker: "",
  exp_date: "",
  futures_price: 0,
  exchange_rate: null,
  interest_rate: 1.4,
  interest_rate_period: "monthly",
  storage_cost: 3.5,
  storage_cost_type: "fixed",
  reception_cost: 0,
  brokerage_per_contract: 15.0,
  desk_cost_pct: 0.003,
  shrinkage_rate_monthly: 0,
  risk_free_rate: 0.149,
  sigma: 0.35,
  option_type: "call",
  additional_discount_brl: 0,
  rounding_increment: 0.5,
};

function formatDateBR(dateStr: string | null): string {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

export default function Combinations() {
  const { toast } = useToast();
  const [combos, setCombos] = useState<Combination[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState<Combination | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Combination | null>(null);

  const fetchCombos = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("pricing_combinations")
      .select("*")
      .order("commodity")
      .order("display_name")
      .order("payment_date");

    if (error) {
      toast({ title: "Erro ao carregar combinações", description: error.message, variant: "destructive" });
    } else {
      setCombos((data as unknown as Combination[]) ?? []);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchCombos(); }, [fetchCombos]);

  const handleCreate = () => {
    setEditingCombo(null);
    setDialogOpen(true);
  };

  const handleEdit = (combo: Combination) => {
    setEditingCombo(combo);
    setDialogOpen(true);
  };

  const handleDuplicate = (combo: Combination) => {
    const { id, created_at, updated_at, ...rest } = combo;
    setEditingCombo({ ...rest, id: "", created_at: "", updated_at: "" } as any);
    setDialogOpen(true);
  };

  const handleToggleActive = async (combo: Combination) => {
    const { error } = await supabase
      .from("pricing_combinations")
      .update({ is_active: !combo.is_active } as any)
      .eq("id", combo.id);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      fetchCombos();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase
      .from("pricing_combinations")
      .delete()
      .eq("id", deleteTarget.id);

    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Combinação excluída" });
      fetchCombos();
    }
    setDeleteTarget(null);
  };

  const handleSave = async (values: Record<string, any>) => {
    if (editingCombo?.id) {
      // Update
      const { error } = await supabase
        .from("pricing_combinations")
        .update(values as any)
        .eq("id", editingCombo.id);
      if (error) {
        toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Combinação atualizada" });
    } else {
      // Insert
      const { error } = await supabase
        .from("pricing_combinations")
        .insert(values as any);
      if (error) {
        toast({ title: "Erro ao criar", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Combinação criada" });
    }
    setDialogOpen(false);
    fetchCombos();
  };

  const soybeanCombos = combos.filter((c) => c.commodity === "soybean");
  const cornCombos = combos.filter((c) => c.commodity === "corn");

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Combinações de Precificação</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie as combinações que compõem a tabela de preços.
          </p>
        </div>
        <Button onClick={handleCreate} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Combinação
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : combos.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center space-y-3">
          <Settings2 className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Nenhuma combinação cadastrada.</p>
          <Button onClick={handleCreate} variant="outline" size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Criar primeira combinação
          </Button>
        </div>
      ) : (
        <>
          {soybeanCombos.length > 0 && (
            <CommoditySection
              label="SOJA"
              icon={<Leaf className="h-4 w-4 text-primary" />}
              headerClass="bg-primary/5"
              combos={soybeanCombos}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onToggle={handleToggleActive}
              onDelete={setDeleteTarget}
            />
          )}
          {cornCombos.length > 0 && (
            <CommoditySection
              label="MILHO"
              icon={<Wheat className="h-4 w-4 text-grain" />}
              headerClass="bg-grain/5"
              combos={cornCombos}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onToggle={handleToggleActive}
              onDelete={setDeleteTarget}
            />
          )}
        </>
      )}

      <CombinationFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialValues={editingCombo ?? undefined}
        onSave={handleSave}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir combinação?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && (
                <>
                  <strong>{deleteTarget.display_name}</strong> — {deleteTarget.commodity === "soybean" ? "Soja" : "Milho"} — Pgto {formatDateBR(deleteTarget.payment_date)}
                  <br />Esta ação não pode ser desfeita.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Section Component ─────────────────────────────────────────────────────

function CommoditySection({
  label, icon, headerClass, combos, onEdit, onDuplicate, onToggle, onDelete,
}: {
  label: string;
  icon: React.ReactNode;
  headerClass: string;
  combos: Combination[];
  onEdit: (c: Combination) => void;
  onDuplicate: (c: Combination) => void;
  onToggle: (c: Combination) => void;
  onDelete: (c: Combination) => void;
}) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className={`flex items-center gap-2 border-b px-5 py-3 ${headerClass}`}>
        {icon}
        <span className="text-sm font-semibold">{label}</span>
        <Badge variant="secondary" className="ml-auto text-xs">{combos.length}</Badge>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs">Praça</TableHead>
              <TableHead className="text-xs">Pgto</TableHead>
              <TableHead className="text-xs">Venda</TableHead>
              <TableHead className="text-xs">Contrato</TableHead>
              <TableHead className="text-xs text-right">Futures</TableHead>
              <TableHead className="text-xs text-right">Basis</TableHead>
              <TableHead className="text-xs text-right">Desconto</TableHead>
              <TableHead className="text-xs text-center">Ativo</TableHead>
              <TableHead className="text-xs text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {combos.map((c, i) => (
              <TableRow
                key={c.id}
                className={`transition-colors hover:bg-accent/50 ${!c.is_active ? "opacity-50" : ""} ${i % 2 === 1 ? "bg-muted/20" : ""}`}
              >
                <TableCell className="text-sm font-medium">{c.display_name}</TableCell>
                <TableCell className="text-sm font-mono">{formatDateBR(c.payment_date)}</TableCell>
                <TableCell className="text-sm font-mono">{formatDateBR(c.sale_date)}</TableCell>
                <TableCell className="text-sm font-mono">{c.ticker}</TableCell>
                <TableCell className="text-sm text-right font-mono">
                  {c.commodity === "soybean" ? c.futures_price.toFixed(4) : formatBRL(c.futures_price)}
                </TableCell>
                <TableCell className="text-sm text-right font-mono">{c.target_basis.toFixed(2)}</TableCell>
                <TableCell className="text-sm text-right font-mono">
                  {c.additional_discount_brl > 0 ? formatBRL(c.additional_discount_brl) : "—"}
                </TableCell>
                <TableCell className="text-center">
                  <button onClick={() => onToggle(c)} className="text-muted-foreground hover:text-foreground transition-colors">
                    {c.is_active ? (
                      <ToggleRight className="h-5 w-5 text-primary" />
                    ) : (
                      <ToggleLeft className="h-5 w-5" />
                    )}
                  </button>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(c)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDuplicate(c)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(c)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
