# Triagem: menu lateral com telas próprias e foco em "o que fazer agora"

## Problema
Hoje a Triagem mostra tudo numa página só, um bloco embaixo do outro. As quatro opções do menu lateral só rolam a tela até pontos muito próximos entre si. A opção "Follow-ups vencidos" leva para um ponto vazio. Por isso parece que todas mostram a mesma coisa.

## Como vai ficar
O menu lateral passa a trocar de tela, como já acontece no Comparador. A opção ativa fica destacada, cada tela tem um título e uma frase explicando para que serve, e a tela volta ao topo quando você troca de opção.

1. **Resumo (tela inicial)**
   - Uma frase-resposta no topo, por exemplo: "12 alunos precisam de atenção hoje: 3 críticos ainda não triados e 4 follow-ups vencidos."
   - Quatro cartões grandes por nível de risco (Crítico, Alerta, Atenção, Estável) mais "Sem dados". Cada cartão mostra quantos alunos estão no nível e quantos ainda não foram triados. Ao clicar, abre a Fila já filtrada por aquele nível.
   - Bloco **"O que fazer agora"** com até 4 ações em ordem de prioridade, cada uma com um botão:
     - Triar alunos críticos
     - Resolver follow-ups vencidos
     - Ver alunos com palavra crítica no diário
     - Revisar alunos sem registros
   - Mostra só as ações que têm alunos. Se não houver nenhuma, aparece "Tudo em dia".
2. **Prioridades**
   - Até 10 alunos em ordem de urgência: palavra crítica grave, depois Crítico, Alerta, follow-up vencido e tendência de piora.
   - Cada aluno mostra o motivo em linguagem simples (por exemplo "Humor caiu 30% em 15 dias") e o botão "Triar".
3. **Follow-ups**
   - Lista própria só com os vencidos e os que vencem nos próximos 7 dias.
   - Cada um mostra há quantos dias está vencido e tem as ações "Registrar contato" e "Resolver".
4. **Fila de triagem**
   - A lista atual (abas, busca, filtro, "Ver mais"), sem os blocos de cima repetidos.
   - Recebe o filtro que vier do Resumo ou de Prioridades.
5. **Métricas**
   - Os gráficos atuais, com uma legenda curta explicando cada número.

Também entra:
- Uma linha fixa no topo com o período analisado e "Atualizado às HH:MM".
- Um botão "Como a criticidade é calculada" que abre uma explicação curta, incluindo as palavras críticas.

Tudo continua anônimo (`Aluno #N`) e as barras de carregamento são mantidas.

## Detalhes técnicos
- `src/pages/institution/InstitutionTriage.tsx`:
  - A opção ativa fica na URL (`?view=resumo|prioridades|followups|fila|metricas`), em vez de rolar a página.
  - Faz `scrollTo(0,0)` ao trocar de opção.
- `StudentTriageTab.tsx`:
  - Recebe a prop `view` e o filtro inicial (`initialRisk`, `initialTab`) e renderiza só o bloco daquela opção.
  - Os blocos vão para componentes novos em `src/features/triage/` (`TriageSummary`, `TriageActions`, `TriagePriorities`, `TriageFollowUps`), para diminuir o arquivo de 1.570 linhas.
- Função pura `buildPriorities` / `buildActions` em `src/features/triage/priorities.ts`, com teste: grave primeiro, depois crítico não triado, depois follow-up vencido.
- Dados: usa os mesmos hooks de hoje, sem mudar o banco.
