# Escalas e WHO-5 para os alunos da Afya

## Situação
Os 2.800 alunos da Afya (Contagem, Montes Claros e Itajubá) são fictícios e não têm conta de acesso. As respostas de escalas da plataforma só podem ficar ligadas a alunos com conta. Por isso, hoje o Comparador da Afya mostra o Diário Emocional, mas as escalas aparecem vazias.

## O que será feito
- Criar respostas fictícias para as 6 escalas (WHO-5, PSS-10, GAD-7, PHQ-9, ISI, MHC-SF) em três coletas semestrais: 2025.2, 2026.1 e 2026.2.
- **Participação realista:** cerca de 55% respondem ao WHO-5 em 2026.2, com cobertura menor nas coletas anteriores e em cada uma das outras escalas.
- **Resultados coerentes com o que já existe:** quem tem humor mais baixo no Diário ou está em risco na triagem tende a ter pior bem-estar e mais sintomas.
- **Diferenças entre os grupos:** Montes Claros um pouco melhor que Contagem, Itajubá intermediária, cursos e turnos com variações discretas, e leve melhora de um semestre para o outro.
- Todos os valores respeitam a faixa de cada escala e as respostas ficam marcadas como dados de demonstração.
- IQoL continua zerado.

## Resultado
O Comparador da Afya passa a mostrar médias, cobertura, mapa de unidades e cursos, tendência em 3 coletas e a Análise Integrada preenchidos.

## Técnico
- Nova tabela `institution_demo_scale_responses` (patient_id, institution_id, scale_code, taken_at, raw_score), com acesso apenas pela função do Comparador (sem leitura direta pelos usuários).
- `get_institution_comparator` passa a juntar essas respostas às respostas reais, além de aplicar no servidor o filtro de grupos com menos de 10 respondentes.
- Preenchimento por SQL de uma única vez, com sorteio guiado pelo humor médio de cada aluno.
