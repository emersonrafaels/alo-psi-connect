# Remover a etiqueta LIBRAS dos encontros

- Desmarcar a opção LIBRAS em todos os encontros que estão com ela ativa (inclusive "Respiração e regulação emocional na prática" e "Ansiedade antes das provas finais").
- Os encontros continuam existindo, com as mesmas datas, vagas e descrições.
- A opção continua disponível no cadastro de encontros, caso um evento futuro tenha intérprete.

## Detalhes técnicos
- Alteração de dados: `UPDATE group_sessions SET has_libras = false WHERE has_libras = true`.
- Nenhuma mudança de código.
