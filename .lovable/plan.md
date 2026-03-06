

## Plan: Add Hard Delete and Filters to Order History

### 1. Hard delete function in `orderStorage.ts`

Add `permanentlyDeleteOrder(id)` that physically removes the record from localStorage (distinct from the existing soft-delete `deleteOrder` which sets status to CANCELLED).

### 2. Add "Apagar" button in the detail modal (`OrderHistory.tsx`)

- Add a new `AlertDialog`-wrapped "Apagar Permanentemente" button (with Trash2 icon) next to the existing "Cancelar Ordem" button
- Confirmation dialog warning this is irreversible
- On confirm: call `permanentlyDeleteOrder`, close modal, refresh list, show toast

### 3. Filter bar in `OrderHistory.tsx`

Add a row of filter controls between the collapsible header and the order list:

- **Status**: `Select` dropdown with options: Todas, Gerada, Enviada, Confirmada, Vinculada, Cancelada
- **Commodity**: `Select` with: Todas, Soja, Milho
- **Praca**: `Select` with: Todas, Confresa, Matupa, Alta Floresta
- **Data**: Two date inputs (de/ate) for filtering by `generatedAt` range

Apply filters with `useMemo` on the orders array before rendering. Show count of filtered results.

### Files to modify:
1. **`src/lib/orderStorage.ts`** -- add `permanentlyDeleteOrder`
2. **`src/components/OrderHistory.tsx`** -- add filter state, filter UI row, filtered list rendering, and hard delete button in modal

