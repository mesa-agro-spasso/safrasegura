

# Plano: Gerar Tabela (Preço + Seguro)

## Visão geral
O botão "Gerar Tabela" em `/parametros` vai:
1. Converter as combinações da grid em payloads para a edge function `run-custom-pricing`
2. Chamar a edge function
3. Salvar os resultados no banco e marcar `generated_at`
4. Navegar para `/daily-table` que exibirá os resultados em duas abas: **Preço** e **Seguro**

## Alterações

### 1. Banco de dados
- Adicionar coluna `results jsonb default '[]'` na tabela `daily_table_params` para persistir os resultados gerados.

### 2. `supabase/config.toml`
- Adicionar `verify_jwt = false` para `run-custom-pricing`.

### 3. `src/lib/params-storage.ts`
- Adicionar campo `results` no `SavedParams`.
- Nova função `saveResults(results)` que salva o JSONB e atualiza `generated_at`.

### 4. `src/pages/Parameters.tsx` — `handleGenerate`
- Montar payloads a partir de `combinations` + `globalParams` + `marketData` (exchange_rate do mercado).
- Chamar `supabase.functions.invoke("run-custom-pricing", { body: { combinations: payloads } })`.
- Salvar resultados via `saveResults()`.
- Navegar para `/daily-table`.

### 5. `src/pages/DailyTable.tsx` — Exibir resultados
- Carregar `results` do banco ao montar.
- Duas abas (Tabs):
  - **Preço**: Tabela com colunas Praça, Commodity, Ticker, Pagamento, Preço Bruto, Preço Líq., Basis Comprado, Basis BE, Custos Total.
  - **Seguro**: Tabela com colunas Praça, Commodity, Ticker, e para cada nível (ATM, OTM 5%, OTM 10%): Strike, Prêmio, Custo Total.
- Mantém alerta de defasagem já existente.

### Arquivos modificados
- `supabase/config.toml` (add run-custom-pricing config)
- Nova migração SQL (add `results` column)
- `src/lib/params-storage.ts`
- `src/pages/Parameters.tsx`
- `src/pages/DailyTable.tsx`

