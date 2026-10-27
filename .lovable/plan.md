# Novo visual dos e-mails de mensagens e de divulgação de apoios

Os e-mails enviados pela mensageria (comunicados e "Novo apoio disponível") vão seguir o mesmo layout dos outros e-mails da Rede Bem-Estar:

- **Topo roxo** com "Rede Bem-Estar" e, abaixo, o nome de quem enviou: a instituição (por exemplo, "Afya") ou "Rede Bem-Estar".
- **Corpo em cartão branco** com o assunto em destaque, uma saudação ("Olá!") e o texto bem espaçado. Links escritos no texto passam a ser clicáveis.
- **Botão centralizado "Ver e responder no site"**, separado do texto, para não ficar sobreposto como no print.
- **Quadro de privacidade** para alunos que receberem mensagens de instituição: "Você pode responder anonimamente. A instituição não tem acesso aos seus dados do diário, escalas ou práticas."
- **Rodapé cinza** com "Conectando você ao cuidado", o aviso de e-mail automático e "© 2026 Rede Bem-Estar".

## Detalhes técnicos
- Criar um template de e-mail em `send-message/emailTemplate.ts` (HTML com estilos inline, cor #5B218E, mesma estrutura de `notify-institution-link`), com escape do texto e links transformados em `<a>`.
- Usar esse template em `send-message/index.ts`, passando o nome da instituição; adicionar um texto simples alternativo (`text`).
- Adicionar um teste para conferir o escape do texto e a transformação dos links.
- Publicar `send-message` de novo.
