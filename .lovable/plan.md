# Melhorar UX/UI do Diário Emocional (/diario-emocional)

Hoje a página empilha: título centralizado, aviso LGPD, 3 cards de números soltos, card "Como você está hoje?" e lista de entradas recentes. A ação principal (registrar o dia) fica abaixo dos números e tudo tem o mesmo peso visual.

## O que muda

1. **Topo com ação principal em destaque**
   - Cabeçalho alinhado à esquerda: título, data de hoje e frase curta.
   - Card "Hoje" logo no topo: se ainda não registrou, botão grande "Registrar meu dia"; se já registrou, mostra o resumo do dia (emojis e notas principais) com "Editar" e "Ver análise".

2. **Sequência e semana em uma faixa só**
   - Substitui os 3 cards por uma faixa com: dias seguidos registrando, entradas na semana (7 bolinhas, uma por dia, preenchidas quando há registro) e total de entradas.

3. **Média dos 7 dias mais clara**
   - Mantém o seletor em pílula (humor, energia, sono…), mas com o valor grande, emoji correspondente e comparação com a semana anterior (subiu / caiu / igual), mais uma mini linha dos 7 dias.

4. **Entradas recentes mais legíveis**
   - Lista em formato de linha do tempo: data, emojis das emoções, trecho da reflexão e tags; clique abre a entrada. Estado vazio amigável com convite para o primeiro registro.
   - Atalhos para Histórico, Padrões e Análises no fim da lista.

5. **Aviso de privacidade discreto**
   - Vai para o rodapé da página como uma linha com cadeado e "Saiba mais" (mesmo conteúdo LGPD atual).

6. **Celular**: faixa de números rola horizontalmente, botão "Registrar meu dia" fica fixo no rodapé quando ainda não houve registro.

## Detalhes técnicos
- Arquivo: `src/pages/MoodDiary.tsx` (pode extrair `DiaryTodayCard`, `DiaryWeekStrip`, `DiaryRecentList` em `src/features/mood-diary/home/`).
- Só apresentação: mesmos dados e consultas; números inteiros sem decimais e "N/A" para nulos (regras existentes); upsert e templates intocados.
- Cores via tokens semânticos, legíveis em claro e escuro.
- Validar com Playwright logado como aluno (claro e escuro, desktop e celular).
