# Popular dados do Buddy para os alunos da Carta Consulta

Os 10 alunos vinculados à Carta Consulta já têm diário emocional (50 registros cada, exceto Boris Johnson com 3), mas nada do restante que alimenta o Buddy: retrato, escalas, análises de risco, práticas, contatos de emergência e insights. Este plano preenche tudo isso com dados fictícios coerentes por aluno.

## O que será criado por aluno

- **Retrato do Buddy**: o que está na mente, o que acalma, sonhos, valores, gatilhos, três palavras, forças, desafio atual, próximos 3 meses, rede de apoio e níveis (ansiedade, tristeza, motivação, sono, estresse, energia).
- **Escalas emocionais**: 2 a 3 respostas por aluno nas escalas ativas (ex.: bem-estar, ansiedade, depressão), espalhadas nos últimos ~150 dias, com pontuação, severidade e respostas item a item plausíveis.
- **Índice ISEU**: um score consolidado com faixa (verde/amarelo/laranja/vermelho) coerente com as escalas.
- **Análises do diário**: análise de risco + mensagem do Buddy em uma parte dos registros de humor recentes.
- **Práticas**: 3 a 8 práticas concluídas em datas variadas.
- **Contatos de emergência**: 1 a 2 contatos por aluno (nome, relação, telefone).
- **Insights do Buddy**: um registro pronto com narrativa, forças, pontos de atenção, tópicos do mapa de conhecimento e recomendações — escrito à mão (sem custo de IA), coerente com o perfil de cada aluno.

## Perfis de aluno

Para os dados não parecerem repetidos, cada aluno recebe um dos perfis abaixo, e todos os dados (escalas, retrato, insights, práticas) seguem esse perfil:

- **Estável e engajado** — bem-estar alto, boa constância de hábitos.
- **Ansiedade acadêmica** — picos de ansiedade em provas, sono irregular.
- **Sono desregulado** — energia baixa, humor oscilante.
- **Em recuperação** — começou baixo e vem melhorando.
- **Atenção necessária** — humor baixo persistente, isolamento; risco moderado/alto nas análises.

## Detalhes técnicos

- Execução por comandos de inserção de dados (sem alteração de schema).
- Alvo: os 10 `patient_id` já vinculados à instituição Carta Consulta.
- Tabelas populadas: `buddy_portraits`, `emotional_scale_responses`, `iseu_scores`, `mood_entry_analyses`, `praticas_checkouts`, `patient_emergency_contacts`, `buddy_insights`.
- 9 dos 10 alunos são perfis demo sem conta no Auth (`profiles.user_id` nulo). Como as tabelas de escalas/ISEU/práticas são chaveadas por usuário, será usado o `profiles.id` do aluno como chave nesses registros, mantendo consistência interna dos dados demo.
- Consequência esperada: os dados alimentam o portal institucional, agregados de bem-estar, triagem e o painel do Buddy institucional. Como esses alunos não têm login, não é possível abrir a tela pessoal do Buddy como o aluno — isso exigiria criar contas de acesso (fora do escopo definido).
- As escalas usadas serão apenas as ativas em `emotional_scales`, respeitando os itens reais de cada escala para que a pontuação faça sentido.
- Boris Johnson (aluno real, com login) recebe o mesmo tratamento, com registros chaveados pelo seu `user_id` real, para que o Buddy dele funcione de verdade.
