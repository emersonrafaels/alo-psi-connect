# Mostrar todos os alunos em "Alunos específicos"

A lista já carrega todos os alunos da instituição, mas a tela mostra só os 100 primeiros.

- Mostrar todos os alunos na lista de seleção, que continua com rolagem.
- Exibir acima da lista quantos alunos aparecem, por exemplo "2.806 alunos" ou "12 de 2.806" durante a busca.
- A busca por "Aluno #N" continua funcionando.

## Detalhes técnicos
- `Composer.tsx`, `MultiPick`: remover `.slice(0, 100)` e adicionar o contador.
- Conferir o limite de alunos escolhidos aceito por `send-message` e ampliá-lo se ficar abaixo do total da instituição.
