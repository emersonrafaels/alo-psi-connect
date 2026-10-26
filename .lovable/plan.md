# Corrigir a tela branca no chat do Buddy da instituição

A causa ainda não foi confirmada. Os registros do preview não mostram nenhum erro, e o modo de planejamento não deixa rodar o navegador de teste. Por isso, o primeiro passo é reproduzir o problema.

## Passos
1. **Reproduzir:** abrir `/buddy/instituicao` no navegador de teste, clicar em uma pergunta rápida e capturar o erro que derruba a tela. Isso será feito duas vezes: com uma resposta simulada do Buddy e com a resposta real.
2. **Corrigir a causa encontrada.** Os principais suspeitos estão no chat:
   - como cada pedaço da resposta é exibido enquanto chega (formatação com markdown);
   - a atualização da última mensagem durante a resposta;
   - a rolagem automática;
   - o tratamento de erro da chamada.
3. **Proteção extra:** colocar uma proteção em volta das mensagens. Se algo falhar, aparece "Não consegui mostrar a resposta" com um botão de tentar de novo, em vez da tela branca.
4. **Verificar:** repetir o clique nas perguntas rápidas e o envio de texto. As duas ações devem mostrar a pergunta, o aviso "Buddy está analisando" e depois a resposta, sem tela branca.

## Detalhes técnicos
- Arquivo: `src/pages/buddy/BuddyInstitutionChat.tsx`.
- No teste, a função `buddy-institution-chat` será substituída por uma resposta simulada em texto em streaming. Serão capturados `pageerror` e os erros do console.
- Se a resposta real falhar no servidor, conferir os logs da função `buddy-institution-chat`.
