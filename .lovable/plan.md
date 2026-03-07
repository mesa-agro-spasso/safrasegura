

## Plan: Redesign Completo — Safra Segura

### Problema Atual
Tudo em uma pagina so, tema escuro generico, fontes "AI-generated", sem identidade visual. Parece dashboard de desenvolvedor, nao ferramenta profissional de originacao.

### Paleta de Cores (extraida da logo)
- **Verde escuro** `#1B4332` (background de sidebar/header)
- **Verde medio** `#2D6A4F` (botoes primarios, acentos)
- **Verde claro** `#40916C` (hover states)
- **Dourado/Amber** `#C49A1D` (destaques, badges, precos)
- **Branco** `#FAFAF8` (background principal — tema claro)
- **Cinza quente** `#F5F3EF` (cards)
- **Texto** `#1A1A1A` principal, `#6B7280` secundario

### Tipografia
- Remover JetBrains Mono e Inter
- Usar **DM Sans** (corpo — moderna, limpa, profissional) + **IBM Plex Mono** (apenas numeros/precos)
- Fontes maiores, mais respiro, menos "comprimido"

### Estrutura Multi-pagina (React Router)

```text
/              → Precificação (Market Data + Config + Price Table)
/ordens        → Histórico de Ordens (com filtros)
/nova-ordem    → Cadastro Manual (formulario full-page, nao modal)
```

**Navegação lateral (sidebar)** com logo Safra Segura no topo:
- Precificação (icone BarChart3)
- Ordens (icone ClipboardList)
- Cadastrar Ordem (icone PlusCircle)

### Arquivos a Criar/Modificar

1. **Copiar logo** para `src/assets/logo.png`
2. **`src/components/AppSidebar.tsx`** — sidebar com logo, navegacao, tema claro
3. **`src/components/AppLayout.tsx`** — layout wrapper com sidebar + main content
4. **`src/pages/Pricing.tsx`** — move MarketData + ConfigPanel + PriceTable (conteudo atual de Index)
5. **`src/pages/Orders.tsx`** — move OrderHistory como pagina inteira (nao collapsible)
6. **`src/pages/NewOrder.tsx`** — ManualOrderForm como pagina (nao modal)
7. **`src/App.tsx`** — atualizar rotas
8. **`src/pages/Index.tsx`** — redirect para /
9. **`src/index.css`** — nova paleta de cores (tema claro), novas fontes
10. **`tailwind.config.ts`** — atualizar fontFamily
11. **`src/components/OrderHistory.tsx`** — adaptar para funcionar como pagina full-width (remover Collapsible wrapper)
12. **`src/components/ManualOrderForm.tsx`** — adaptar para full-page (remover Dialog wrapper)
13. **`src/components/MarketData.tsx`** — visual refresh com novas cores
14. **`src/components/PriceTable.tsx`** — visual refresh
15. **`src/components/ConfigPanel.tsx`** — visual refresh

### Mudancas Visuais Chave
- **Tema claro** com fundo off-white, cards brancos com sombra sutil
- Sidebar verde escuro com links em branco/dourado
- Botoes primarios em verde medio com hover verde claro
- Precos destacados em dourado
- Cards com `border-radius: 12px`, sombras suaves (`shadow-sm`)
- Inputs com bordas mais sutis, fundo branco
- Tabela de precos com header verde escuro, linhas alternadas
- Badges de status com cores mais suaves e profissionais
- Espacamento generoso (padding 24px em cards, gap-6 entre secoes)

### Nao Muda
- Toda a logica de pricing, order storage, Supabase integration
- DetailModal e OrderGenerator continuam como modais (sao contextuais)
- Estrutura de dados e tipos

