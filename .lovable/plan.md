

# Plano: Reorganizar menu — Legado + Tabela de Preços

## O que muda

### Sidebar (`AppSidebar.tsx`)
- Menu principal com 2 itens: **Parâmetros** (`/parametros`) e **Tabela de Preços** (`/tabela-precos`, renomeado de Daily Table)
- Novo grupo colapsável **Legado** com 4 itens: Precificação (`/`), Combinações (`/combinacoes`), Ordens (`/ordens`), Nova Ordem (`/nova-ordem`)
- Usar `SidebarGroupLabel` + `Collapsible` para o grupo Legado (começa fechado)

### Rotas (`App.tsx`)
- Renomear rota `/daily-table` → `/tabela-precos`
- Rota padrão `/` continua apontando para Pricing (legado)
- Demais rotas mantidas

### `DailyTable.tsx`
- Atualizar título de "Daily Table" para "Tabela de Preços"
- Atualizar link de volta para Parâmetros se necessário

### `Parameters.tsx`
- Atualizar navegação pós-geração de `/daily-table` para `/tabela-precos`

### Arquivos modificados
- `src/components/AppSidebar.tsx`
- `src/App.tsx`
- `src/pages/DailyTable.tsx`
- `src/pages/Parameters.tsx`

