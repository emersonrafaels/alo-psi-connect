# Aba Métricas do portal institucional: novo visual e novas métricas

Hoje a aba mostra só agendamentos (total, sucesso, cancelamento), uma linha de crescimento e os 5 profissionais mais agendados, com cores fixas e alertas genéricos. A proposta é transformar a aba num painel de **uso da plataforma e engajamento**, sempre com dados agregados e alunos anônimos.

## O que o gestor vai ver

**1. Barra de filtros no topo**
- Período: 7, 15, 30, 90 dias (padrão 30), com comparação automática ao período anterior.
- Filtro por unidade e curso (opcional).
- Botão "Exportar CSV" só com números agregados.

**2. Linha de destaques (6 cards iguais, com variação vs. período anterior e mini-gráfico)**
- Alunos ativos no período (e % da base)
- Ativos semanais / mensais (adesão recorrente)
- Registros no diário emocional
- Práticas concluídas
- Escalas respondidas (WHO-5, PSS-10, GAD-7, PHQ-9)
- Agendamentos realizados (taxa de comparecimento)

**3. Uso por recurso (novo)**
- Barras horizontais: quantos alunos usaram Diário, Jornada emocional, Práticas, Escalas, Encontros, Apoios e Buddy.
- Funil de adesão: Vinculados → Primeiro acesso → Usou 1 recurso → Usou 3+ recursos → Ativo recorrente.

**4. Ritmo de uso (novo)**
- Linha semanal de alunos ativos (12 semanas).
- Mapa de calor dia da semana x faixa de horário, para escolher melhores horários de encontros e mensagens.
- Retenção: % dos alunos que voltam após 1, 2 e 4 semanas.

**5. Adesão por curso e unidade (novo)**
- Tabela ordenável: alunos, % ativos, recurso mais usado, tendência. Grupos com menos de 10 alunos ficam ocultos, como no Comparador.

**6. Atendimentos (reformulado)**
- Agendamentos, comparecimento, cancelamento e tempo médio entre agendar e atender.
- Crescimento de profissionais e alunos (12 meses), com as cores do tema.
- Top profissionais mantido.

**7. Encontros e comunicação (novo)**
- Inscrições x presença em encontros; mensagens enviadas e taxa de leitura.

**Visual:** cards com o mesmo estilo da Visão Geral, cores do tema (funciona no modo escuro), tooltips explicando cada métrica, estados vazios claros por seção e carregamento por seção (uma parte lenta não trava a página). A caixa de "Alertas e Notificações" sai daqui, porque essas ações já aparecem na Visão Geral.

## Privacidade
- Só números agregados chegam à tela; nenhum aluno individual, nenhum texto de diário.
- Grupos com menos de 10 alunos ficam ocultos.

## Detalhes técnicos
- Nova RPC `get_institution_usage_metrics(p_institution_id, p_days, p_unit, p_course)`, security definer, que confere se quem chama é membro da instituição e devolve JSON com KPIs + período anterior, séries semanais, uso por recurso, funil, mapa de calor, retenção, tabela por curso (n<10 suprimido), encontros e mensagens. Fontes: mood entries, journey_sessions, práticas, respostas de escalas, apoios usados, inscrições em group_sessions, message_threads, appointments.
- RPCs atuais de crescimento e engajamento mantidas para a seção de atendimentos.
- Nova pasta `src/features/institution/metrics/` (página, cards, seções, `usageMetrics.ts` com funções puras de variação/retenção/funil e testes); `InstitutionAnalyticsDashboard` passa a delegar para ela. Gráficos lazy-loaded.
- Registrar a regra no `AGENTS.md`.

## Ficou de fora (posso incluir se quiser)
- Metas por instituição e alertas automáticos por email.
