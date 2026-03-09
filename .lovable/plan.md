

## Plano: Persistência de Estado e Tabela com Expiração

### Problema
1. Ao navegar entre páginas, os inputs de Dados de Mercado e Configurações são perdidos (estado local do componente `Pricing` é destruído).
2. A tabela gerada desaparece ao trocar de aba.
3. Não há registro de quando a tabela foi gerada nem controle de expiração.

### Solução

**Persistir estado no `localStorage`** — simples, sem banco de dados, funciona por sessão/dispositivo.

#### 1. Criar hook `usePersistentState<T>(key, defaultValue)`
- Arquivo: `src/hooks/use-persistent-state.ts`
- Wrapper sobre `useState` que lê do `localStorage` na inicialização e salva a cada mudança via `useEffect`.
- Serializa/deserializa com JSON.

#### 2. Atualizar `Pricing.tsx`
- Substituir `useState` por `usePersistentState` para:
  - `config` (ConfigState) → key `"pricing_config"`
  - `results` (PricingResult[]) → key `"pricing_results"`
  - `marketValues` (MarketDataValues) → key `"pricing_market"`
- Adicionar campo `generatedAt: string | null` persistido → key `"pricing_generated_at"`
- Ao gerar tabela, salvar `new Date().toISOString()` em `generatedAt`.

#### 3. Atualizar `MarketData.tsx`
- Receber `initialValues` como prop opcional para restaurar os inputs do último preenchimento.
- O estado interno do formulário inicia com `initialValues ?? defaults`.
- Adicionar `onChange` callback que o `Pricing` usa para salvar os valores parciais no localStorage em tempo real (a cada keystroke ou blur).

#### 4. Lógica de expiração na `PriceTable`
- `Pricing.tsx` calcula se `generatedAt` + 10h < agora.
- Se expirado: mostrar mensagem "Tabela expirada — gerada em DD/MM às HH:MM. Gere uma nova tabela." em vez da tabela.
- Se válido: mostrar a tabela + label "Gerada em DD/MM/AAAA às HH:MM".

### Arquivos a modificar
| Arquivo | Mudança |
|---|---|
| `src/hooks/use-persistent-state.ts` | Criar hook genérico |
| `src/pages/Pricing.tsx` | Usar hook persistente para config, market, results, generatedAt; lógica de expiração |
| `src/components/MarketData.tsx` | Aceitar `initialValues` e `onChange` props |
| `src/components/PriceTable.tsx` | Mostrar timestamp de geração no header |

### O que não muda
- Lógica de pricing, ConfigPanel, ordens, banco de dados.
- ConfigPanel já recebe `config` e `onChange` do pai — basta persistir no pai.

