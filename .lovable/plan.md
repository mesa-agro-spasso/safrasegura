

## Plan: 6 Corrections and Improvements to ManualOrderForm and OrderHistory

### 1. Standardize decimal separators (comma for BRL, dot for USD)

**ManualOrderForm placeholders:**
- BRL fields (preço líquido, bruto, basis, custos em R$/sc): use comma — `"115,00"`, `"2,50"`
- USD fields (futuro soja, câmbio, corretagem/contrato): use dot — `"1050.00"`, `"5.7500"`
- The `parseNum` function already handles both (replaces `,` with `.`), so no logic change needed — only placeholder and label consistency.

### 2. Remove extra warehouses

Remove "Guarantã do Norte" and "Novo Mundo" from the `WAREHOUSES` array in `ManualOrderForm.tsx`, keeping only Confresa, Matupá, and Alta Floresta (matching `ConfigPanel.tsx`).

### 3. Add units to cost labels

Update cost field labels in `ManualOrderForm.tsx`:
- "Armazenagem" → "Armazenagem (R$/sc)"
- "Financeiro" → "Financeiro (R$/sc)"
- "Corretagem" → "Corretagem (R$/sc)"
- "Desk" → "Desk (R$/sc)"

### 4. Futures price: auto-detect cents vs full dollars

For soybean (CBOT), the futures price is quoted in **cents USD/bushel** on exchanges (e.g., 1050 = $10.50/bu). The system internally uses USD/bushel.

In `ManualOrderForm.tsx`, add logic in `handleSave`:
- If the user enters a value >= 100, assume it's in **cents** and divide by 100
- If < 100, assume it's already in **USD/bushel**
- Update the label to: `"Futuro (¢/bu ou USD/bu)"`
- Store the normalized USD/bu value in `futuresPrice`

For corn (B3), keep as-is (BRL/saca).

### 5. Add "Quantidade de Dólar" (notional USD) field

Add a new field `notionalUsd` to the form, auto-calculated as:
`(precoLiquido × volumeSacas) / câmbio`

- Show as a pre-filled field that the user can override
- Use `useMemo` or inline calculation to keep it updated as net price, volume, or exchange rate change
- Store in `OrderRecord.legs[0].notionalUsd` for the NDF leg
- Add a second leg of type `"ndf"` with direction `"sell"`, the notional, and the exchange rate
- Also display in `OrderHistory` detail modal

**Files:** `ManualOrderForm.tsx`, and add `notionalUsd` display in `OrderHistory.tsx` detail modal.

### 6. Add "Observações" (notes) field to confirmed orders in history

In `OrderHistory.tsx` detail modal:
- When status is `BROKER_CONFIRMED`, show an editable `Textarea` for notes
- Add a "Salvar" button that persists to `orderStorage`
- Add `updateOrderNotes(id, notes)` function to `orderStorage.ts`

Also in `ManualOrderForm.tsx`:
- Add an "Observações" textarea field (currently hardcoded as `"Cadastro manual"`)

### Files to modify:
1. **`src/components/ManualOrderForm.tsx`** — items 1-5 (warehouses, placeholders, units, cents detection, notional USD, notes field)
2. **`src/components/OrderHistory.tsx`** — items 5-6 (show notional USD, editable notes for confirmed orders)
3. **`src/lib/orderStorage.ts`** — item 6 (add `updateOrderNotes` function)

