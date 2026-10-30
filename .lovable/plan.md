# Checkup completo do Portal Institucional

## Objetivo
Conferir cada número do portal contra os dados reais do banco e garantir que, quando um aluno ativo registrar ou alterar algo (diário, práticas, escalas, encontros, apoios, radar, agendamentos), o portal mostre essa mudança.

## Etapa 1 — Mapear a origem de cada número
Para cada seção (Visão geral, Triagem, Alunos, Métricas, Apoios, Mensagens e as 8 abas do Comparador), listar de onde o número vem:
- dado vivo (calculado na hora a partir dos registros dos alunos), ou
- tabela fixa de demonstração (não muda quando o aluno age).

Já se sabe que algumas abas foram criadas com dados demonstrativos fixos (Conteúdos e práticas, NED Nacional, Atendimentos, parte do Radar de Permanência). O checkup confirma isso item a item.

## Etapa 2 — Conferir os números
Para Afya e EBMSP, recalcular direto no banco os principais indicadores (alunos ativos, engajados 7 dias, taxa de atividade, triagem pendente, médias de humor/sono, escalas, práticas, radar) e comparar com o que o portal exibe. Divergências viram itens de correção, com causa confirmada pelos dados.

## Etapa 3 — Teste de ponta a ponta com aluno real
Usando o aluno do Caso A (conta ativada da Afya):
1. Registrar diário, fazer uma prática, responder uma escala e atualizar o radar.
2. Abrir o portal como gestor e verificar se Visão geral, Triagem, Histórico do aluno, Métricas e Comparador mudaram.
3. Registrar o que mudou e o que não mudou.

Observação: abas que escondem grupos com menos de 10 alunos podem não mudar visivelmente com um único aluno — isso é proteção de privacidade, não erro.

## Etapa 4 — Corrigir
- Números errados: ajustar os cálculos.
- Abas com dados fixos: passar a calcular a partir dos registros reais quando houver registro correspondente na plataforma (ex.: práticas, encontros, apoios, agendamentos pagos). Onde a plataforma não coleta aquele dado, manter o demonstrativo e mostrar um selo "dado demonstrativo".
- Atualização: garantir que o portal busque dados novos ao abrir/voltar à página (sem cache antigo).

## Etapa 5 — Relatório
Entregar uma tabela simples: seção, indicador, origem (real/demonstrativo), conferido (sim/não), corrigido.

## Detalhes técnicos
- Fontes a auditar: RPCs `get_institution_wellbeing_summary`, `get_institution_usage_metrics`, `get_institution_comparator`, `get_institution_care_journey`, `get_institution_appointments_capacity`, `get_institution_diary_rhythm`, `get_institution_permanence`, `get_institution_critical_flags`, e tabelas agregadas `institution_content_theme_weeks`, `institution_trail_progress`, `institution_practice_usage`, `institution_event_usage`, `institution_ned_snapshots`, `institution_service_appointments`.
- Conversão de tabelas fixas em dados vivos via novas RPCs agregadas (mantendo n<10 oculto e anonimização `Aluno #N`).
- Revisar `staleTime`/invalidação do React Query nos hooks do portal.
- Casos de estudo protegidos não recebem notificações durante o teste.
- Adicionar testes para cada regra de cálculo corrigida.
