# Novo visual dos emails de lembrete

Hoje o lembrete é um email simples (título verde e lista). Ele passará a seguir o mesmo padrão das mensagens da Rede Bem-Estar, no idioma salvo no perfil do aluno (PT, EN ou ES; PT quando não houver).

## Como fica o email
- Cabeçalho roxo da marca "Rede Bem-Estar" com subtítulo "Seus lembretes" (traduzido).
- Saudação com o primeiro nome do aluno ("Olá, Emerson!" / "Hi, Emerson!" / "¡Hola, Emerson!").
- Frase curta de introdução e cada lembrete como um cartão com ícone e um botão próprio:
  - Diário parado → "Registrar agora" (abre o novo registro do diário)
  - Radar do semestre → "Responder Radar"
  - Encontro de hoje → "Ver encontro" (abre Encontros)
- Botão principal "Abrir Meu espaço".
- Caixa de privacidade discreta (seus registros são confidenciais).
- Rodapé padrão com link para ajustar/desligar lembretes e o ano, tudo traduzido.
- Assunto e versão em texto simples também no idioma do aluno.

## Detalhes técnicos
- Criar `supabase/functions/send-reminders/emailTemplate.ts` (pure `renderReminderEmail({ lang, name, items })`) reutilizando cores/estrutura de `send-message/emailTemplate.ts`.
- `buildFilteredReminders` passa a devolver itens com `type` + `text` para escolher ícone e link; textos novos (saudação, intro, botões, rodapé, privacidade) adicionados ao dicionário `T` em `rules.ts`.
- Links sempre em `https://redebemestar.com.br`; remetente segue `noreply@redebemestar.com.br`.
- Testes: idioma EN/ES/PT e fallback para PT; texto escapado; atualizar testes existentes. Reimplantar `send-reminders`.
