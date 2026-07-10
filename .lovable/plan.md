## Objetivo
1. Humanizar o vocabulário dos insights do Buddy Institucional (nada de "triaged", "in progress" cru, jargão técnico do banco).
2. Deixar claro para que serve a seção "Ações prioritárias para os próximos 15 dias" e tornar os botões (CTAs) realmente funcionais.

---

## 1. Humanização de termos

### 1a. No prompt da IA (`supabase/functions/institution-predictive-insights/index.ts`)
- Reforçar no system prompt: **proibido usar termos crus do sistema** como `triaged`, `in_progress`, `resolved`, `no_data`, `open`. Sempre traduzir para linguagem humana:
  - `triaged` → "triagem realizada" / "triada"
  - `in_progress` → "em acompanhamento"
  - `resolved` → "resolvida" / "concluída"
  - `open` → "aberta" / "aguardando análise"
  - `no_data` → "sem registros no período"
  - `high/medium/low risk` → "alto risco" / "risco moderado" / "baixo risco"
- Antes de mandar o contexto para a IA, **traduzir as chaves** de `triage_summary.by_status` e `by_risk` para PT-BR humanizado, para a IA não copiar termos técnicos do payload.
- Adicionar instrução: escrever para uma reitora/coordenadora, sem aspas simples em torno de status técnicos.

### 1b. Camada de segurança no frontend (`BuddyInstitutionPanel.tsx`)
- Criar um `humanize(text)` que faz replace defensivo (case-insensitive) de: `triaged`, `in_progress`/`in progress`, `resolved`, `open`, `no_data`/`no data`, `pending`, `high risk`, `medium risk`, `low risk`, e as aspas em torno deles (`'triaged'` → triadas).
- Aplicar em: `headline`, `tldr`, `wow_metric.context`, `celebrate[]`, `insights[].situation/impact/recommendation/narrative/cohort/evidence`, `priority_actions[].title/why/how[]`.
- Substituir também "Coordenação/Psicologia/Professores/Gestão/Comunicação" quando vierem em inglês (fallback).

---

## 2. Seção "Ações prioritárias para os próximos 15 dias"

### 2a. Explicar para que serve
- Adicionar um subtítulo curto abaixo do título do card:
  > "O plano tático que o Buddy sugere para a equipe executar nas próximas duas semanas. Cada ação tem um responsável, um prazo e um atalho para começar agora."
- Adicionar um ícone de ajuda (`HelpCircle`) com tooltip com o mesmo texto para leitura rápida.

### 2b. Tornar os botões funcionais
Hoje `scrollToTab` procura seletores `[data-tab-triagem]`, `[data-tab-notas]`, etc. que **não existem** no `InstitutionPortal.tsx`, então o clique não faz nada.

Correções:
- Reescrever `scrollToTab` para usar o mesmo mecanismo do KPI header (que já funciona): disparar `CustomEvent('institution:navigate-tab', { detail: { tab } })` **e** como fallback clicar no `TabsTrigger` via `[role="tab"][data-value="triagem"]` / valor da aba.
- Mapear `cta_target` para as abas reais do portal:
  - `triagem` → aba "Triagem"
  - `notas` → aba "Notas" (ou Triagem se não existir separadamente)
  - `diario` → aba "Diário Emocional"
  - `metricas` → aba "Métricas" / "Visão Geral"
- Verificar em `InstitutionPortal.tsx` os `value` reais das abas e adicionar `data-tab-value` correspondente nos `TabsTrigger` se preciso, para o seletor funcionar de forma robusta.
- Após navegar, `scrollIntoView` no container `#institution-tabs`.
- Se `cta_target` vier nulo, o botão vira uma ação neutra: rolar para o topo da aba Buddy (ou esconder o botão) — hoje ele fica clicável sem efeito.
- Garantir que o prompt da IA sempre preencha `cta_target` com um dos 4 valores válidos (adicionar validação no backend: se vier algo fora do enum, cair para `triagem`).

### 2c. Feedback visual
- Ao clicar em uma ação, mostrar um toast rápido ("Abrindo Triagem…") para o usuário perceber que algo aconteceu, já que a rolagem para dentro da mesma página pode passar despercebida.

---

## Arquivos afetados
- `supabase/functions/institution-predictive-insights/index.ts` — prompt reforçado, tradução do contexto, validação de `cta_target`.
- `src/components/institution/BuddyInstitutionPanel.tsx` — helper `humanize`, subtítulo + tooltip explicativo, `scrollToTab` funcional, toast.
- `src/pages/InstitutionPortal.tsx` (verificação/ajuste dos `TabsTrigger` para expor `data-tab-value` se ainda não existir).

## Fora de escopo
- Não alterar layout dos cards de insights nem cores/severidades.
- Não mudar a lógica de cache 24h dos insights.
