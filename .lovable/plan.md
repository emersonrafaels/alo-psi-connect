

## Tooltips Explicativos na Aba de Triagem

### O que sera adicionado

Tooltips com icone de interrogacao (?) nos principais elementos da aba Triagem, para que gestores leigos entendam cada informacao ao passar o mouse.

### Tooltips planejados

**Cards de resumo (topo - 5 cards de risco):**
Cada card ja mostra o nivel (Critico, Alerta, etc.) e a contagem. Sera adicionado um tooltip no label de cada card:
- **Critico**: "Alunos com humor muito baixo (<=1.5), ansiedade muito alta (>=4.5) ou queda brusca no humor (>40%). Necessitam atencao imediata."
- **Alerta**: "Alunos com humor baixo (<=2.5), ansiedade elevada (>=3.5) ou energia muito baixa. Recomenda-se acompanhamento."
- **Atencao**: "Alunos com indicadores moderadamente preocupantes. Vale monitorar de perto."
- **Saudavel**: "Alunos com todos os indicadores dentro da faixa esperada."
- **Sem Dados**: "Alunos que nao registraram diarios emocionais nos ultimos 14 dias."

**Metricas individuais dos alunos (ja existem tooltips basicos - serao enriquecidos):**
Os tooltips atuais dizem apenas "Media de humor nos ultimos 14 dias (1-5)". Serao melhorados com explicacoes mais acessiveis:
- **Humor**: "Como o aluno avaliou seu humor (1=muito mal, 5=muito bem). Abaixo de 3 merece atencao."
- **Ansiedade**: "Nivel de ansiedade reportado (1=tranquilo, 5=muito ansioso). Acima de 3.5 e preocupante."
- **Energia**: "Nivel de energia do aluno (1=sem energia, 5=muita energia). Valores baixos podem indicar cansaco."
- **Sono**: "Qualidade do sono (1=pessimo, 5=otimo). Sono ruim afeta humor e concentracao."

**Sparkline (mini-grafico):**
O tooltip atual diz "Tendencia de humor (14 dias)". Sera melhorado para: "Mini-grafico mostrando a evolucao do humor nos ultimos 14 dias. Verde=bom, amarelo=moderado, vermelho=preocupante."

**Tendencia (seta):**
Adicionar tooltip na seta de tendencia: "Variacao percentual do humor entre a primeira e segunda semana. Seta vermelha=piora, verde=melhora."

**Contagem de registros:**
Adicionar tooltip: "Quantidade de diarios emocionais preenchidos nos ultimos 14 dias. Mais registros = analise mais confiavel."

**Historico de Triagens:**
Adicionar tooltips nos botoes "Em andamento" e "Resolver" e no badge de status:
- **Em andamento**: "Marca esta triagem como em acompanhamento ativo."
- **Resolver**: "Marca esta triagem como concluida."
- **Follow-up (relogio)**: tooltip ja existente implicitamente, sera adicionado: "Data limite para acompanhamento. Vermelho=vencido, amarelo=proximo do prazo."

### Detalhes tecnicos

| Arquivo | Mudanca |
|---|---|
| `src/components/institution/StudentTriageTab.tsx` | Adicionar tooltips nos cards de resumo, enriquecer tooltips existentes nas metricas, adicionar tooltips na tendencia/registros/historico |

Apenas um arquivo modificado. Sem mudancas em logica ou banco de dados.

