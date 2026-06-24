# Escalas no menu + experiência pública

## Objetivo
Tornar as Escalas Emocionais acessíveis a qualquer visitante (logado ou não). Visitantes podem responder e ver o resultado de cada escala, mas para salvar histórico e calcular o ISEU-RBE precisam se autenticar.

## 1. Item "Escalas" no menu principal
Arquivo: `src/components/ui/header.tsx`

- Adicionar entrada em `allNavigation` (entre "Diário Emocional" e "Blog"):
  - `{ name: "Escalas", href: buildTenantPath(tenantSlug, '/escalas'), module: null }`
- Sem flag de módulo (sempre visível, igual a "Práticas").
- Aplicar mesmo tratamento no menu mobile (mesmo array é reusado abaixo no arquivo).

## 2. Página de listagem acessível a guests
Arquivo: `src/pages/EmotionalScales.tsx`

- Remover o redirect `if (!authLoading && !user) navigate(/auth)`.
- Quando não houver `user`:
  - Não consultar `useLatestResponseByScale` nem `useMissingIseuScales` (hooks já têm `enabled: !!user`, ok).
  - Esconder botões "Ver meu histórico" e o bloco "Faltam X escalas para ISEU".
  - Mostrar um banner no topo: "Você está explorando como visitante. Faça login para salvar seu histórico e calcular seu ISEU-RBE." com botão "Entrar / Cadastrar" → `/auth`.
- Botão "Responder agora" de cada card permanece — navega para `/escalas/:code` normalmente (sem exigir login).

## 3. Página de resposta acessível a guests com scoring local
Arquivo: `src/pages/ScaleResponse.tsx` + novo `src/utils/scaleScoring.ts`

### 3a. Novo util de scoring
Criar `src/utils/scaleScoring.ts` portando a lógica do edge function `submit-scale-response`:
- `computeScaleResult(scale, answers)` retornando `{ raw_score, normalized_score, severity, subscale_scores }`.
- Inclui reverso de itens, normalização por direção (positive/inverse), subescalas e regras de severidade por código (WHO5, PHQ9, GAD7, PSS10, ISI, MHCSF).
- Esse util será usado apenas no caminho guest; usuários autenticados continuam chamando o edge function (mantém auditoria/RLS + ISEU).

### 3b. Ajustes em `ScaleResponse.tsx`
- Remover o redirect de auth.
- `useUserScaleResponses` já é `enabled: !!user`, então `previous` fica indefinido para guests (ok).
- `handleSubmit`:
  - Se `user` existe → fluxo atual (chama `submit.mutateAsync`).
  - Se guest → calcular `computeScaleResult` localmente, montar um objeto `result` no mesmo formato esperado pela tela de resultado e setar via `setResult`.
- Tela de resultado para guests:
  - Mostrar pontuação, severidade, subescalas (gráfico) e interpretação MHCSF normalmente — tudo já é renderizado a partir de `result.response.*`.
  - Substituir o bloco "ISEU-RBE atualizado" / "Faltam X escalas" por um **CTA destacado**: card com borda destacada, título "Quer acompanhar sua evolução?", texto curto explicando que ao se cadastrar o resultado é salvo, entra no histórico e contribui para o cálculo do ISEU-RBE. Botões "Criar conta / Entrar" → `/auth` e "Responder outra escala" → `/escalas`.
  - Esconder o botão "Ver meu histórico" e a comparação com aplicação anterior (não existem para guest).

## 4. Telemetria / sem mudanças de backend
- Nenhuma migração de banco.
- Nenhuma alteração no edge function (continua exigindo auth para persistir).
- Tabela `emotional_scales` / `emotional_scale_items` já é legível por anon (a página atual lista escalas via Supabase client com a anon key; se o `select` falhar para guest descobriremos no teste e adicionaremos um grant — não previsto agora).

## Out of scope
- Salvar respostas de guest em localStorage para "trazer junto" no cadastro.
- Mudar layout/visual além do banner e do CTA final.
- Adicionar escalas novas ou alterar scoring.

## Validação
- Logout → abrir `/escalas`, abrir uma escala, responder e ver resultado + CTA de login.
- Login → fluxo segue idêntico (persistência + ISEU).
