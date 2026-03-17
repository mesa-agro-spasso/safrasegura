

# Daily Table — Plano de Implementação Final

## Resumo

Criar a página `/daily-table` com 4 seções (Mercado, Parâmetros Globais, Combinações, Resultado), consumindo a Edge Function `run-custom-pricing` já existente. Implementação em 2 etapas.

---

## Ponto 1: usd_forward

`calculateStonexForwardDolRate` usa `spot + days * 0.001163` (carry diário linear). Preciso confirmar se o notebook usa `calculate_stored_ndf_rate` com lógica diferente. Como não consegui parsear o notebook, vou **criar a função `calculateNdfForwardRate`** como wrapper separado que replica exatamente a lógica do notebook. Se for idêntica à StoneX, delega internamente; se diferir, terá sua própria implementação. Isso garante fidelidade sem risco.

## Ponto 2: Edge Function `fetch-market-data`

Criará uma Edge Function que usa Yahoo Finance API (query endpoint público) para buscar:
- USD/BRL spot (`USDBRL=X`)
- Futuros Soja CBOT (tickers gerados: ZSN25, ZSQ25, etc.)
- Futuros Milho CBOT (ZCN25, ZCU25, etc.)

Retorna estrutura organizada:
```json
{
  "usd_brl": { "spot": 5.45 },
  "soybean": [{ "ticker": "ZSN25", "price": 1045.5, "exp_date": "2025-07-14" }],
  "corn_cbot": [{ "ticker": "ZCN25", "price": 445.25, "exp_date": "2025-07-14" }]
}
```

Vencimentos calculados via `estimateCbotExpiration` (já existe na edge function).

## Ponto 3: Defaults 1:1 com notebook

Já conferidos na Edge Function existente (linhas 364-395):
- `shared`: interest_rate=1.4, interest_rate_period="monthly", storage_cost=3.5, storage_cost_type="fixed", reception_cost=0.0, desk_cost_pct=0.003
- `soybean`: brokerage=15.0, shrinkage=0.0, rounding=0.50, risk_free=0.149, sigma=0.35, option_type="call"
- `corn`: brokerage=12.0, shrinkage=0.003, rounding=0.25, risk_free=0.149, sigma=0.35, option_type="call"

Frontend usará esses mesmos valores como defaults.

## Ponto 4: Sem import do banco

Removido do escopo. Combinações são criadas manualmente na grid, sessão por sessão (persistidas via `usePersistentState`).

## Ponto 5: Edições pós-cálculo são locais

Tabelas de resultado e seguros editáveis apenas localmente. Sem re-processamento automático.

## Ponto 6: Vínculo combinação → contrato

Cada combinação mantém referência ao contrato de mercado: `commodity`, `ticker`, `price`, `exp_date`. Ao selecionar ticker na grid, puxa automaticamente esses dados da tabela de mercado.

---

## Arquivos a Criar

| Arquivo | Responsabilidade |
|---------|-----------------|
| `supabase/functions/fetch-market-data/index.ts` | Proxy Yahoo Finance: spot USD/BRL + futuros CBOT |
| `src/lib/market-service.ts` | Chama edge function, parseia, calcula forward e conversões BRL/sc |
| `src/lib/combination-builder.ts` | Merge globals + overrides → payload para `run-custom-pricing` |
| `src/pages/DailyTable.tsx` | Página orquestradora das 4 seções |
| `src/components/daily-table/MarketSection.tsx` | Dólar (spot+forward), tabelas Soja/Milho CBOT (auto), B3 (manual) |
| `src/components/daily-table/FuturesTable.tsx` | Tabela editável genérica com badge auto/manual |
| `src/components/daily-table/GlobalParamsSection.tsx` | Todos os campos de shared/soybean/corn params |
| `src/components/daily-table/CombinationsGrid.tsx` | Grid editável com herança + override expandível |
| `src/components/daily-table/ResultsSection.tsx` | Tabs "Resultados" e "Seguros", editáveis localmente |

## Arquivos a Editar

- `src/App.tsx` — rota `/daily-table`
- `src/components/AppSidebar.tsx` — item "Daily Table"
- `supabase/config.toml` — `[functions.fetch-market-data] verify_jwt = false`

---

## Etapa 1 (esta mensagem)

1. Edge Function `fetch-market-data`
2. `market-service.ts` + `combination-builder.ts`
3. `DailyTable.tsx` (página)
4. `MarketSection.tsx` + `FuturesTable.tsx`
5. `GlobalParamsSection.tsx`
6. Rotas e sidebar

## Etapa 2 (próxima mensagem)

1. `CombinationsGrid.tsx` (grid com herança e overrides)
2. `ResultsSection.tsx` (tabs resultados + seguros, editáveis)
3. Integração final: botão "Gerar Tabela" → `run-custom-pricing` → exibição

