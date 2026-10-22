# Triagem: "Em Risco" e infográfico do funil

## 1. Trocar "Crítico" por "Em Risco"
- Em todas as telas da Triagem, o nome do nível passa de "Crítico" para **"Em Risco"**: cartões, selos, filtros, dicas, frase do Resumo, Prioridades, ações ("Triar alunos em risco"), explicação da criticidade, janelas de triagem e exportações.
- O plural fica "em risco", sem variação (por exemplo "3 em risco ainda não triados").
- Só muda o texto que aparece na tela. A regra de cálculo e os dados continuam iguais.

## 2. Infográfico "Como funciona a triagem"
Fica no Resumo, logo abaixo da frase-resposta, em um bloco que pode ser recolhido. Também pode ser aberto pelo botão "Como funciona a triagem" na linha do topo, em qualquer tela.

```text
 Registros      Classificação     Prioridades       Triagem          Follow-up        Resolução
 do diário  ->  por risco     ->  quem primeiro ->  primeira ação -> acompanhar   ->  caso encerrado
 (alunos)       Em Risco/Alerta/  (motivos)         (Fila)           (datas)          (Concluídos)
                Atenção/Estável
```

- **Visual**: seis etapas em linha, cada uma com ícone, número e cor. As etapas ficam lado a lado no computador e uma embaixo da outra no celular.
- **Textual**: cada etapa tem:
  - uma frase curta explicando o que é (por exemplo, "Prioridades: os alunos mais urgentes, ordenados por motivo: termo grave no diário, Em Risco sem triagem, follow-up vencido");
  - o número real de agora;
  - um botão que leva para a tela correspondente.
- Abaixo das etapas vem um glossário curto:
  - **Triar**: fazer a primeira avaliação e escolher uma ação.
  - **Follow-up**: a data combinada para retomar o contato.
  - **Vencido**: quando essa data já passou.
  - **Resolvido**: o caso foi encerrado.

## Detalhes técnicos
- `StudentTriageTab.tsx`:
  - `riskConfig.critical.label` e os tooltips passam a usar "Em Risco".
  - As strings "crítico(s)" viram "em risco".
- `TriageViews.tsx` (`RISK_META`, textos das ações e do Resumo) e `priorities.ts` (motivos) também passam a usar "Em Risco".
- Revisar `TriageMetricsDashboard`, `TriageDialog`, `BatchTriageDialog` e as exportações.
- Novo componente `TriageFunnel` em `src/features/triage/TriageFunnel.tsx`:
  - Recebe as contagens: alunos com registro, por nível, prioridades, pendentes, follow-ups e resolvidos.
  - Recebe `onNavigate`.
  - Usa só tokens semânticos.
- Salvar na memória que o nível máximo se chama "Em Risco" na Triagem.
