

## Plano: Campo "Data da Operação" com confirmação de alteração

### Mudanças

**1. `src/lib/orderRecord.ts`**
- Adicionar `operationDate: string` à interface (formato `yyyy-MM-dd`)

**2. `src/pages/NewOrder.tsx`**
- Adicionar estado `operationDate` inicializado com `new Date()` (data de hoje)
- Adicionar DatePicker (Popover + Calendar) no topo do formulário, na mesma linha de Commodity/Praça ou logo abaixo
- Ao selecionar uma data diferente de hoje, abrir um **AlertDialog** perguntando: "A data selecionada é diferente de hoje. Deseja registrar esta ordem com a data DD/MM/AAAA?"
  - Se confirmar → atualiza o estado
  - Se cancelar → mantém a data atual
- Incluir `operationDate` no record salvo (`format(date, "yyyy-MM-dd")`)
- Adicionar ao `isValid()` (campo obrigatório)

### Componentes utilizados
- `Calendar` + `Popover` (já existem no projeto) para o DatePicker
- `AlertDialog` (já existe) para a confirmação de mudança de data
- `date-fns` (já instalado) para formatação

