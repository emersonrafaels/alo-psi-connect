# Momento com o Buddy: apenas um botão

No card "Momento com o Buddy" da página inicial:

- **Usuário institucional:** remover o botão de check-in/recomendação. Fica só "Falar com o Buddy", que continua abrindo o chat do Buddy da instituição.
- **Demais usuários (alunos etc.):** remover o botão de check-in/recomendação. Fica só "Falar com o Buddy", agora abrindo o WhatsApp da Rede Bem-Estar (+55 11 93707-4332) em nova aba, com mensagem pronta ("Olá! Quero falar com o Buddy da Rede Bem-Estar."), com ícone de WhatsApp e estilo principal.

## Detalhes técnicos
- Arquivo: `src/components/buddy/BuddyDailyBrief.tsx`; remover `ctaAction`/`ctaLabel` e o hook de recomendação se ficar sem uso (mantém a frase de descoberta).
- Número: usa o WhatsApp do tenant (`contact_whatsapp`) quando existir, com fallback `5511937074332`, igual ao botão flutuante.
