# Comparador — página "Conteúdos e práticas" (réplica do desenho)

Ativar o item "Conteúdos e práticas" (hoje "Em breve") no menu do Comparador, com o mesmo seletor de Unidade e Semestre, botão de ampliar cada ficha e visual fiel ao desenho. Contamos pessoas e acessos, nunca listas de quem participou.

## Seções (na ordem do desenho)
1. Cabeçalho "O que os estudantes procuram para se cuidar".
2. Do catálogo ao cuidado: escada O que existe → Abriram → Foram até o fim → Disseram que ajudou, com escolha de formato (Todos, Conteúdos, Trilhas, Práticas, Encontros), conversão entre degraus, comparação por unidade e frase de destaque.
3. Mapa de temas (procura x oferta): gráfico de dispersão com linha de proporção, alternância gráfico/tabela, lacunas destacadas, e painel do tema selecionado (números, procura ao longo do semestre com semanas de prova, peso por unidade, sugestão de leitura).
4. Quando cada tema é procurado: mapa de calor semanal por tema, clicar abre o tema no mapa.
5. Trilhas: tabela (iniciaram, concluíram, último mês, tendência), temas sem trilha e frase de destaque.
6. Práticas: escolha da prática, quantas vezes e % que ajudou, de onde as pessoas vêm, o que fazem depois, a que horas praticam, e o aviso "não é redução clínica".
7. Encontros, rodas e oficinas: totais por tipo, tabela com inscritos/presentes, presença, nota, "Lotou" e botão "Ver agenda de encontros".
8. Continue a leitura.

## De onde vêm os dados
- Práticas: registros reais de práticas realizadas (cerca de 6.400), com nota de utilidade e horário. "De onde vêm" e "o que fazem depois" serão derivados da atividade da mesma pessoa no mesmo dia (diário, Jornada, Buddy, apoios), somente em totais.
- Encontros: encontros e inscrições reais (presença, lista de interesse, avaliações).
- Conteúdos, temas e trilhas: a plataforma ainda não registra acessos por tema, buscas sem resultado nem progresso de trilhas. Vou criar esse registro (temas, acessos semanais, trilhas iniciadas/concluídas) e preencher dados demonstrativos para a Afya, sem casos de estudo protegidos e sem notificações. Para outras instituições essas fichas mostram "Ainda sem dados".
- Semanas de prova: mesma regra do Diário (contexto "Provas" bem acima do normal).

## Privacidade
Só totais; grupos com menos de 10 pessoas ficam ocultos.

## Detalhes técnicos
- Tabelas novas `institution_content_theme_weeks` (tema, unidade, semana, acessos, buscas sem resultado, conteúdos disponíveis, % útil) e `institution_trail_progress` (trilha, tema, formato, unidade, iniciaram, concluíram, último mês), com GRANTs e RLS (equipe da instituição lê, admin altera).
- Função agregada `get_institution_contents_practices(institution)` reunindo escada, temas, trilhas, práticas (origem/seguimento/horário/utilidade) e encontros.
- UI em `src/features/institution/comparator/contents/` (`ContentsView.tsx` + regras puras `contentsLogic.ts` com testes: conversão entre degraus, lacuna tema, pico semanal, tendência de trilha, presença).
- Registrar a decisão no AGENTS.md.
