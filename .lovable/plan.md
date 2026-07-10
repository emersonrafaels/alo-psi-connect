# Redesign — Aba Diário Emocional (Portal Institucional)

Arquivo principal: `src/components/institution/InstitutionWellbeingDashboard.tsx`
Componente auxiliar: `src/components/institutional/InstitutionMoodAggregates.tsx`

## Problemas atuais

1. **Ordem confusa** — ao clicar em "Diário Emocional", o card de dados agregados anônimos existe mas fica competindo com status badge, alertas, LGPD e notas antes do usuário absorver o resumo.
2. **Duplicação de métricas** — Humor, Ansiedade, Energia e Sono aparecem em dois lugares:
   - `InstitutionMoodAggregates` (bloco anonimizado)
   - Seção "Métricas de Bem-Estar" (cards com Progress)
   Mesmos números, visualizações diferentes, sem valor incremental.
3. **Falta narrativa institucional** — uma coordenação de curso quer responder: *"Como está o clima emocional agora? Onde acender o farol? O que mudou? Vale intervir?"* — hoje precisa varrer 6 blocos parecidos para juntar a resposta.
4. **Alerta e status badge redundantes** — o `Badge` de status ("Alerta / Bem-estar Saudável") e o `Alert` colorido logo abaixo dizem a mesma coisa.

## Nova estrutura (top → bottom)

```text
┌─────────────────────────────────────────────────────────┐
│ 1. HEADER COMPACTO                                       │
│    Período + Badge de status (sem Alert duplicado)      │
├─────────────────────────────────────────────────────────┤
│ 2. RESUMO ANONIMIZADO (InstitutionMoodAggregates)       │
│    "O que a instituição pode ver com privacidade"       │
│    → participantes • registros • 5 médias • risco       │
├─────────────────────────────────────────────────────────┤
│ 3. ALERTA ACIONÁVEL (só se houver)                       │
│    N alunos abaixo de 3 → CTA "Ir para Triagem"         │
├─────────────────────────────────────────────────────────┤
│ 4. CONTEXTO INSTITUCIONAL                                │
│    Chips de notas ativas (provas, semana de calouros…)  │
├─────────────────────────────────────────────────────────┤
│ 5. ENGAJAMENTO DO PERÍODO                                │
│    2 cards: Participantes + Registros                   │
│    + mini bar chart "Registros por dia"                 │
├─────────────────────────────────────────────────────────┤
│ 6. EVOLUÇÃO EMOCIONAL                                    │
│    Seletor (Humor/Ansiedade/Energia/Sono) + gráfico     │
│    + delta % vs período anterior + tendência            │
├─────────────────────────────────────────────────────────┤
│ 7. INSIGHTS INTELIGENTES (colapsável, já existe)        │
├─────────────────────────────────────────────────────────┤
│ 8. ANÁLISE VISUAL (abas Evolução/Multi-Camadas/IA)      │
├─────────────────────────────────────────────────────────┤
│ 9. LGPD (rodapé, colapsável)                             │
└─────────────────────────────────────────────────────────┘
```

## Mudanças concretas

### 1. Reordenar o JSX de `InstitutionWellbeingDashboard.tsx`
- Mover `InstitutionMoodAggregates` para logo abaixo do header de período (é a peça mais informativa e ancora a leitura).
- Mover `LGPDNotice` para o rodapé, versão colapsada por padrão.
- Remover o `Badge` de status do header — manter só o `Alert` colorido (mais visível, com CTA).

### 2. Eliminar duplicação
- **Remover completamente a seção "Métricas de Bem-Estar"** (linhas 392-481). As mesmas 4 médias já vivem em `InstitutionMoodAggregates` de forma anonimizada. Manter só uma fonte de verdade.
- A tendência (%) e o Progress que hoje ficam nesses cards migram para o card "Evolução Emocional" (item 6), onde fazem sentido junto do gráfico.

### 3. Consolidar "Visão Geral"
- Reduzir de 4 para 2 cards (Participantes, Registros). Tendência e Alertas viram parte visual do gráfico de evolução e do bloco de alerta acionável — não são "métricas" a repetir aqui.
- Manter os cards clicáveis abrindo o `WellbeingMetricDialog`.

### 4. Alerta acionável com CTA
- No `Alert` de "Atenção Necessária", adicionar botão **"Ver triagem"** que troca `activeTab` na página pai. Prop nova opcional `onNavigateToTriage?: () => void` no dashboard; no `InstitutionPortal.tsx` passamos `() => setActiveTab('triage')`.

### 5. Card "Evolução Emocional" (novo container)
- Consolida: seletor de métrica + gráfico diário (já existente nas linhas 353-386) + delta vs período anterior + label de tendência. Ao invés de um mini gráfico de "Registros por dia" e outro de métrica lado a lado, uma linha do tempo mais generosa (altura 240px) com o delta em destaque no topo.
- "Registros por dia" desce para o card "Engajamento" (item 5), próximo do card de Registros.

### 6. Copy institucional
- Título do card anonimizado: "Panorama emocional dos alunos".
- Subtítulo: "Dados agregados protegidos por privacidade (mínimo 5 alunos por período)".
- Cada bloco ganha uma pergunta-âncora no subtítulo, no tom da coordenação:
  - Engajamento → "Quantos alunos estão usando o diário?"
  - Evolução → "O clima está melhorando ou piorando?"
  - Insights → "O que o sistema já percebeu por você?"

## Escopo fora do plano

- Não mexer na RPC `get_institution_mood_aggregates`, RLS, tipos de dados nem no `useInstitutionWellbeing`.
- Não alterar os componentes de gráfico (`WellbeingTimelineCharts`, `WellbeingLayeredChart`, `PredictiveInsightsPanel`).
- Não alterar as abas do Portal (Visão Geral, Cupons, Métricas etc.) — só o conteúdo interno da aba Diário Emocional.
- Sem novas dependências.

## Detalhes técnicos

- `InstitutionPortal.tsx` (linha 372-386): passar `onNavigateToTriage={() => setActiveTab('triage')}` para `InstitutionWellbeingDashboard`.
- `InstitutionWellbeingDashboard.tsx`: adicionar prop opcional; usar no `Alert` de atenção como `<Button variant="outline" size="sm" onClick={onNavigateToTriage}>Ver triagem</Button>`.
- Remover imports não usados após a limpeza (`Progress`, `Brain`, `Moon`, `Zap`, `getMoodColor`, `getMoodLabel` se ficarem órfãos).
- Manter `TooltipProvider` e o `WellbeingMetricDialog` já existente.
