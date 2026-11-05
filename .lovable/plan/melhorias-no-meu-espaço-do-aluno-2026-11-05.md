# Melhorias no "Meu espaço" do aluno

## 1. Encontro em breve com detalhes (pedido principal)
- Título: nome do encontro (ex.: "Roda de conversa: Ansiedade nas provas").
- Descrição: data e hora ("Hoje, 19h00" / "Amanhã, 14h30 · Qui, 6 nov"), tipo (Workshop/Roda) e contagem regressiva ("começa em 3 h").
- Botão muda para "Entrar agora" quando faltar 15 min (mesma regra da página de Encontros) e abre direto o link da sala; antes disso, "Ver encontro" abre a página do próprio encontro, não a lista.
- Se houver mais de um encontro em 24 h, mostra o mais próximo e "+1 outro encontro".

## 2. Outras melhorias sugeridas
1. **Pendências mais informativas:** diário mostra a sequência atual ("Registre hoje para manter 5 dias seguidos"); escalas mostram nome e quando foi a última resposta; Radar mostra quantas perguntas faltam se houver rascunho.
2. **Próximos compromissos:** cada item com data, hora, nome, tipo (encontro/consulta) e profissional; botão "Adicionar à agenda" (arquivo de calendário).
3. **Indicadores:** clicar num card abre o Diário com o gráfico daquele indicador; frase curta de leitura ("Seu sono melhorou nesta semana").
4. **Encontros recomendados:** 2-3 próximos encontros abertos em que o aluno ainda não se inscreveu, com inscrição em um clique.
5. **Prática sugerida do dia:** uma prática curta ligada ao indicador que mais caiu na semana.
6. **Conquistas leves:** sequência do diário, práticas concluídas no mês, encontros participados.
7. **Atalho de ajuda:** cartão discreto "Precisa de apoio agora?" com Biblioteca de Apoios e telefone institucional/CVV 188.

## Detalhes técnicos
- `pendingActions.ts`: trocar `nextSessionAt` por `nextSession { id, title, startsAt, type, meetingUrl, otherCount }`; formatação de data em pt-BR; adicionar testes para título/hora, "Entrar agora" a 15 min e múltiplos encontros.
- `StudentHome.tsx`: buscar título/tipo/link via inscrições em `group_session_registrations` + `group_sessions` (apenas dados do próprio aluno, RLS existente).
- Itens 2-7 apenas no frontend com dados já acessíveis ao aluno; nada novo exposto à instituição.

Sugestão: implementar o item 1 já, e escolher quais itens da seção 2 entram.
