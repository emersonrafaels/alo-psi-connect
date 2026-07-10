## Objetivo

Transformar as métricas do Portal Institucional em uma narrativa clara para gestores de ensino. Hoje o alerta principal diz apenas "33 alunos reportaram humor abaixo de 3" e não conversa com os números reais da triagem (6 crítico + 11 alerta + 5 atenção = 22 casos abertos). Vamos alinhar os dados e escrever cada bloco em três camadas: **Situação → Impacto → Ação sugerida**.

## Escopo (apenas texto/UI, sem mudança de negócio)

### 1. Novo bloco "Panorama do período" (`InstitutionWellbeingDashboard.tsx`)

Substitui o alerta laranja atual. É o primeiro parágrafo que o gestor lê:

> Nos últimos **90 dias**, **28 de 33 alunos (85%)** registraram no diário emocional — **414 check-ins** no total.
> Humor médio: **3,2/5** (↑ 8% vs. período anterior). Ansiedade: **2,9/5** (estável).
>
> **Como estão distribuídos hoje:**
> • 🟢 18 alunos saudáveis
> • 🟡 5 em atenção
> • 🟠 11 em alerta
> • 🔴 6 em nível crítico *(prioridade da semana)*
>
> **Sugestões:** iniciar triagem dos 6 críticos · agendar acolhimento em grupo para alertas · celebrar avanços nos saudáveis.

CTAs: **"Ver 6 críticos"**, **"Ver 22 casos abertos"**, **"Exportar relatório da semana"**.

- Os números da distribuição vêm do mesmo hook `useStudentTriage` já usado em `StudentTriageTab.tsx`, garantindo consistência entre abas.
- Se não houver casos abertos, mostra a versão verde com contexto ("Todos os 33 alunos estão em faixa saudável há X dias — mantenha o ritmo de check-ins").

### 2. Reescrever os insights de `useInstitutionWellbeing.tsx`

Cada card de insight passa a seguir o padrão narrativo:

| Antes | Depois |
|---|---|
| "Bem-estar bom — Média de humor: 3,5/5 com 414 registros de 28 alunos." | "Humor coletivo bom (3,5/5). 85% da turma engajada nos últimos 90 dias — acima da média institucional (72%)." |
| "Ansiedade elevada — A média de ansiedade está em 3,4/5. Considere ações preventivas." | "Ansiedade acima do saudável (3,4/5). Pico ocorreu na semana de {data}. Sugestão: prática guiada de respiração e revisão de carga acadêmica." |
| "Atenção requerida — 8 alunos (28%) apresentaram humor abaixo no período." | "8 alunos (28%) mantiveram humor abaixo de 3. Destes, 6 já estão em triagem crítica e 2 ainda não foram avaliados — [Priorizar avaliação]." |

Cada insight ganha um campo opcional `action: { label, target }` para virar CTA clicável (roteia para triagem/relatório).

### 3. Banner de topo da triagem (`StudentTriageTab.tsx`, linha ~865)

Hoje: "6 alunos em nível crítico aguardando triagem." Passa a mostrar a pilha completa e o que fazer com cada faixa:

> **22 alunos precisam da sua atenção esta semana**
> 🔴 6 críticos — ação imediata (contato hoje)
> 🟠 11 em alerta — acolhimento em até 7 dias
> 🟡 5 em atenção — monitorar próximo check-in
>
> [Começar pelos críticos] [Ver todos]

### 4. Consistência de linguagem

- Padronizar "aluno" (não "paciente"), concordância verbal ("apresentaram" no plural).
- "Melhor dia" e demais datas sempre com data completa `dd/mm` além do dia da semana.
- Remover jargão ("humor abaixo de 3" → "humor abaixo do saudável (nota < 3)").

## Arquivos afetados

- `src/components/institution/InstitutionWellbeingDashboard.tsx` — novo bloco Panorama, consumindo `useStudentTriage`.
- `src/hooks/useInstitutionWellbeing.tsx` — reescrita dos insights + novo campo `action`.
- `src/components/institution/WellbeingInsights.tsx` — renderizar CTA quando `action` existir.
- `src/components/institution/StudentTriageTab.tsx` — banner topo estratificado.
- (opcional) novo `src/components/institution/PanoramaCard.tsx` para isolar o bloco narrativo.

## Fora de escopo

- Nenhuma mudança em Edge Functions, schema Supabase, ou lógica de risco.
- Sem novos gráficos — só melhoria de texto, hierarquia e reutilização de dados já existentes.