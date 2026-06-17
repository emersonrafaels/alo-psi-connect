## Ajustes no ISEU-RBE e na visualização das respostas

### 1. Só calcular ISEU-RBE quando TODAS as escalas ativas estiverem respondidas

**Comportamento atual:** o ISEU-RBE é recalculado a cada resposta enviada, mesmo que o usuário só tenha respondido 1 ou 2 escalas. Isso gera um índice parcial enganoso.

**Novo comportamento:**
- A função `compute_iseu_score` (Postgres) passará a verificar se o usuário possui pelo menos uma resposta para **cada escala ativa** (WHO-5, MHC-SF, PHQ-9, GAD-7, PSS-10, ISI). Enquanto faltar qualquer uma, a função **não insere** em `iseu_scores` e retorna `null`.
- Edge function `submit-scale-response`: continua chamando `compute_iseu_score`, mas trata `null` como "ainda incompleto" e devolve no payload `{ iseu: null, missing_scales: [...] }` para o frontend exibir feedback.
- Frontend `/minhas-emocoes`:
  - Card "ISEU-RBE atual": quando não houver ISEU calculado, mostrar mensagem "Responda todas as escalas para calcular seu ISEU-RBE" + lista das escalas que faltam, em vez de "—".
  - Gráfico "Evolução do ISEU-RBE": exibir estado vazio com a mesma mensagem quando `iseu` estiver vazio.
- Frontend `/escalas`: nos cards das escalas ainda não respondidas, manter o destaque atual; adicionar um aviso global no topo: "Faltam X escalas para calcular seu ISEU-RBE" enquanto houver pendências.

### 2. Remover a coluna/indicador "Saúde (0–100)" — exibir apenas a pontuação

**Comportamento atual:** várias telas mostram o `normalized_score` (0–100) rotulado como "Saúde" ou "Índice de saúde".

**Mudanças no frontend (apenas apresentação, sem alterar o cálculo nem o banco):**

- `src/pages/MyEmotions.tsx`:
  - Tabela "Histórico de aplicações": remover a coluna **"Saúde (0–100)"**. Manter Data, Escala, **Pontuação**, Severidade, Variação.
  - Coluna "Variação": passar a calcular o delta sobre `raw_score` (pontuação), não sobre `normalized_score`.
  - Cards de sparkline por escala: trocar o número grande e o sparkline para usarem `raw_score` (pontuação bruta), e remover o rótulo "Índice de saúde". O eixo Y do sparkline deixa de ser fixo 0–100 e passa a auto-ajustar. A cor da linha deixa de depender da faixa do ISEU (verde/amarelo/laranja/vermelho) e passa a usar `hsl(var(--primary))`, já que a pontuação bruta não é comparável entre escalas.
- `src/pages/ScaleResponse.tsx`: na tela de resultado individual, ocultar o valor normalizado (0–100) e exibir apenas a pontuação bruta + severidade + (quando houver) subescalas.

O `normalized_score` continua sendo calculado e salvo no banco — é insumo do ISEU-RBE — apenas deixa de aparecer na UI do paciente.

### Arquivos afetados

- Migração SQL: redefinir `public.compute_iseu_score(_user_id uuid)` com verificação de completude.
- `supabase/functions/submit-scale-response/index.ts` — retornar `missing_scales` quando ISEU ficar nulo.
- `src/hooks/useEmotionalScales.tsx` — tipos do retorno, helper `missingScales`.
- `src/pages/MyEmotions.tsx` — remoção da coluna, ajuste de sparklines, estados vazios.
- `src/pages/ScaleResponse.tsx` — ocultar normalized.
- `src/pages/EmotionalScales.tsx` — banner "faltam X escalas".

### Fora do escopo

- Nenhuma alteração de pesos, severidades ou conteúdo das escalas.
- O cálculo interno (`normalized_score`, pesos, subescalas) permanece igual.
