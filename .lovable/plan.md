# Novo tour de boas-vindas do Portal Institucional

Hoje o tour que abre ao entrar no portal ainda fala de "abas", "Bem-Estar", "Métricas Avançadas" e de atalhos que não existem mais. A ideia é trocá-lo por um tour mais dinâmico, que siga o menu lateral atual.

## O que muda para o usuário
- Uma janela de boas-vindas com o nome da instituição, uma animação de entrada, indicador de progresso em pontos e a ilustração ou ícone de cada parte do portal.
- O tour segue o menu lateral atual, em grupos:
  1. Boas-vindas: o que o portal oferece e o compromisso com a privacidade (alunos aparecem só como "Aluno #N").
  2. Painel: Visão Geral (ações a tomar e resumo executivo do Buddy), Métricas e Diário Emocional.
  3. Cuidado: Triagem, Mensagens, Notas e Buddy.
  4. Gestão: Alunos, Profissionais, Apoios, Cupons e Radar Institucional.
  5. Análises: Comparador (Visão geral, Jornada de cuidado, Atendimentos, Diário, Conteúdos, NED Nacional e Radar de Permanência).
  6. Encerramento: um card com atalhos rápidos para as páginas novas (Triagem, Comparador, Mensagens e Apoios).
- Em cada etapa, o item correspondente do menu lateral fica destacado. No celular, a etapa aparece centralizada, sem destaque, porque o menu fica escondido.
- Cada etapa tem um botão "Abrir agora", que leva direto para aquela página e encerra o tour.
- O tour volta a aparecer uma vez para todos os usuários, já que o conteúdo mudou. O botão de reiniciar o tour continua no topo.

## Detalhes técnicos
- Reescrever os passos em `useInstitutionTour.ts`, mudando a chave salva no navegador para `institution-portal-tour-v2`. Os passos passam a ter ícone, grupo, href e um alvo `[data-tour="nav-<id>"]`.
- Adicionar `data-tour` aos itens de `PortalSidebar.tsx`.
- Evoluir o `InstitutionTour` para um diálogo próprio, com transições usando tokens do tema, pontos de progresso e o botão "Abrir agora" (feito com navigate e tenant-aware), mantendo o destaque do item no menu.
- Remover a etapa de atalhos de teclado que não existem mais.
