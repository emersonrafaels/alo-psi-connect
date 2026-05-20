## Objetivo

Na página `/contato`, substituir o `Input` de texto livre do campo "Assunto" por um `Select` com opções pré-definidas. Quando "Outros" for selecionado, exibir um campo de texto adicional para o usuário detalhar o assunto.

## Opções do Select

1. Sou estudante e gostaria de ser atendido.
2. Sou terapeuta e gostaria de oferecer meus serviços.
3. Sou representante de uma instituição/empresa e gostaria de contar com os serviços da Rede Bem-Estar.
4. Não sou estudante, mas gostaria de agendar um atendimento.
5. Apenas gostaria de entender mais a respeito dos serviços oferecidos.
6. Outros

## Alterações técnicas

Arquivo: `src/pages/Contact.tsx`

- Adicionar import dos componentes `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem` de `@/components/ui/select`.
- Definir constante com a lista de assuntos.
- Adicionar `customSubject` ao state `formData` (string vazia inicial).
- Substituir o `<Input name="subject">` por `<Select>` com as 6 opções acima, controlado por `formData.subject`.
- Quando `formData.subject === "Outros"`, renderizar um `<Input name="customSubject">` logo abaixo (placeholder: "Descreva o assunto") obrigatório.
- Ajustar validação no `handleSubmit`: exigir `subject`; se `subject === "Outros"`, exigir `customSubject`.
- No envio para a edge function `send-contact-email`, mandar como `subject` o valor selecionado, ou o `customSubject` quando a opção for "Outros" (assim o e-mail mantém o assunto descritivo sem necessidade de mudanças no backend).
- Resetar `customSubject` junto ao reset do form após sucesso.

## Fora do escopo

- Nenhuma mudança na edge function `send-contact-email`.
- Nenhuma mudança de estilo/layout além do necessário para acomodar o novo campo condicional.