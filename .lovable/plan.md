# Comparador — página "Atendimentos" (réplica do desenho)

Substituir o item "Atendimentos" (hoje "Em breve") do menu do Comparador por uma página completa, seguindo o desenho anexo fielmente (cores, tamanhos, espaçamentos, botão de ampliar cada ficha), com o mesmo seletor de Unidade e Semestre já usado na Jornada de cuidado.

## Seções (na ordem do desenho)
1. Cabeçalho: "A oferta de cuidado acompanha a procura?" + texto do semestre selecionado.
2. Quatro números: Consultas realizadas (e pessoas atendidas), Comparecimento (faltas sobre marcadas), Ocupação da agenda, Espera mediana até a 1ª consulta (com comparação ao semestre anterior).
3. Procura x horas ofertadas por serviço (Psicologia, Psiquiatria, Núcleo da unidade, Mentoria) com etiqueta "Acima da capacidade / No limite / Sobra agenda" e frase-resumo automática.
4. Quando os estudantes procuram apoio: mapa de calor dia x período (manhã, tarde, noite, madrugada).
5. Procura x agenda por período, com a diferença em pontos percentuais e frase-resumo.
6. Núcleos de cada unidade: escolha da medida (ocupação, espera, comparecimento, horas à noite, horas por semana), barras por unidade com linha da média, ficha da unidade com 6 indicadores vs média e destaque "Referência" para a melhor.
7. Como foi o atendimento (nota média, nº de respostas, % que indicariam) e Por que faltam à consulta (motivos em barras).

As frases de destaque são geradas a partir dos números reais, não fixas.

## Privacidade
Só números agregados; nenhum conteúdo de consulta ou identidade. Unidades/serviços com menos de 10 consultas aparecem ocultos, como nas outras páginas.

## Dados
- Consultas, faltas, espera e horários de procura vêm dos agendamentos dos alunos da instituição; horas ofertadas vêm da agenda dos profissionais vinculados.
- Itens que a plataforma ainda não registra: tipo de serviço da consulta, motivo da falta e avaliação do atendimento. Serão adicionados como campos novos (opcionais) e preenchidos com dados demonstrativos para Afya e EBMSP, sem tocar nos casos de estudo protegidos e sem enviar notificações. Para instituições reais, essas fichas mostram "Ainda sem dados" até começarem a ser registrados.

## Detalhes técnicos
- Nova função agregada `get_institution_appointments_capacity(institution, unit, semester)` (security definer, acesso pelo mesmo controle da Jornada), retornando KPIs, serviços, heatmap, períodos, unidades e motivos.
- Colunas novas em `agendamentos`: `service_type`, `no_show_reason`, `rating`, `would_recommend` (nulas por padrão).
- UI em `src/features/institution/comparator/appointments/` (`AppointmentsView.tsx` + regras puras `appointmentsLogic.ts` com testes: status de capacidade 115%/80%, lacuna por período, alerta por medida, frases).
- Registrar a decisão no AGENTS.md.
