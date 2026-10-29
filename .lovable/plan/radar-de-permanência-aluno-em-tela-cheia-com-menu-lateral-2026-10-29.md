# Radar de Permanência (aluno) em tela cheia com menu lateral

## O que muda
- A página do aluno deixa de mostrar o cabeçalho e o rodapé do site e passa a ocupar a tela inteira.
- Barra superior fina: logo da Rede Bem-Estar, título "Radar de Permanência", botão **Voltar** (leva à página em que o aluno estava antes; se ele abriu o link direto, volta para a página inicial) e o aviso de status de salvamento.
- Menu lateral "Seu percurso", como na imagem:
  - progresso total ("0 de 47") com barra;
  - lista numerada dos temas, com respondidas/total de cada um ("0/3"), tema atual destacado e marca de concluído;
  - clicar num tema leva direto a ele.
- Área principal: cabeçalho do tema ("Tema 1 de 10", título, descrição, nº de perguntas), as perguntas, e os botões Anterior / Próximo / Enviar.
- No celular, o menu lateral vira um botão "Seu percurso" que abre a lista em painel deslizante.
- Histórico de respostas e regras de envio continuam iguais.

## Detalhes técnicos
- Só `src/pages/PermanenceRadar.tsx`: remover Header/Footer, layout `h-screen` com aside fixo + main com scroll; Voltar usa `navigate(-1)` quando `window.history.state?.idx > 0`, senão `/`.
- Cores via tokens do tema (sem cores fixas); pílulas atuais de temas substituídas pelo menu.
