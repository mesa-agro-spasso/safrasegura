

# Plano: Corrigir Praça (dropdown) e Dialog de nova combinação

## Problema 1: Campo Praça
Atualmente é um `<Input>` de texto livre (linha 199). Deve ser um `<Select>` com 3 opções fixas: Confresa, Matupá, Alta Floresta. Ao selecionar, preenche `display_name` e `warehouse_id` automaticamente.

## Problema 2: Adicionar combinação via Dialog
O botão "Adicionar" insere uma linha vazia direto na grid. Deve abrir um Dialog de preenchimento antes, e só adicionar à grid após confirmação.

## Alterações em `CombinationsGrid.tsx`

1. **Definir constante `WAREHOUSES`**:
```ts
const WAREHOUSES = [
  { id: "confresa", label: "Confresa" },
  { id: "matupa", label: "Matupá" },
  { id: "alta_floresta", label: "Alta Floresta" },
];
```

2. **Substituir o `<Input>` de Praça** (linhas 198-206) por um `<Select>` que usa `warehouse_id` como value, e ao mudar seta `warehouse_id` e `display_name`.

3. **Adicionar estado de dialog** (`dialogOpen`, `newRowForm`) e ao clicar "Adicionar", abrir um Dialog com os campos essenciais (commodity, praça, ticker, datas, basis, desconto). Ao confirmar, insere a nova row na grid.

4. **Usar o mesmo Dialog para a grid inline** — a linha na tabela fica apenas de leitura/edição rápida, praça continua como Select.

## Arquivos modificados
- `src/components/daily-table/CombinationsGrid.tsx` — todas as mudanças concentradas aqui

